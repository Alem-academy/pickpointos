# Manual Migration Instructions for Employers Table

## Issue
The automatic migration `005_add_employers_table.sql` may fail on Railway due to PostgreSQL syntax with DO blocks.

## Manual Steps to Apply Migration

### Option 1: Via Railway Dashboard

1. Go to https://railway.app/
2. Open project: **miraculous-possibility**
3. Click on **PostgreSQL** database
4. Go to **Data** tab
5. Click **SQL Query** or **Run SQL**
6. Copy and paste the following SQL:

```sql
-- Create employers table
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_employers_active ON employers(is_active);

-- Add employer_id column if not exists
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES employers(id);
CREATE INDEX IF NOT EXISTS idx_employees_employer ON employees(employer_id);

-- Insert 3 legal entities
INSERT INTO employers (name_full, name_short, bin, iin, director_name, director_name_dative, address_legal, bank_name, bik, iban, is_active) VALUES
('ИП «Жасмин»', 'Жасмин', NULL, '910729401967', 'Карабаева Г.Е.', 'Карабаевой Г.Е.', 'г. Алматы, Бурундайская, дом 93 А', 'АО «Kaspi Bank»', 'CASPKZKA', NULL, TRUE),
('ИП «Ориентал»', 'Ориентал', NULL, '881212402575', 'Карабаева Г.Е.', 'Карабаевой Г.Е.', 'г. Алматы, ул. Хакимжанова 12', 'АО «Kaspi Bank»', 'CASPKZKA', NULL, TRUE),
('ТОО «PVZ.kz»', 'PVZ.kz', '250540026389', NULL, 'Карабаева Г.Е.', 'Карабаевой Г.Е.', 'г. Астана, проспект Кабанбай Батыр, дом 40, ВП 28', 'АО «Freedom Bank»', NULL, NULL, TRUE)
ON CONFLICT (name_full) DO NOTHING;

-- Update existing employees
UPDATE employees SET employer_id = (SELECT id FROM employers WHERE name_full = 'ИП «Жасмин»' LIMIT 1)
WHERE employer_id IS NULL;
```

7. Click **Run**

### Option 2: Via Railway CLI

```bash
# Connect to database
railway connect

# Or use psql directly with connection string
psql "YOUR_RAILWAY_DATABASE_URL" -f parser/src/migrations/005_add_employers_table.sql
```

## Verify Migration

After running the migration, verify it worked:

```sql
-- Should return 3 rows
SELECT id, name_full, bin, iin FROM employers;

-- Check column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name = 'employer_id';
```

## Expected Result

After successful migration:
- ✅ `employers` table exists with 3 records
- ✅ `employees` table has `employer_id` column
- ✅ All existing employees linked to ИП «Жасмин»
- ✅ API endpoint `/api/employers` returns list of legal entities
- ✅ Employee profile shows employer selector

