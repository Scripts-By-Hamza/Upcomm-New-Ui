-- ==============================================================================
-- UPCOMM Solutions - Messaging Reactions & Pinned Messages Schema & Realtime Setup
-- ==============================================================================

-- 1. Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_message_user_reaction UNIQUE (message_id, user_id)
);

-- 2. Create conversation_pinned_messages table
CREATE TABLE IF NOT EXISTS public.conversation_pinned_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  pinned_by TEXT NOT NULL,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_conversation_pinned_message UNIQUE (conversation_id, message_id)
);

-- 3. Indexes for Fast Message Querying
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_conv_id ON public.conversation_pinned_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pinned_message_id ON public.conversation_pinned_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_pinned_pinned_at ON public.conversation_pinned_messages(pinned_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_pinned_messages ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Access Policies for Frontend Custom Auth
DROP POLICY IF EXISTS "Allow message_reactions all" ON public.message_reactions;
CREATE POLICY "Allow message_reactions all" ON public.message_reactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow conversation_pinned_messages all" ON public.conversation_pinned_messages;
CREATE POLICY "Allow conversation_pinned_messages all" ON public.conversation_pinned_messages FOR ALL USING (true) WITH CHECK (true);

-- 6. Enable Realtime Replication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conversation_pinned_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_pinned_messages;
  END IF;
END $$;

-- 7. Enable Full Replica Identity for Realtime Payloads
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_pinned_messages REPLICA IDENTITY FULL;
