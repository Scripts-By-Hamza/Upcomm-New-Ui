-- ==============================================================================
-- UPCOMM Solutions - Message Attachments & Storage Bucket Setup
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hodhtfbbuwxgrxlkigcf/sql/new
-- ==============================================================================

-- 1. Ensure 'attachments' and 'deleted_by' columns exist in public.messages
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- 2. Create the 'message-attachments' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf', 'text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac',
    'application/zip', 'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800;

-- 3. Row Level Security Policies for 'message-attachments' Storage Bucket
DROP POLICY IF EXISTS "Public Read Message Attachments" ON storage.objects;
CREATE POLICY "Public Read Message Attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'message-attachments');

DROP POLICY IF EXISTS "Allow Upload Message Attachments" ON storage.objects;
CREATE POLICY "Allow Upload Message Attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'message-attachments');

DROP POLICY IF EXISTS "Allow Update Message Attachments" ON storage.objects;
CREATE POLICY "Allow Update Message Attachments" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'message-attachments');

DROP POLICY IF EXISTS "Allow Delete Message Attachments" ON storage.objects;
CREATE POLICY "Allow Delete Message Attachments" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'message-attachments');
