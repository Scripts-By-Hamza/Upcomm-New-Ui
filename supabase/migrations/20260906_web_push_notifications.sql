-- ==============================================================================
-- UPCOMM Solutions Task Manager - Installed Mobile PWA Web Push System Migration
-- Migration: 20260906_web_push_notifications.sql
-- 
-- Covers:
-- 1. web_push_subscriptions (multi-device endpoint storage)
-- 2. user_notification_preferences (user-level mobile push toggle)
-- 3. push_notifications (authoritative server outbox & audit trail)
-- 4. web_push_deliveries (delivery tracking & webhook idempotency)
-- 5. RLS policies for security & privacy
-- 6. Server-side triggers for 8 core push events:
--    - DIRECT_MESSAGE
--    - GROUP_MESSAGE
--    - BROADCAST_MESSAGE
--    - MESSAGE_MENTION (deduped 1:1)
--    - TASK_COMMENT
--    - TASK_ASSIGNED
--    - COMPLETION_REQUEST
--    - DELETE_REQUEST
-- ==============================================================================

-- 1. Table: web_push_subscriptions
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  platform TEXT DEFAULT 'other', -- 'android', 'ios', 'other'
  device_label TEXT,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error TEXT
);

-- 2. Table: user_notification_preferences
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id TEXT PRIMARY KEY,
  mobile_push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: push_notifications (Server Outbox / Push Log)
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id TEXT NOT NULL,
  actor_user_id TEXT,
  event_type TEXT NOT NULL, -- DIRECT_MESSAGE, GROUP_MESSAGE, BROADCAST_MESSAGE, MESSAGE_MENTION, TASK_COMMENT, TASK_ASSIGNED, COMPLETION_REQUEST, DELETE_REQUEST
  entity_type TEXT NOT NULL, -- message, task_update, task, completion_request, delete_request
  entity_id TEXT,
  conversation_id TEXT,
  task_id TEXT,
  request_id TEXT,
  title TEXT NOT NULL DEFAULT 'UPCOMM',
  body TEXT NOT NULL,
  deep_link TEXT NOT NULL DEFAULT '/',
  dedupe_key TEXT NOT NULL UNIQUE,
  read_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: web_push_deliveries (Per-Device Delivery Log)
CREATE TABLE IF NOT EXISTS public.web_push_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.push_notifications(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.web_push_subscriptions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'expired'
  attempt_count INT NOT NULL DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_notification_subscription_delivery UNIQUE (notification_id, subscription_id)
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_web_push_subs_user ON public.web_push_subscriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_web_push_subs_endpoint ON public.web_push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_notif_recipient ON public.push_notifications(recipient_user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_notif_dedupe ON public.push_notifications(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_push_notif_created ON public.push_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_deliveries_status ON public.web_push_deliveries(status);

-- Enable RLS
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_push_deliveries ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies matching existing project patterns
DROP POLICY IF EXISTS "Allow web_push_subscriptions all" ON public.web_push_subscriptions;
CREATE POLICY "Allow web_push_subscriptions all" ON public.web_push_subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow user_notification_preferences all" ON public.user_notification_preferences;
CREATE POLICY "Allow user_notification_preferences all" ON public.user_notification_preferences FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow push_notifications all" ON public.push_notifications;
CREATE POLICY "Allow push_notifications all" ON public.push_notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow web_push_deliveries all" ON public.web_push_deliveries;
CREATE POLICY "Allow web_push_deliveries all" ON public.web_push_deliveries FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for push_notifications if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'push_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.push_notifications;
  END IF;
END $$;

-- ==============================================================================
-- HELPER FUNCTIONS FOR USER LOOKUP & COPY FORMATTING
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_get_user_name(p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RETURN 'A team member';
  END IF;

  -- Try profiles table first
  SELECT full_name INTO v_name FROM public.profiles WHERE id::TEXT = p_user_id LIMIT 1;
  IF v_name IS NOT NULL AND v_name <> '' THEN
    RETURN v_name;
  END IF;

  -- Fallback to users table if present
  BEGIN
    SELECT full_name INTO v_name FROM public.users WHERE id::TEXT = p_user_id LIMIT 1;
    IF v_name IS NOT NULL AND v_name <> '' THEN
      RETURN v_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if users table not present
  END;

  RETURN 'A team member';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- TRIGGER 1: MESSAGES (Direct, Group, Broadcast, Mention)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_process_message_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_conv_type TEXT := 'direct';
  v_conv_name TEXT;
  v_participant RECORD;
  v_is_mention BOOLEAN;
  v_title TEXT := 'UPCOMM';
  v_body TEXT;
  v_deep_link TEXT;
  v_dedupe_key TEXT;
  v_event_type TEXT;
BEGIN
  -- Resolve sender display name
  v_sender_name := public.fn_get_user_name(NEW.sender_id);

  -- Determine conversation details
  SELECT type, name INTO v_conv_type, v_conv_name
  FROM public.conversations
  WHERE id = NEW.conversation_id
  LIMIT 1;

  -- Default deep link
  v_deep_link := '/messages?conversationId=' || NEW.conversation_id || '&messageId=' || NEW.id;

  -- Iterate through all conversation participants except sender
  FOR v_participant IN 
    SELECT user_id 
    FROM public.conversation_participants 
    WHERE conversation_id = NEW.conversation_id 
      AND user_id <> NEW.sender_id
  LOOP
    -- Check if this recipient was @mentioned
    v_is_mention := FALSE;
    
    -- Check chat_mentions table
    IF EXISTS (
      SELECT 1 FROM public.chat_mentions 
      WHERE message_id = NEW.id AND mentioned_user_id = v_participant.user_id
    ) THEN
      v_is_mention := TRUE;
    END IF;

    -- Build privacy-safe copy & dedupe key
    v_dedupe_key := 'message:' || NEW.id || ':recipient:' || v_participant.user_id;

    IF v_is_mention THEN
      v_event_type := 'MESSAGE_MENTION';
      v_body := v_sender_name || ' mentioned you in a message.';
    ELSIF NEW.source_type = 'broadcast' THEN
      v_event_type := 'BROADCAST_MESSAGE';
      v_body := 'New broadcast message from ' || v_sender_name || '.';
    ELSIF v_conv_type = 'group' OR NEW.source_type = 'group' THEN
      v_event_type := 'GROUP_MESSAGE';
      IF v_conv_name IS NOT NULL AND v_conv_name <> '' THEN
        v_body := 'New message in ' || v_conv_name || ' from ' || v_sender_name || '.';
      ELSE
        v_body := 'New group message from ' || v_sender_name || '.';
      END IF;
    ELSE
      v_event_type := 'DIRECT_MESSAGE';
      v_body := 'New message from ' || v_sender_name || '.';
    END IF;

    -- Insert privacy-safe Push Notification outbox row
    INSERT INTO public.push_notifications (
      recipient_user_id,
      actor_user_id,
      event_type,
      entity_type,
      entity_id,
      conversation_id,
      title,
      body,
      deep_link,
      dedupe_key,
      created_at
    )
    VALUES (
      v_participant.user_id,
      NEW.sender_id,
      v_event_type,
      'message',
      NEW.id,
      NEW.conversation_id,
      v_title,
      v_body,
      v_deep_link,
      v_dedupe_key,
      NOW()
    )
    ON CONFLICT (dedupe_key) DO NOTHING;

  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_message_push ON public.messages;
CREATE TRIGGER trg_process_message_push
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_process_message_push_notification();

-- ==============================================================================
-- TRIGGER 2: TASK COMMENTS (task_updates with text/comment)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_process_task_comment_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_task RECORD;
  v_recipient_id TEXT;
  v_recipients TEXT[] := ARRAY[]::TEXT[];
  v_task_label TEXT;
  v_body TEXT;
  v_deep_link TEXT;
  v_dedupe_key TEXT;
BEGIN
  -- Only process if text / comment content exists
  IF NEW.text IS NULL OR TRIM(NEW.text) = '' THEN
    RETURN NEW;
  END IF;

  -- Resolve task
  SELECT id, task_number, title, created_by, assigned_to, department_id 
  INTO v_task
  FROM public.tasks
  WHERE id::TEXT = NEW.task_id::TEXT
  LIMIT 1;

  IF v_task.id IS NULL THEN
    RETURN NEW;
  END IF;

  v_sender_name := COALESCE(NEW.user_name, public.fn_get_user_name(NEW.user_id));
  v_task_label := COALESCE(v_task.task_number, 'task');
  v_body := 'New comment from ' || v_sender_name || ' on ' || v_task_label || '.';
  v_deep_link := '/tasks/' || v_task.id::TEXT || '?tab=comments';

  -- Collect legitimate recipients: Task Creator & Assignee (excluding commenter)
  IF v_task.created_by IS NOT NULL AND v_task.created_by::TEXT <> COALESCE(NEW.user_id, '') THEN
    v_recipients := array_append(v_recipients, v_task.created_by::TEXT);
  END IF;

  IF v_task.assigned_to IS NOT NULL 
     AND v_task.assigned_to::TEXT <> COALESCE(NEW.user_id, '') 
     AND NOT (v_task.assigned_to::TEXT = ANY(v_recipients)) THEN
    v_recipients := array_append(v_recipients, v_task.assigned_to::TEXT);
  END IF;

  -- Create push outbox row for each unique recipient
  FOREACH v_recipient_id IN ARRAY v_recipients
  LOOP
    v_dedupe_key := 'task-comment:' || NEW.id || ':recipient:' || v_recipient_id;

    INSERT INTO public.push_notifications (
      recipient_user_id,
      actor_user_id,
      event_type,
      entity_type,
      entity_id,
      task_id,
      title,
      body,
      deep_link,
      dedupe_key,
      created_at
    )
    VALUES (
      v_recipient_id,
      NEW.user_id,
      'TASK_COMMENT',
      'task_update',
      NEW.id,
      v_task.id::TEXT,
      'UPCOMM',
      v_body,
      v_deep_link,
      v_dedupe_key,
      NOW()
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_task_comment_push ON public.task_updates;
CREATE TRIGGER trg_process_task_comment_push
  AFTER INSERT ON public.task_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_process_task_comment_push_notification();

-- ==============================================================================
-- TRIGGER 3: TASK ASSIGNMENTS (INSERT & ASSIGNEE CHANGE)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_process_task_assignment_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_assigner_name TEXT;
  v_assigner_id TEXT;
  v_recipient_id TEXT;
  v_body TEXT;
  v_deep_link TEXT;
  v_dedupe_key TEXT;
  v_is_new_assignment BOOLEAN := FALSE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_to IS NOT NULL THEN
      v_recipient_id := NEW.assigned_to::TEXT;
      v_assigner_id := COALESCE(NEW.assigned_by::TEXT, NEW.created_by::TEXT);
      -- Exclude self-assignment
      IF v_recipient_id <> COALESCE(v_assigner_id, '') THEN
        v_is_new_assignment := TRUE;
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only trigger if assigned_to changed to a new user
    IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to::TEXT <> OLD.assigned_to::TEXT) THEN
      v_recipient_id := NEW.assigned_to::TEXT;
      v_assigner_id := COALESCE(NEW.assigned_by::TEXT, NEW.created_by::TEXT);
      IF v_recipient_id <> COALESCE(v_assigner_id, '') THEN
        v_is_new_assignment := TRUE;
      END IF;
    END IF;
  END IF;

  IF v_is_new_assignment AND v_recipient_id IS NOT NULL THEN
    v_assigner_name := public.fn_get_user_name(v_assigner_id);
    v_body := 'You were assigned a new task by ' || v_assigner_name || '.';
    v_deep_link := '/tasks/' || NEW.id::TEXT;
    v_dedupe_key := 'task-assigned:' || NEW.id::TEXT || ':recipient:' || v_recipient_id || ':at:' || EXTRACT(EPOCH FROM COALESCE(NEW.updated_at, NEW.created_at, NOW()))::BIGINT;

    INSERT INTO public.push_notifications (
      recipient_user_id,
      actor_user_id,
      event_type,
      entity_type,
      entity_id,
      task_id,
      title,
      body,
      deep_link,
      dedupe_key,
      created_at
    )
    VALUES (
      v_recipient_id,
      v_assigner_id,
      'TASK_ASSIGNED',
      'task',
      NEW.id::TEXT,
      NEW.id::TEXT,
      'UPCOMM',
      v_body,
      v_deep_link,
      v_dedupe_key,
      NOW()
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_task_assignment_push ON public.tasks;
CREATE TRIGGER trg_process_task_assignment_push
  AFTER INSERT OR UPDATE OF assigned_to ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_process_task_assignment_push_notification();

-- ==============================================================================
-- TRIGGER 4: COMPLETION REQUESTS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_process_completion_request_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_requester_name TEXT;
  v_body TEXT;
  v_deep_link TEXT;
  v_dedupe_key TEXT;
BEGIN
  -- Notify the task creator/reviewer (excluding self-submitted)
  IF NEW.task_creator_id IS NOT NULL AND NEW.task_creator_id <> NEW.requested_by THEN
    v_requester_name := public.fn_get_user_name(NEW.requested_by);
    v_body := v_requester_name || ' submitted a task completion request.';
    v_deep_link := '/inbox?type=completion&requestId=' || NEW.id;
    v_dedupe_key := 'completion-request:' || NEW.id || ':recipient:' || NEW.task_creator_id;

    INSERT INTO public.push_notifications (
      recipient_user_id,
      actor_user_id,
      event_type,
      entity_type,
      entity_id,
      task_id,
      request_id,
      title,
      body,
      deep_link,
      dedupe_key,
      created_at
    )
    VALUES (
      NEW.task_creator_id,
      NEW.requested_by,
      'COMPLETION_REQUEST',
      'completion_request',
      NEW.id,
      NEW.task_id,
      NEW.id,
      'UPCOMM',
      v_body,
      v_deep_link,
      v_dedupe_key,
      NOW()
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_completion_request_push ON public.task_completion_requests;
CREATE TRIGGER trg_process_completion_request_push
  AFTER INSERT ON public.task_completion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_process_completion_request_push_notification();

-- ==============================================================================
-- TRIGGER 5: DELETE REQUESTS (delete_requests table)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_process_delete_request_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_requester_name TEXT;
  v_admin RECORD;
  v_body TEXT;
  v_deep_link TEXT;
  v_dedupe_key TEXT;
BEGIN
  v_requester_name := public.fn_get_user_name(NEW.requested_by::TEXT);
  v_body := v_requester_name || ' submitted a task deletion request.';
  v_deep_link := '/inbox?type=delete&requestId=' || NEW.id::TEXT;

  -- Notify authorized Administrators / IT Support Admins (from users or profiles, excluding requester)
  FOR v_admin IN 
    SELECT DISTINCT id::TEXT as user_id 
    FROM public.users 
    WHERE role IN ('admin', 'it_support_admin') 
      AND is_active = TRUE
      AND id::TEXT <> NEW.requested_by::TEXT
  LOOP
    v_dedupe_key := 'delete-request:' || NEW.id::TEXT || ':recipient:' || v_admin.user_id;

    INSERT INTO public.push_notifications (
      recipient_user_id,
      actor_user_id,
      event_type,
      entity_type,
      entity_id,
      task_id,
      request_id,
      title,
      body,
      deep_link,
      dedupe_key,
      created_at
    )
    VALUES (
      v_admin.user_id,
      NEW.requested_by::TEXT,
      'DELETE_REQUEST',
      'delete_request',
      NEW.id::TEXT,
      NEW.task_id::TEXT,
      NEW.id::TEXT,
      'UPCOMM',
      v_body,
      v_deep_link,
      v_dedupe_key,
      NOW()
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_delete_request_push ON public.delete_requests;
CREATE TRIGGER trg_process_delete_request_push
  AFTER INSERT ON public.delete_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_process_delete_request_push_notification();
