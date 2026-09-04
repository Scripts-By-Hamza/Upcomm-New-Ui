-- ==============================================================================
-- Migration: Create 'user_read_states' table for Cross-Device Read Status Sync
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/hodhtfbbuwxgrxlkigcf/sql/new
-- ==============================================================================

-- 1. Create table for persisting notification & chat read IDs across devices
CREATE TABLE IF NOT EXISTS public.user_read_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  read_notifications JSONB DEFAULT '[]'::jsonb,
  read_chats JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_read_states_user_id_key UNIQUE (user_id)
);

-- 2. Index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_read_states_user_id ON public.user_read_states(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_read_states ENABLE ROW LEVEL SECURITY;

-- 4. Open policy for anon/authenticated access (consistent with tasks/task_updates policies)
DROP POLICY IF EXISTS "Allow user_read_states all" ON public.user_read_states;
CREATE POLICY "Allow user_read_states all" ON public.user_read_states FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable Realtime Replication for instant cross-device updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_read_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_read_states;
  END IF;
END $$;
