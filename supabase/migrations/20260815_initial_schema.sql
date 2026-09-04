-- ==============================================================================
-- UPCOMM Solutions Task Manager 02 - Supabase PostgreSQL Database Migration Script
-- Version: Complete merged schema with 4 roles, Admin->HOD->Team work hierarchy,
-- hidden IT Support Admin, soft-deletion, and RLS policies.
-- ==============================================================================

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'hod', 'team_member', 'it_support_admin');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE task_origin AS ENUM ('admin_to_hod', 'hod_to_member', 'member_personal', 'support');
CREATE TYPE delete_request_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8B5CF6',
  icon TEXT DEFAULT 'Briefcase',
  hod_id UUID, -- References profiles(id)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles Table (References Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'team_member',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  reports_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT TRUE,
  is_system_account BOOLEAN DEFAULT FALSE,
  exclude_from_directory BOOLEAN DEFAULT FALSE,
  suppress_activity_logging BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circular FK link for departments.hod_id
ALTER TABLE public.departments 
  ADD CONSTRAINT fk_department_hod 
  FOREIGN KEY (hod_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Task Sequence for Automatic Human-Readable Task Numbers (TM-0001)
CREATE SEQUENCE IF NOT EXISTS task_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_task_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_number IS NULL OR NEW.task_number = '' THEN
    NEW.task_number := 'TM-' || LPAD(NEXTVAL('task_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  task_origin task_origin DEFAULT 'admin_to_hod',
  start_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_generate_task_number
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION generate_task_number();

-- 6. Task Delete Requests Table
CREATE TABLE IF NOT EXISTS public.task_delete_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status delete_request_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Department Permissions Table
CREATE TABLE IF NOT EXISTS public.department_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, permission_key)
);

-- 8. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT DEFAULT 'UPCOMM Solutions Task Manager',
  company_name TEXT DEFAULT 'UPCOMM Solutions Ltd.',
  timezone TEXT DEFAULT 'Asia/Karachi',
  date_format TEXT DEFAULT 'DD MMM YYYY',
  due_soon_days INT DEFAULT 3,
  require_strong_passwords BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Integrations Table
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  type TEXT DEFAULT 'Database',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_delete_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function to check current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Admin & IT Support Full Access Policies
CREATE POLICY "Admins have full access on profiles" ON public.profiles FOR ALL USING (get_current_user_role() IN ('admin', 'it_support_admin'));
CREATE POLICY "Admins have full access on departments" ON public.departments FOR ALL USING (get_current_user_role() IN ('admin', 'it_support_admin'));
CREATE POLICY "Admins have full access on tasks" ON public.tasks FOR ALL USING (get_current_user_role() IN ('admin', 'it_support_admin'));
CREATE POLICY "Admins have full access on delete requests" ON public.task_delete_requests FOR ALL USING (get_current_user_role() IN ('admin', 'it_support_admin'));

-- HOD Policies
CREATE POLICY "HOD view department tasks" ON public.tasks FOR SELECT USING (
  get_current_user_role() = 'hod' AND department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "HOD insert department tasks" ON public.tasks FOR INSERT WITH CHECK (
  get_current_user_role() = 'hod' AND department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "HOD update department tasks" ON public.tasks FOR UPDATE USING (
  get_current_user_role() = 'hod' AND department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid())
);

-- Team Member Policies
CREATE POLICY "Team Member view own tasks" ON public.tasks FOR SELECT USING (
  get_current_user_role() = 'team_member' AND (assigned_to = auth.uid() OR created_by = auth.uid())
);
CREATE POLICY "Team Member insert personal tasks" ON public.tasks FOR INSERT WITH CHECK (
  get_current_user_role() = 'team_member' AND created_by = auth.uid() AND assigned_to = auth.uid()
);
CREATE POLICY "Team Member update own tasks" ON public.tasks FOR UPDATE USING (
  get_current_user_role() = 'team_member' AND (assigned_to = auth.uid() OR created_by = auth.uid())
);

-- Prevent hard deletion for non-admins
CREATE POLICY "No hard deletion for non-admins" ON public.tasks FOR DELETE USING (get_current_user_role() IN ('admin', 'it_support_admin'));
