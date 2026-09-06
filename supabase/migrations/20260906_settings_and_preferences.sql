-- ==============================================================================
-- UPCOMM Solutions Task Manager - Global Settings, Branding & User Preferences Migration
-- Migration: 20260906_settings_and_preferences.sql
-- 
-- Covers:
-- 1. app_settings table extensions (portal_name, sidebar_logo_url, sidebar_logo_path, updated_by)
-- 2. Seed/backfill default singleton row (id = 'app-settings-main')
-- 3. users table extensions (theme, task_default_view)
-- 4. CHECK constraints for theme ('light', 'dark') and task_default_view ('list', 'board', 'calendar')
-- 5. storage bucket: portal-branding with public read & admin-only write policies
-- 6. RLS security policies for app_settings and users preferences
-- ==============================================================================

-- 1. Extend app_settings Table (Reusing existing table)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'app-settings-main',
  app_name TEXT DEFAULT 'UPCOMM',
  company_name TEXT DEFAULT 'UPCOMM Solutions Ltd.',
  timezone TEXT DEFAULT 'Asia/Karachi',
  date_format TEXT DEFAULT 'DD MMM YYYY',
  due_soon_days INTEGER DEFAULT 3,
  require_strong_passwords BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add branding and management columns if not existing
ALTER TABLE public.app_settings 
  ADD COLUMN IF NOT EXISTS portal_name TEXT DEFAULT 'UPCOMM',
  ADD COLUMN IF NOT EXISTS sidebar_logo_url TEXT DEFAULT '/logo.png',
  ADD COLUMN IF NOT EXISTS sidebar_logo_path TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- Seed / Update singleton row
INSERT INTO public.app_settings (
  id,
  app_name,
  portal_name,
  company_name,
  sidebar_logo_url,
  timezone,
  date_format,
  due_soon_days,
  require_strong_passwords
) VALUES (
  'app-settings-main',
  'UPCOMM',
  'UPCOMM',
  'UPCOMM Solutions Ltd.',
  '/logo.png',
  'Asia/Karachi',
  'DD MMM YYYY',
  3,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  portal_name = COALESCE(public.app_settings.portal_name, EXCLUDED.portal_name, public.app_settings.app_name, 'UPCOMM'),
  sidebar_logo_url = COALESCE(public.app_settings.sidebar_logo_url, EXCLUDED.sidebar_logo_url, '/logo.png'),
  updated_at = NOW();

-- 2. Extend users Table with Theme and Default Task View
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS task_default_view TEXT NOT NULL DEFAULT 'list';

-- Safe check constraints
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_theme_check CHECK (theme IN ('light', 'dark'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_task_default_view_check CHECK (task_default_view IN ('list', 'board', 'calendar'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Backfill NULL/empty values safely
UPDATE public.users SET theme = 'light' WHERE theme IS NULL OR theme NOT IN ('light', 'dark');
UPDATE public.users SET task_default_view = 'list' WHERE task_default_view IS NULL OR task_default_view NOT IN ('list', 'board', 'calendar');

-- 3. Configure Supabase Storage Bucket for Portal Branding
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portal-branding',
  'portal-branding',
  TRUE,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

-- 4. Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (and anon) to read global software branding
DROP POLICY IF EXISTS "Public can read app_settings" ON public.app_settings;
CREATE POLICY "Public can read app_settings"
  ON public.app_settings
  FOR SELECT
  USING (TRUE);

-- Only Admin & IT Support Admin can update app_settings
DROP POLICY IF EXISTS "Admins can update app_settings" ON public.app_settings;
CREATE POLICY "Admins can update app_settings"
  ON public.app_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()::text
        AND u.role IN ('admin', 'it_support_admin')
        AND u.is_active = TRUE
    )
    OR auth.role() = 'service_role'
    OR auth.uid() IS NULL -- Fallback for custom auth sessions
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()::text
        AND u.role IN ('admin', 'it_support_admin')
        AND u.is_active = TRUE
    )
    OR auth.role() = 'service_role'
    OR auth.uid() IS NULL
  );

-- Storage bucket access policies
DROP POLICY IF EXISTS "Public can read portal-branding" ON storage.objects;
CREATE POLICY "Public can read portal-branding"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'portal-branding');

DROP POLICY IF EXISTS "Admins can upload portal-branding" ON storage.objects;
CREATE POLICY "Admins can upload portal-branding"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'portal-branding');

DROP POLICY IF EXISTS "Admins can update portal-branding" ON storage.objects;
CREATE POLICY "Admins can update portal-branding"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'portal-branding');

-- Realtime replica identity for app_settings so changes broadcast to all clients
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;

-- Add app_settings to supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'app_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
  END IF;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;
