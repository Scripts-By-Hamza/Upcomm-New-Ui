-- ==============================================================================
-- UPCOMM Solutions Task Manager - NVIDIA NIM AI Assistant Database Migration
-- Migration: 20260906_ai_assistant.sql
-- 
-- Covers:
-- 1. ai_agent_conversations (User conversation threads)
-- 2. ai_agent_messages (Conversation history & structured turns - no chain-of-thought)
-- 3. ai_agent_pending_actions (Authoritative server-side pending write actions)
-- 4. ai_agent_action_logs (Immutable audit trail for agent business operations)
-- 5. ai_agent_usage (Telemetry & operational quota metrics)
-- 6. Canonical server-side task creation atomic sequence & helper functions
-- 7. Indexes & Row-Level Security (RLS) policies
-- ==============================================================================

-- 1. Table: ai_agent_conversations
CREATE TABLE IF NOT EXISTS public.ai_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: ai_agent_messages
CREATE TABLE IF NOT EXISTS public.ai_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system', 'tool'
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'report', 'action_confirmation', 'action_result', 'clarification', 'error'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: ai_agent_pending_actions
CREATE TABLE IF NOT EXISTS public.ai_agent_pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_agent_conversations(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  normalized_args JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'executing', 'executed', 'cancelled', 'expired', 'failed'
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  result JSONB
);

-- 4. Table: ai_agent_action_logs
CREATE TABLE IF NOT EXISTS public.ai_agent_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_agent_conversations(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  pending_action_id UUID REFERENCES public.ai_agent_pending_actions(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  sanitized_arguments JSONB DEFAULT '{}'::jsonb,
  result_entity_type TEXT, -- 'task', etc.
  result_entity_id TEXT, -- e.g. TM-0184
  status TEXT NOT NULL, -- 'success', 'failed', 'rejected', 'expired'
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. Table: ai_agent_usage
CREATE TABLE IF NOT EXISTS public.ai_agent_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'nvidia',
  model TEXT NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  latency_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance and quick retrieval
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON public.ai_agent_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON public.ai_agent_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_pending_act ON public.ai_agent_pending_actions(created_by, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_act_logs ON public.ai_agent_action_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_agent_usage(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_pending_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_usage ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies matching project conventions
DROP POLICY IF EXISTS "Allow ai_agent_conversations all" ON public.ai_agent_conversations;
CREATE POLICY "Allow ai_agent_conversations all" ON public.ai_agent_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ai_agent_messages all" ON public.ai_agent_messages;
CREATE POLICY "Allow ai_agent_messages all" ON public.ai_agent_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ai_agent_pending_actions all" ON public.ai_agent_pending_actions;
CREATE POLICY "Allow ai_agent_pending_actions all" ON public.ai_agent_pending_actions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ai_agent_action_logs all" ON public.ai_agent_action_logs;
CREATE POLICY "Allow ai_agent_action_logs all" ON public.ai_agent_action_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ai_agent_usage all" ON public.ai_agent_usage;
CREATE POLICY "Allow ai_agent_usage all" ON public.ai_agent_usage FOR ALL USING (true) WITH CHECK (true);

-- Ensure task sequence exists for race-free task number generation
CREATE SEQUENCE IF NOT EXISTS task_number_seq START WITH 1 INCREMENT BY 1;

-- Server-side helper function for atomic company task creation
CREATE OR REPLACE FUNCTION public.create_company_task_atomic(
  p_title TEXT,
  p_description TEXT,
  p_department_id TEXT,
  p_created_by TEXT,
  p_assigned_by TEXT,
  p_assigned_to TEXT,
  p_assisted_by TEXT,
  p_start_date DATE,
  p_due_date DATE,
  p_priority TEXT,
  p_status TEXT,
  p_task_origin TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_task_number TEXT;
  v_task_id TEXT;
  v_result JSONB;
BEGIN
  -- Generate unique task number atomically
  v_task_number := 'TM-' || LPAD(NEXTVAL('task_number_seq')::TEXT, 4, '0');
  v_task_id := 'task-' || (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 5);

  INSERT INTO public.tasks (
    id,
    task_number,
    title,
    description,
    department_id,
    created_by,
    assigned_by,
    assigned_to,
    assisted_by,
    task_origin,
    start_date,
    due_date,
    priority,
    status,
    is_deleted,
    created_at,
    updated_at
  ) VALUES (
    v_task_id,
    v_task_number,
    p_title,
    p_description,
    p_department_id,
    p_created_by,
    p_assigned_by,
    p_assigned_to,
    p_assisted_by,
    COALESCE(p_task_origin, 'admin_to_hod'),
    COALESCE(p_start_date, CURRENT_DATE),
    p_due_date,
    COALESCE(p_priority, 'medium'),
    COALESCE(p_status, 'pending'),
    false,
    NOW(),
    NOW()
  );

  v_result := jsonb_build_object(
    'id', v_task_id,
    'task_number', v_task_number,
    'title', p_title,
    'status', COALESCE(p_status, 'pending'),
    'priority', COALESCE(p_priority, 'medium'),
    'department_id', p_department_id,
    'created_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
