import { createClient } from '@supabase/supabase-js';

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

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const BUCKET_NAME = 'documents';

/**
 * Helper to convert File to Data URL string
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get a secure access URL for a file in private Supabase Storage.
 * Generates a signed URL valid for 1 hour for private bucket files.
 */
export async function getFileAccessUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
  if (!supabase || !isSupabaseConfigured() || !filePath) {
    return filePath;
  }

  // If path is already a full URL or Data URL, return directly
  if (filePath.startsWith('http') || filePath.startsWith('data:')) {
    return filePath;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn('Failed to get signed URL from Supabase:', err);
    return filePath;
  }
}

/**
 * Upload a file or Data URL to Supabase Storage in the private 'documents' bucket.
 * Gracefully fallbacks to returning data URL if Supabase DNS resolution or connection fails.
 */
export async function uploadDocumentFile(
  path: string,
  fileOrBase64: File | string,
  fileType: string = 'application/octet-stream'
): Promise<{ url: string; path: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    console.warn('Supabase Storage unconfigured or DNS invalid. Fallback to local Data URL.');
    const dataUrl = typeof fileOrBase64 === 'string' ? fileOrBase64 : await fileToDataUrl(fileOrBase64);
    return { url: dataUrl, path };
  }

  try {
    let body: Blob | File | ArrayBuffer;
    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.startsWith('data:')) {
        const res = await fetch(fileOrBase64);
        body = await res.blob();
      } else {
        return { url: fileOrBase64, path };
      }
    } else {
      body = fileOrBase64;
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, body, {
        contentType: fileType,
        upsert: true
      });

    if (error) {
      console.warn('Supabase Storage upload response warning:', error.message);
      const fallbackUrl = typeof fileOrBase64 === 'string' ? fileOrBase64 : await fileToDataUrl(fileOrBase64);
      return { url: fallbackUrl, path };
    }

    const fileUrl = await getFileAccessUrl(data.path);
    return {
      url: fileUrl,
      path: data.path
    };
  } catch (err: any) {
    console.warn('Supabase Storage network/DNS connection error (ERR_NAME_NOT_RESOLVED):', err?.message || err);
    const fallbackUrl = typeof fileOrBase64 === 'string' ? fileOrBase64 : await fileToDataUrl(fileOrBase64);
    return { url: fallbackUrl, path };
  }
}

/**
 * Delete a file from private Supabase Storage bucket.
 */
export async function deleteDocumentFile(filePath: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured() || !filePath) return true;

  try {
    let relativePath = filePath;
    if (filePath.includes(`${BUCKET_NAME}/`)) {
      relativePath = filePath.split(`${BUCKET_NAME}/`)[1].split('?')[0];
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([relativePath]);

    if (error) {
      console.warn('Supabase Storage delete warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase Storage delete network error:', err);
    return true;
  }
}
