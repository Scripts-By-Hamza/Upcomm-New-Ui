-- ============================================================
-- Task Completion Requests Table
-- Mirrors the delete_requests workflow but for task completion approval.
-- Task creator must approve before status becomes 'completed'.
-- Uses the same open-access RLS pattern as all other tables in this project.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.task_completion_requests (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  task_creator_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_by_role TEXT NOT NULL DEFAULT 'team_member',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one *pending* completion request is allowed per task at a time.
-- Multiple approved/rejected records are fine (history).
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_completion_per_task
  ON public.task_completion_requests(task_id)
  WHERE status = 'pending';

-- RLS: same open-access pattern used by all other tables in this project
ALTER TABLE public.task_completion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read completion requests"
  ON public.task_completion_requests FOR SELECT
  USING (true);

CREATE POLICY "Allow all modifications for completion requests"
  ON public.task_completion_requests FOR ALL
  USING (true);
