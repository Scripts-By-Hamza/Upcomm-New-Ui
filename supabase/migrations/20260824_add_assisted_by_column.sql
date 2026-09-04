-- Migration: Add assisted_by column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assisted_by TEXT REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assisted_by ON public.tasks(assisted_by);
