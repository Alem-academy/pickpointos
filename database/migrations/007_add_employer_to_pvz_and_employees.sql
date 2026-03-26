-- Migration 007: Add employer linkage to PVZ and Employees
-- Added: 2026-03-26
-- Reason: Each PVZ is linked to a specific legal entity (юрлицо).
--          Employees are hired to a specific PVZ and thus to the corresponding employer.

-- Step 1: Create employers table if not exists
CREATE TABLE IF NOT EXISTS employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_full VARCHAR(255) NOT NULL,        -- Полное название (ИП «Жасмин», ТОО «PVZ.kz»)
    name_short VARCHAR(100),                 -- Краткое название (Жасмин, PVZ.kz)
    bin VARCHAR(12) UNIQUE,                  -- БИН юрлица
    iin VARCHAR(12),                         -- ИИН ИП
    director_name VARCHAR(255),              -- Директор (ТОО) или сам ИП
    director_name_dative VARCHAR(255),       -- Директор в дательном падеже
    address_legal TEXT,                      -- Юридический адрес
    bank_name VARCHAR(255),                  -- Банк
    bik VARCHAR(50),                         -- БИК банка
    iban VARCHAR(20),                        -- Расчетный счет
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert default employers (if not exist)
-- Data source: Матрица реквизитов - Лист1 (1).csv
-- Note: ИБАНы не указаны в исходных данных - добавить после импорта

-- Insert ИП Жасмин
INSERT INTO employers (name_full, name_short, bin, iin, director_name, director_name_dative, address_legal, bank_name, bik, iban)
SELECT 'Индивидуальный предприниматель «Жасмин»', 'Жасмин', '910729401967', '910729401967', 'Карабаева Г.Е.', 'Карабаевой Г.Е.', 'г.Алматы, Бурундайская, дом 93 А', 'АО «Kaspi Bank»', 'CASPKZKA', NULL
WHERE NOT EXISTS (SELECT 1 FROM employers WHERE bin = '910729401967');

-- Insert ИП Ориентал
INSERT INTO employers (name_full, name_short, bin, iin, director_name, director_name_dative, address_legal, bank_name, bik, iban)
SELECT 'Индивидуальный предприниматель «Ориентал»', 'Ориентал', NULL, '881212402575', 'Карабаева Г.Е.', 'Карабаевой Г.Е.', 'г. Алматы, ул. Хакимжанова 12', 'АО «Kaspi Bank»', 'CASPKZKA', NULL
WHERE NOT EXISTS (SELECT 1 FROM employers WHERE iin = '881212402575');

-- Insert ТОО PVZ.kz
INSERT INTO employers (name_full, name_short, bin, iin, director_name, director_name_dative, address_legal, bank_name, bik, iban)
SELECT 'Товарищество с ограниченной ответственностью «PVZ.kz»', 'PVZ.kz', '250540026389', NULL, 'Карабаева Г.Е.', 'Карабаевой Г.Е.', 'г. Астана, проспект Кабанбай Батыр, дом 40, ВП 28', 'АО «Freedom Bank»', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM employers WHERE bin = '250540026389');

-- IMPORTANT: After running this migration, update IBANs manually:
-- UPDATE employers SET iban = 'KZ...' WHERE name_short = 'Жасмин';
-- UPDATE employers SET iban = 'KZ...' WHERE name_short = 'Ориентал';
-- UPDATE employers SET iban = 'KZ...' WHERE name_short = 'PVZ.kz';
-- UPDATE employers SET bik = 'FZBKKZKA' WHERE name_short = 'PVZ.kz'; -- Freedom Bank BIK

-- Step 3: Add employer_id to pvz_points
ALTER TABLE pvz_points 
ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES employers(id);

-- Step 4: Add employer_id to employees (for direct access, cached from main_pvz)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES employers(id);

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_pvz_employer ON pvz_points(employer_id);
CREATE INDEX IF NOT EXISTS idx_employee_employer ON employees(employer_id);

-- Step 6: Add trigger to auto-update employee.employer_id when main_pvz_id changes
-- IMPORTANT: employer_id is ONLY updated on main_pvz_id change (permanent transfer)
-- Temporary assignments (current_pvz_id) do NOT change employer_id
CREATE OR REPLACE FUNCTION update_employee_employer()
RETURNS TRIGGER AS $$
BEGIN
    -- Update employer_id ONLY when main_pvz_id changes (permanent transfer)
    -- This triggers contract termination/re-signing process
    IF NEW.main_pvz_id IS DISTINCT FROM OLD.main_pvz_id THEN
        NEW.employer_id := (SELECT employer_id FROM pvz_points WHERE id = NEW.main_pvz_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_employee_employer ON employees;
CREATE TRIGGER trg_update_employee_employer
    BEFORE INSERT OR UPDATE OF main_pvz_id ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_employer();

-- Step 7: Update existing employees' employer_id based on their main_pvz
UPDATE employees e
SET employer_id = (
    SELECT p.employer_id 
    FROM pvz_points p 
    WHERE p.id = e.main_pvz_id
)
WHERE e.main_pvz_id IS NOT NULL;

-- Verification query
SELECT 
    e.name_full as employer,
    COUNT(DISTINCT p.id) as pvz_count,
    COUNT(DISTINCT emp.id) as employee_count
FROM employers e
LEFT JOIN pvz_points p ON p.employer_id = e.id
LEFT JOIN employees emp ON emp.employer_id = e.id
GROUP BY e.name_full
ORDER BY pvz_count DESC;
