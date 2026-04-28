ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_card_issued_by TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_card_issue_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS registered_address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS patronymic TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contacts JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
