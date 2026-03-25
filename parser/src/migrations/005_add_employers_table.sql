-- Migration: Add employers table for multi-entity support
-- Created: 2026-03-25

-- Create employers table to store legal entity requisites
CREATE TABLE IF NOT EXISTS employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_full VARCHAR(255) NOT NULL,
    name_short VARCHAR(100),
    bin VARCHAR(12),
    iin VARCHAR(12),
    director_name VARCHAR(255) NOT NULL,
    director_name_dative VARCHAR(255),
    address_legal TEXT,
    bank_name VARCHAR(255),
    bik VARCHAR(8),
    iban VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for active employers
CREATE INDEX IF NOT EXISTS idx_employers_active ON employers(is_active);

-- Add employer_id to employees table (if column doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'employer_id'
    ) THEN
        ALTER TABLE employees ADD COLUMN employer_id UUID REFERENCES employers(id);
        CREATE INDEX idx_employees_employer ON employees(employer_id);
    END IF;
END $$;

-- Insert the 3 legal entities (use ON CONFLICT on name_full)
INSERT INTO employers (name_full, name_short, bin, iin, director_name, director_name_dative, address_legal, bank_name, bik, iban, is_active) VALUES
-- Юрлицо 1: ИП «Жасмин»
(
    'ИП «Жасмин»',
    'Жасмин',
    NULL,
    '910729401967',
    'Карабаева Г.Е.',
    'Карабаевой Г.Е.',
    'г. Алматы, Бурундайская, дом 93 А',
    'АО «Kaspi Bank»',
    'CASPKZKA',
    NULL,
    TRUE
),
-- Юрлицо 2: ИП «Ориентал»
(
    'ИП «Ориентал»',
    'Ориентал',
    NULL,
    '881212402575',
    'Карабаева Г.Е.',
    'Карабаевой Г.Е.',
    'г. Алматы, ул. Хакимжанова 12',
    'АО «Kaspi Bank»',
    'CASPKZKA',
    NULL,
    TRUE
),
-- Юрлицо 3: ТОО «PVZ.kz»
(
    'ТОО «PVZ.kz»',
    'PVZ.kz',
    '250540026389',
    NULL,
    'Карабаева Г.Е.',
    'Карабаевой Г.Е.',
    'г. Астана, проспект Кабанбай Батыр, дом 40, ВП 28',
    'АО «Freedom Bank»',
    NULL,
    NULL,
    TRUE
)
ON CONFLICT (name_full) DO NOTHING;

-- Update existing employees to use first employer (ИП «Жасмин») as default
UPDATE employees 
SET employer_id = (SELECT id FROM employers WHERE name_full = 'ИП «Жасмин»' LIMIT 1)
WHERE employer_id IS NULL;

COMMENT ON TABLE employers IS 'Legal entities (юрлица) for document generation';
COMMENT ON COLUMN employees.employer_id IS 'Links employee to their legal entity';
