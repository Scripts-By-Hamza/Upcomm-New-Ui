-- ==============================================================================
-- Fix: Enable REPLICA IDENTITY FULL on task_updates for reliable Supabase Realtime
-- Run this in your Supabase SQL Editor.
-- This is required for UPDATE and DELETE events to include full row data in realtime.
-- ==============================================================================

-- Enable full replica identity so realtime gets the complete old/new row on every event
ALTER TABLE public.task_updates REPLICA IDENTITY FULL;

-- Also enable full replica identity on tasks table for complete task change events
ALTER TABLE public.tasks REPLICA IDENTITY FULL;

-- Add task_updates and tasks to the supabase_realtime publication if not already added
-- (Supabase enables this automatically but this makes it explicit)
DO $$
BEGIN
  -- Add task_updates to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'task_updates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_updates;
  END IF;

  -- Add task_completion_requests to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'task_completion_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_completion_requests;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- ignore if publication doesn't exist
END $$;
