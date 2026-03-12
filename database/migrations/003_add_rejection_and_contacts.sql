ALTER TABLE employees ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contacts JSONB;
