import { createClient } from '@supabase/supabase-js';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from './firebase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('demo') &&
    !supabaseKey.includes('demo_publishable_key')
  );
};

// Client instance with publishable key for client-side signed URL reading helpers
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const BUCKET_NAME = 'documents';
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Helper to convert File object to Base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get a secure signed access URL for a file in private Supabase Storage.
 * Mediated via Firebase Callable Function when user is authenticated.
 */
export async function getFileAccessUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
  if (!filePath) return '';

  // If path is already a full URL or Data URL, return directly
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }

  let relativePath = filePath;
  if (filePath.includes(`${BUCKET_NAME}/`)) {
    relativePath = filePath.split(`${BUCKET_NAME}/`)[1].split('?')[0];
  }

  // 1. Try Firebase Callable Function (Backend Mediated with Service Role)
  if (auth && auth.currentUser) {
    try {
      const getSignedUrlFn = httpsCallable<{ path: string; expiresInSeconds?: number }, { success: boolean; url: string }>(
        functions,
        'getSignedStorageUrl'
      );
      const res = await getSignedUrlFn({ path: relativePath, expiresInSeconds });
      if (res.data?.url) {
        return res.data.url;
      }
    } catch (err: any) {
      console.warn('⚠️ [Backend Signed URL Notice] Cloud Function signed URL failed, attempting client signed URL:', err?.message || err);
    }
  }

  // 2. Client-side signed URL fallback via publishable key (READ ONLY)
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(relativePath, expiresInSeconds);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err) {
      console.warn('⚠️ [Client Signed URL Warning] Failed to generate signed URL:', err);
    }
  }

  return filePath;
}

/**
 * Upload a file to private Supabase Storage bucket.
 * Strictly mediated via Firebase HTTPS Callable Function (`uploadStorageFile`).
 * Direct browser Supabase Storage uploads are disabled to enforce security architecture.
 */
export async function uploadDocumentFile(
  path: string,
  fileOrBase64: File | string,
  fileType?: string
): Promise<{ url: string; path: string }> {
  // 1. Enforce Firebase Authentication
  if (!auth || !auth.currentUser) {
    throw new Error('Firebase authentication failure: You must be logged in to upload files to storage.');
  }

  let mimeType = fileType || 'application/octet-stream';
  let base64Payload = '';

  if (typeof fileOrBase64 === 'string') {
    base64Payload = fileOrBase64;
    if (fileOrBase64.startsWith('data:')) {
      const match = fileOrBase64.match(/^data:(.*?);base64,/);
      if (match) mimeType = match[1];
    }
  } else {
    if (fileOrBase64.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${(fileOrBase64.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed 50 MB limit.`);
    }
    mimeType = fileOrBase64.type || mimeType;
    base64Payload = await fileToBase64(fileOrBase64);
  }

  let relativePath = path;
  if (relativePath.startsWith(`${BUCKET_NAME}/`)) {
    relativePath = relativePath.substring(BUCKET_NAME.length + 1);
  }

  console.log(`📡 [Backend Storage Upload] Executing Cloud Function upload for path: ${relativePath}`);

  // 2. Invoke Firebase HTTPS Callable Cloud Function (Server-Side Mediated)
  try {
    const uploadFn = httpsCallable<
      { path: string; base64Data: string; mimeType: string },
      { success: boolean; path: string; url: string }
    >(functions, 'uploadStorageFile');

    const result = await uploadFn({
      path: relativePath,
      base64Data: base64Payload,
      mimeType
    });

    if (result.data && result.data.success) {
      console.log(`✅ [Backend Storage Upload Success] File uploaded to Supabase: ${result.data.path}`);
      return {
        url: result.data.url,
        path: result.data.path
      };
    } else {
      throw new Error('Cloud Function upload response returned invalid payload.');
    }
  } catch (err: any) {
    console.error('❌ [Backend Storage Upload Failure]:', err);

    if (err.code === 'functions/unauthenticated' || err.message?.includes('unauthenticated')) {
      throw new Error('Firebase authentication failure: Session expired or user not signed in.');
    }
    if (err.code === 'functions/failed-precondition' || err.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      throw new Error('Backend Cloud Function setup failure: SUPABASE_SERVICE_ROLE_KEY secret missing on server.');
    }
    if (err.code === 'functions/internal' || err.message?.includes('CORS') || err.message?.includes('fetch') || err.message?.includes('internal')) {
      throw new Error(
        'Backend Cloud Function unavailable: The Firebase Cloud Function endpoint (uploadStorageFile) is unreachable. Ensure the project is upgraded to the Firebase Blaze plan and functions are deployed via `npx firebase deploy --only functions`.'
      );
    }

    throw new Error(`Cloud Function upload failed: ${err.message || err}`);
  }
}

/**
 * Delete a file from private Supabase Storage bucket.
 * Strictly mediated via Firebase HTTPS Callable Function (`deleteStorageFile`).
 */
export async function deleteDocumentFile(filePath: string): Promise<boolean> {
  if (!filePath) return true;

  if (!auth || !auth.currentUser) {
    console.warn('⚠️ [Delete Storage File Warning] Unauthenticated delete request rejected.');
    throw new Error('Firebase authentication failure: You must be logged in to delete files.');
  }

  let relativePath = filePath;
  if (filePath.includes(`${BUCKET_NAME}/`)) {
    relativePath = filePath.split(`${BUCKET_NAME}/`)[1].split('?')[0];
  }

  console.log(`📡 [Backend Storage Delete] Executing Cloud Function delete for path: ${relativePath}`);

  try {
    const deleteFn = httpsCallable<{ path: string }, { success: boolean; path: string }>(
      functions,
      'deleteStorageFile'
    );
    const result = await deleteFn({ path: relativePath });
    console.log(`✅ [Backend Storage Delete Success] Removed file: ${result.data.path}`);
    return true;
  } catch (err: any) {
    console.error('❌ [Backend Storage Delete Failure]:', err);
    throw new Error(`Cloud Function delete failed: ${err.message || err}`);
  }
}
