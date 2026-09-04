-- ==============================================================================
-- Migration: Create 'task_updates' table & 'task-attachments' Storage Bucket
-- Run this in your Supabase SQL Editor:
-- ==============================================================================

-- 1. Create task_updates table if not exists
CREATE TABLE IF NOT EXISTS public.task_updates (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  user_avatar TEXT,
  old_status TEXT,
  status TEXT,
  text TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure attachments column exists if table was already created
ALTER TABLE public.task_updates 
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Create Index on task_id and created_at
CREATE INDEX IF NOT EXISTS idx_task_updates_task_id ON public.task_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_created_at ON public.task_updates(created_at DESC);

-- Enable RLS
ALTER TABLE public.task_updates ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users / anon access
DROP POLICY IF EXISTS "Allow task_updates all" ON public.task_updates;
CREATE POLICY "Allow task_updates all" ON public.task_updates FOR ALL USING (true) WITH CHECK (true);

-- 2. Create the 'task-attachments' storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf', 'text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'video/mp4', 'video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Row Level Security Policies for 'task-attachments' Storage Bucket
DROP POLICY IF EXISTS "Public Read Task Attachments" ON storage.objects;
CREATE POLICY "Public Read Task Attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "Allow Upload Task Attachments" ON storage.objects;
CREATE POLICY "Allow Upload Task Attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "Allow Update Task Attachments" ON storage.objects;
CREATE POLICY "Allow Update Task Attachments" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "Allow Delete Task Attachments" ON storage.objects;
CREATE POLICY "Allow Delete Task Attachments" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'task-attachments');
