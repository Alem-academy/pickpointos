-- Migration 021: Add gender column to employees
-- Added: 2026-04-27
-- Reason: Support gender-specific declension in document templates

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

COMMENT ON COLUMN employees.gender IS 'Пол сотрудника: male (мужской) или female (женский)';

-- Verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees' AND column_name = 'gender';
