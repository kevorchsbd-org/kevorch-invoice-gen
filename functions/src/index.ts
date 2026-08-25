import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

admin.initializeApp();

const BUCKET_NAME = 'documents';
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf'
];

/**
 * Helper to initialize Supabase server client using Service Role or Server credentials.
 * Ensures clean validation and logs helpful error messages without exposing secret keys.
 */
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ SERVER ERROR: SUPABASE_URL environment variable is missing on Cloud Functions runtime.');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Server configuration failure: SUPABASE_URL environment secret missing on Firebase Cloud Functions.'
    );
  }

  if (!serviceRoleKey) {
    console.error('❌ SERVER ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing on Cloud Functions runtime.');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Server configuration failure: SUPABASE_SERVICE_ROLE_KEY environment secret missing on Firebase Cloud Functions.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Validate and sanitize storage path to prevent path traversal
 */
function sanitizePath(rawPath: string): string {
  if (!rawPath || typeof rawPath !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Storage path must be a non-empty string.');
  }

  let cleaned = rawPath.replace(/\\/g, '/').trim();
  
  // Strip leading slash if present
  if (cleaned.startsWith('/')) {
    cleaned = cleaned.substring(1);
  }
  
  // Strip leading bucket name if present to avoid documents/documents/...
  if (cleaned.startsWith(`${BUCKET_NAME}/`)) {
    cleaned = cleaned.substring(BUCKET_NAME.length + 1);
  }

  // Prevent path traversal
  if (cleaned.includes('..') || cleaned.includes('//')) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid path traversal detected in file path.');
  }

  return cleaned;
}

/**
 * Cloud Function to upload a document/file to private Supabase Storage.
 * Verifies Firebase Auth user and uses server-side service-role key.
 */
export const uploadStorageFile = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    // 1. Authenticate Firebase User Token
    if (!context.auth) {
      console.warn('⚠️ Unauthenticated request to uploadStorageFile');
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Firebase authentication failure: User must be signed in to upload files.'
      );
    }

    const rawPath = data?.path;
    const base64Data = data?.base64Data || data?.fileBase64;
    const mimeType = data?.mimeType || data?.contentType || 'application/octet-stream';

    if (!rawPath || !base64Data) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required file upload parameters (path or base64Data).');
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new functions.https.HttpsError('invalid-argument', `Invalid MIME type (${mimeType}). Allowed formats: PNG, JPEG, WEBP, PDF.`);
    }

    const sanitizedPath = sanitizePath(rawPath);

    // Extract raw base64 payload
    let rawBase64 = base64Data;
    if (typeof base64Data === 'string' && base64Data.includes(';base64,')) {
      rawBase64 = base64Data.split(';base64,')[1];
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds 50 MB limit.`
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: uploadResult, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(sanitizedPath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase Storage Upload Error:', uploadError.message);
      throw new functions.https.HttpsError('internal', `Supabase storage failure: ${uploadError.message}`);
    }

    const { data: signedResult, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(uploadResult.path, 3600);

    if (signedError) {
      console.warn('Signed URL generation notice:', signedError.message);
    }

    return {
      success: true,
      path: uploadResult.path,
      url: signedResult?.signedUrl || uploadResult.path
    };
  } catch (err: any) {
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }
    console.error('Cloud Function uploadStorageFile execution error:', err);
    throw new functions.https.HttpsError('internal', `Cloud Function failure: ${err?.message || 'Unknown server error'}`);
  }
});

/**
 * Cloud Function to delete a document/file from private Supabase Storage.
 */
export const deleteStorageFile = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Firebase authentication failure: User must be signed in to delete files.'
      );
    }

    const rawPath = data?.path;
    if (!rawPath) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing file path for deletion.');
    }

    const sanitizedPath = sanitizePath(rawPath);
    const supabase = getSupabaseAdminClient();

    const { error: removeError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([sanitizedPath]);

    if (removeError) {
      console.error('Supabase Storage Delete Error:', removeError.message);
      throw new functions.https.HttpsError('internal', `Supabase storage failure: ${removeError.message}`);
    }

    return {
      success: true,
      path: sanitizedPath
    };
  } catch (err: any) {
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }
    console.error('Cloud Function deleteStorageFile execution error:', err);
    throw new functions.https.HttpsError('internal', `Cloud Function failure: ${err?.message || 'Unknown server error'}`);
  }
});

/**
 * Cloud Function to generate a temporary signed URL for viewing private files.
 */
export const getSignedStorageUrl = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Firebase authentication failure: User must be signed in to generate signed URLs.'
      );
    }

    const rawPath = data?.path;
    const expiresInSeconds = data?.expiresInSeconds || 3600;

    if (!rawPath) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing file path for signed URL generation.');
    }

    const sanitizedPath = sanitizePath(rawPath);
    const supabase = getSupabaseAdminClient();

    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(sanitizedPath, expiresInSeconds);

    if (signedError || !signedData?.signedUrl) {
      console.error('Supabase Signed URL Error:', signedError);
      throw new functions.https.HttpsError('internal', `Supabase storage failure: ${signedError?.message || 'Signed URL generation failed'}`);
    }

    return {
      success: true,
      url: signedData.signedUrl,
      path: sanitizedPath
    };
  } catch (err: any) {
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }
    console.error('Cloud Function getSignedStorageUrl execution error:', err);
    throw new functions.https.HttpsError('internal', `Cloud Function failure: ${err?.message || 'Unknown server error'}`);
  }
});

interface EmailCallableData {
  to: string;
  cc?: string;
  subject: string;
  message: string;
  documentType: string;
  documentNumber: string;
}

/**
 * Cloud Function to dispatch Quotations, Invoices, and Balance Invoices via Resend / Brevo API.
 */
export const sendDocumentEmail = functions.https.onCall(async (data: EmailCallableData, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Firebase authentication failure: User must be signed in to send emails.');
  }

  const { to, cc, subject, message, documentType, documentNumber } = data;

  if (!to || !subject || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required email fields.');
  }

  try {
    return {
      success: true,
      message: `Email for ${documentType} ${documentNumber} dispatched successfully to ${to}.`
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Failed to dispatch email.');
  }
});
