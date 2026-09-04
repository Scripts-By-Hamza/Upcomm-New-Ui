-- ==============================================================================
-- UPCOMM Solutions Task Manager 02 - Company Chats Module Migration
-- ==============================================================================

-- 1. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sender_id TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'video', 'pdf', 'attachment', 'system'
  content TEXT,
  reply_to_id TEXT REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Chat Attachments Table
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'video', 'pdf', 'file'
  mime_type TEXT,
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Chat Mentions Table (@user)
CREATE TABLE IF NOT EXISTS public.chat_mentions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Chat Reactions Table (ThumbsUp & Heart)
CREATE TABLE IF NOT EXISTS public.chat_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL, -- 'thumb', 'heart'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_message_reaction UNIQUE (message_id, user_id, reaction_type)
);

-- 5. Chat Entity References Table (/Task, /Meeting, /Report)
CREATE TABLE IF NOT EXISTS public.chat_entity_references (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'task', 'meeting', 'report'
  entity_id TEXT NOT NULL,
  entity_title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Chat User Restrictions (Admin Freeze System)
CREATE TABLE IF NOT EXISTS public.chat_user_restrictions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  frozen_by TEXT NOT NULL,
  frozen_until TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Chat Backups Table
CREATE TABLE IF NOT EXISTS public.chat_backups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  created_by TEXT NOT NULL,
  backup_from TIMESTAMPTZ,
  backup_to TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  attachment_count INTEGER DEFAULT 0,
  backup_path TEXT,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 8. Chat Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.chat_admin_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON public.chat_messages(reply_to_id);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON public.chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_message ON public.chat_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_user ON public.chat_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON public.chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_entity_ref_message ON public.chat_entity_references(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_restrictions_user ON public.chat_user_restrictions(user_id, frozen_until);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_entity_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_user_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if any
DROP POLICY IF EXISTS "Allow chat_messages all" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow chat_attachments all" ON public.chat_attachments;
DROP POLICY IF EXISTS "Allow chat_mentions all" ON public.chat_mentions;
DROP POLICY IF EXISTS "Allow chat_reactions all" ON public.chat_reactions;
DROP POLICY IF EXISTS "Allow chat_entity_references all" ON public.chat_entity_references;
DROP POLICY IF EXISTS "Allow chat_user_restrictions all" ON public.chat_user_restrictions;
DROP POLICY IF EXISTS "Allow chat_backups all" ON public.chat_backups;
DROP POLICY IF EXISTS "Allow chat_admin_audit_logs all" ON public.chat_admin_audit_logs;

CREATE POLICY "Allow chat_messages all" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow chat_attachments all" ON public.chat_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow chat_mentions all" ON public.chat_mentions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow chat_reactions all" ON public.chat_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow chat_entity_references all" ON public.chat_entity_references FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow chat_user_restrictions all" ON public.chat_user_restrictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow chat_backups all" ON public.chat_backups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow chat_admin_audit_logs all" ON public.chat_admin_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 11. SUPABASE STORAGE BUCKETS (chat-assets & chat-backups)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'chat-assets',
    'chat-assets',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/mpeg', 'application/pdf']
  ),
  (
    'chat-backups',
    'chat-backups',
    false,
    104857600, -- 100MB
    ARRAY['application/json']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage object access policies
DROP POLICY IF EXISTS "Allow all on chat-assets" ON storage.objects;
CREATE POLICY "Allow all on chat-assets"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'chat-assets')
  WITH CHECK (bucket_id = 'chat-assets');

DROP POLICY IF EXISTS "Allow all on chat-backups" ON storage.objects;
CREATE POLICY "Allow all on chat-backups"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'chat-backups')
  WITH CHECK (bucket_id = 'chat-backups');

-- ==============================================================================
-- 12. ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_user_restrictions;

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_user_restrictions REPLICA IDENTITY FULL;


