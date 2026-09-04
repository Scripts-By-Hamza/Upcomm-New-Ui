-- ==============================================================================
-- Migration: Add 'designation' column & Create 'avatars' Storage Bucket
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hodhtfbbuwxgrxlkigcf/sql/new
-- ==============================================================================

-- 1. Add designation column to public.profiles table if not exists
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Team Member Specialist';

-- 2. Create the 'avatars' storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Row Level Security Policies for 'avatars' Storage Bucket

-- Policy: Allow public read access to all avatars
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy: Allow authenticated users to upload avatar images
DROP POLICY IF EXISTS "Allow Upload to Avatars" ON storage.objects;
CREATE POLICY "Allow Upload to Avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

-- Policy: Allow authenticated users to update their avatars
DROP POLICY IF EXISTS "Allow Update to Avatars" ON storage.objects;
CREATE POLICY "Allow Update to Avatars" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars');

-- Policy: Allow authenticated users to delete their avatars
DROP POLICY IF EXISTS "Allow Delete from Avatars" ON storage.objects;
CREATE POLICY "Allow Delete from Avatars" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars');
