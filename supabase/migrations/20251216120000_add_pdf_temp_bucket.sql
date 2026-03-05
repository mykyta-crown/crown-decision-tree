-- Migration: Create pdf-temp storage bucket for PDF export
-- Date: 2025-12-16
-- Purpose: Temporary storage for PDF export images to avoid Vercel payload limits
-- Images are uploaded by client, downloaded by server, then deleted after PDF generation
--
-- NOTE: The bucket must be created manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket: "pdf-temp"
-- 3. Set to Private (not public)
-- 4. File size limit: 10 MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp
--
-- This migration only creates the RLS policies.

-- 2. RLS Policy: Allow authenticated users to upload to their own folder
-- Path structure: {user_id}/{export_session_id}/{filename}
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload PDF temp images to own folder'
  ) THEN
    CREATE POLICY "Users can upload PDF temp images to own folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'pdf-temp'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- 3. RLS Policy: Allow authenticated users to read their own files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own PDF temp images'
  ) THEN
    CREATE POLICY "Users can read own PDF temp images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'pdf-temp'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- 4. RLS Policy: Allow authenticated users to delete their own files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own PDF temp images'
  ) THEN
    CREATE POLICY "Users can delete own PDF temp images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'pdf-temp'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- 5. RLS Policy: Allow service role full access (for server-side cleanup)
-- Note: Service role bypasses RLS by default, but explicit policy for clarity
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role has full access to PDF temp'
  ) THEN
    CREATE POLICY "Service role has full access to PDF temp"
    ON storage.objects FOR ALL
    TO service_role
    USING (bucket_id = 'pdf-temp')
    WITH CHECK (bucket_id = 'pdf-temp');
  END IF;
END $$;
