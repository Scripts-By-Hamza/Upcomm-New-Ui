-- ==============================================================================
-- UPCOMM Solutions Task Manager 02 - Personal Tasks Kanban Board Migration
-- ==============================================================================

-- 1. Create personal_tasks Table
CREATE TABLE IF NOT EXISTS public.personal_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  category TEXT DEFAULT 'General',
  due_date DATE,
  due_time TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_id ON public.personal_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_status ON public.personal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_status ON public.personal_tasks(user_id, status);

-- 3. Trigger for automatic updated_at and completion timestamp
CREATE OR REPLACE FUNCTION update_personal_tasks_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.is_completed = TRUE;
    NEW.completed_at = COALESCE(NEW.completed_at, NOW());
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.is_completed = FALSE;
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_personal_tasks_modtime ON public.personal_tasks;
CREATE TRIGGER trg_update_personal_tasks_modtime
  BEFORE UPDATE ON public.personal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_tasks_modtime();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.personal_tasks ENABLE ROW LEVEL SECURITY;

-- 5. Full Access RLS Policies (Matching tasks, reports, departments tables)
DROP POLICY IF EXISTS "Users can view own personal tasks" ON public.personal_tasks;
DROP POLICY IF EXISTS "Users can insert own personal tasks" ON public.personal_tasks;
DROP POLICY IF EXISTS "Users can update own personal tasks" ON public.personal_tasks;
DROP POLICY IF EXISTS "Users can delete own personal tasks" ON public.personal_tasks;
DROP POLICY IF EXISTS "Public read personal_tasks" ON public.personal_tasks;
DROP POLICY IF EXISTS "Allow personal_tasks modifications" ON public.personal_tasks;

CREATE POLICY "Public read personal_tasks"
  ON public.personal_tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Allow personal_tasks insert"
  ON public.personal_tasks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow personal_tasks update"
  ON public.personal_tasks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow personal_tasks delete"
  ON public.personal_tasks
  FOR DELETE
  USING (true);
