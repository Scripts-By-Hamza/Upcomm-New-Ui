-- ==============================================================================
-- UPCOMM Solutions - Messaging, Conversations & Moderation RLS & Realtime Setup
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hodhtfbbuwxgrxlkigcf/sql/new
-- ==============================================================================

-- 1. Ensure Table Structure & Constraints
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'group'
  name TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL,
  reply_to_message_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'group', 'broadcast'
  broadcast_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.message_reports (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  conversation_id TEXT,
  reported_by_user_id TEXT NOT NULL,
  reported_user_id TEXT NOT NULL,
  message_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  message_sent_at TIMESTAMPTZ,
  reason TEXT NOT NULL,
  reporter_note TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'action_taken', 'dismissed'
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON public.message_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reports_reported_user ON public.message_reports(reported_user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- 4. Create Permissive Access Policies for Frontend Custom Auth
DROP POLICY IF EXISTS "Allow conversations all" ON public.conversations;
CREATE POLICY "Allow conversations all" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow conversation_participants all" ON public.conversation_participants;
CREATE POLICY "Allow conversation_participants all" ON public.conversation_participants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow messages all" ON public.messages;
CREATE POLICY "Allow messages all" ON public.messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow message_reports all" ON public.message_reports;
CREATE POLICY "Allow message_reports all" ON public.message_reports FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable Realtime Replication for Instant Cross-Device Sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'message_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reports;
  END IF;
END $$;

-- 6. Enable Full Replica Identity for Complete Realtime Payloads
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_reports REPLICA IDENTITY FULL;
