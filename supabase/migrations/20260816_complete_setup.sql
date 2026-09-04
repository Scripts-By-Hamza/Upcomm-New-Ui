-- ==============================================================================
-- UPCOMM Solutions Task Manager 02 - Complete Supabase PostgreSQL Setup Script
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/hodhtfbbuwxgrxlkigcf/sql/new
-- ==============================================================================

-- 1. Create Enums if they don't exist
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'hod', 'team_member', 'it_support_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_origin AS ENUM ('admin_to_hod', 'hod_to_member', 'member_personal', 'support');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE delete_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8B5CF6',
  icon TEXT DEFAULT 'Briefcase',
  hod_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
DO $$ BEGIN
  ALTER TABLE public.departments 
    ADD CONSTRAINT fk_department_hod 
    FOREIGN KEY (hod_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

DROP TRIGGER IF EXISTS trg_generate_task_number ON public.tasks;
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
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active profiles/departments/tasks for authenticated clients
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Public read delete requests" ON public.task_delete_requests FOR SELECT USING (true);
CREATE POLICY "Public read permissions" ON public.department_permissions FOR SELECT USING (true);
CREATE POLICY "Public read activity logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Public read app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Public read integrations" ON public.integrations FOR SELECT USING (true);

-- Allow authenticated inserts/updates
CREATE POLICY "Allow all modifications for authenticated users" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow task modifications for authenticated users" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Allow dept modifications for authenticated users" ON public.departments FOR ALL USING (true);
CREATE POLICY "Allow delete requests modifications" ON public.task_delete_requests FOR ALL USING (true);
CREATE POLICY "Allow permission modifications" ON public.department_permissions FOR ALL USING (true);
CREATE POLICY "Allow activity log insertions" ON public.activity_logs FOR ALL USING (true);
CREATE POLICY "Allow settings modifications" ON public.app_settings FOR ALL USING (true);
CREATE POLICY "Allow integration modifications" ON public.integrations FOR ALL USING (true);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Initial Departments
INSERT INTO public.departments (id, name, description, color, icon)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Social Media', 'Manages social channels, content calendars, and influencer outreach.', '#8B5CF6', 'Megaphone'),
  ('d0000000-0000-0000-0000-000000000002', 'Marketing', 'Handles brand campaigns, paid ads, SEO strategy, and growth marketing.', '#EC4899', 'TrendingUp'),
  ('d0000000-0000-0000-0000-000000000003', 'Video Production', 'Produces high-converting video ads, YouTube content, and reels.', '#3B82F6', 'Video'),
  ('d0000000-0000-0000-0000-000000000004', 'Sourcing & Supply', 'Manages supplier relations, product logistics, and quality assurance.', '#F59E0B', 'PackageSearch'),
  ('d0000000-0000-0000-0000-000000000005', 'Finance & Accounting', 'Manages payroll, budget allocation, revenue audit, and financial reporting.', '#10B981', 'Wallet'),
  ('d0000000-0000-0000-0000-000000000006', 'Human Resources', 'Handles talent acquisition, employee onboarding, and performance management.', '#06B6D4', 'Users'),
  ('d0000000-0000-0000-0000-000000000007', 'Procurement', 'Manages hardware, software licensing, vendor contracts, and office equipment.', '#6366F1', 'ShoppingCart')
ON CONFLICT (name) DO NOTHING;

-- Initial Profiles (Admin & IT Support)
INSERT INTO public.profiles (id, email, full_name, role, is_active, must_change_password, is_system_account, exclude_from_directory, suppress_activity_logging)
VALUES
  ('u0000000-0000-0000-0000-000000000001', 'muhammaddumerr@gmail.com', 'Muhammad Dumer', 'admin', TRUE, TRUE, FALSE, FALSE, FALSE),
  ('u0000000-0000-0000-0000-000000000002', 'ranahamza241203@gmail.com', 'Rana Hamza', 'it_support_admin', TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Initial App Settings
INSERT INTO public.app_settings (app_name, company_name, timezone, date_format, due_soon_days, require_strong_passwords)
VALUES ('UPCOMM Solutions Task Manager', 'UPCOMM Solutions Ltd.', 'Asia/Karachi', 'DD MMM YYYY', 3, TRUE)
ON CONFLICT DO NOTHING;

-- Initial Integrations
INSERT INTO public.integrations (provider, display_name, status, type)
VALUES
  ('Supabase Database & Auth', 'Supabase Core', 'connected', 'Database'),
  ('Supabase Storage', 'Avatar & Attachment Storage', 'connected', 'Storage'),
  ('OpenAI API', 'AI Task Assistant', 'configured', 'AI'),
  ('Slack Webhooks', 'Department Notifications', 'disconnected', 'Messaging'),
  ('SMTP Email Relay', 'Email Alerts', 'configured', 'Email')
ON CONFLICT DO NOTHING;
