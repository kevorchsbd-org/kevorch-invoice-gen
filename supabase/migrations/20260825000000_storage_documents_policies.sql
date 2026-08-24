-- Migration: Supabase Storage Private Bucket "documents" RLS Security Policies
-- Architecture Note: Firebase Auth handles primary user authentication.
-- Supabase Storage operates with the frontend publishable key (anon role) on the private "documents" bucket.
-- All read/view access is mediated via temporary Signed URLs (createSignedUrl).

-- 1. Ensure private "documents" storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Keep bucket private
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. Enable Row Level Security (RLS) on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow upload (INSERT) strictly to "documents" bucket
DROP POLICY IF EXISTS "Allow upload to documents bucket" ON storage.objects;
CREATE POLICY "Allow upload to documents bucket"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'documents');

-- 4. Policy: Allow read / signed URL generation (SELECT) from "documents" bucket
DROP POLICY IF EXISTS "Allow read from documents bucket" ON storage.objects;
CREATE POLICY "Allow read from documents bucket"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'documents');

-- 5. Policy: Allow update / upsert (UPDATE) in "documents" bucket
DROP POLICY IF EXISTS "Allow update in documents bucket" ON storage.objects;
CREATE POLICY "Allow update in documents bucket"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- 6. Policy: Allow delete (DELETE) from "documents" bucket
DROP POLICY IF EXISTS "Allow delete from documents bucket" ON storage.objects;
CREATE POLICY "Allow delete from documents bucket"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'documents');
