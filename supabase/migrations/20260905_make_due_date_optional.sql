-- Make tasks.due_date optional (nullable)
ALTER TABLE tasks ALTER COLUMN due_date DROP NOT NULL;
