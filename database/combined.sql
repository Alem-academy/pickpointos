
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reset Schema (Dev Mode)
DROP TABLE IF EXISTS fact_wb_revenues CASCADE;
DROP TABLE IF EXISTS fact_payroll CASCADE;
DROP TABLE IF EXISTS rent_contracts CASCADE;
DROP TABLE IF EXISTS expense_requests CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS pvz_points CASCADE;
DROP TABLE IF EXISTS import_mappings CASCADE;

DROP TYPE IF EXISTS expense_status CASCADE;
DROP TYPE IF EXISTS expense_category CASCADE;
DROP TYPE IF EXISTS shift_status CASCADE;
DROP TYPE IF EXISTS shift_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS employee_status CASCADE;
DROP TYPE IF EXISTS employee_role CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS transfer_type CASCADE;

-- ENUMS
CREATE TYPE employee_role AS ENUM ('admin', 'hr', 'rf', 'employee');
CREATE TYPE employee_status AS ENUM ('new', 'review', 'revision', 'signing', 'active', 'fired');
CREATE TYPE transaction_type AS ENUM ('revenue', 'fine', 'expense', 'payout');
CREATE TYPE document_type AS ENUM ('contract', 'order', 'id_scan', 'other');
CREATE TYPE document_status AS ENUM ('draft', 'signed', 'rejected');
CREATE TYPE transfer_type AS ENUM ('permanent', 'temporary');
CREATE TYPE shift_type AS ENUM ('scheduled', 'extra');
CREATE TYPE shift_status AS ENUM ('pending', 'open', 'closed', 'absence', 'rejected', 'archived');
CREATE TYPE expense_category AS ENUM ('rent', 'utilities', 'supplies', 'repairs', 'marketing', 'other');
CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- PVZ Points (Справочник точек)
CREATE TABLE pvz_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    region_id VARCHAR(50) NOT NULL, -- Link to region/branch
    wb_id VARCHAR(50), -- Official WB ID (e.g., 304673)
    brand VARCHAR(50) NOT NULL, -- e.g., 'Wildberries'
    area_sqm DECIMAL(10, 2), -- Квадратура (TZ 5.3)
    landlord_id UUID, -- Placeholder for Phase 2
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees (Сотрудники)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iin VARCHAR(12) UNIQUE NOT NULL, -- ИИН (TZ 3.29)
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    role employee_role NOT NULL DEFAULT 'employee',
    status employee_status NOT NULL DEFAULT 'new',
    password_hash VARCHAR(255), -- For Auth
    
    -- Relations
    main_pvz_id UUID REFERENCES pvz_points(id), -- Основной ПВЗ (TZ 3.33)
    current_pvz_id UUID REFERENCES pvz_points(id), -- Текущий ПВЗ (для временных переводов)
    manager_rf_id UUID REFERENCES employees(id), -- Руководитель РФ
    
    -- Financials & Legal
    base_rate DECIMAL(10, 2), -- Ставка
    probation_until DATE, -- Испытательный срок
    
    -- Meta
    hired_at TIMESTAMP WITH TIME ZONE,
    fired_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents (Документы - TZ 4.2)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    type document_type NOT NULL,
    status document_status NOT NULL DEFAULT 'draft',
    
    -- Content
    template_id UUID, -- Future: Link to template
    scan_url TEXT, -- URL to file in storage
    external_id VARCHAR(255), -- ID in eGov/Uchet
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signed_at TIMESTAMP WITH TIME ZONE
);

-- Transfers (История перемещений - TZ 4.5)
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    type transfer_type NOT NULL,
    
    from_pvz_id UUID REFERENCES pvz_points(id),
    to_pvz_id UUID REFERENCES pvz_points(id) NOT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE, -- Null for permanent
    
    reason TEXT,
    initiated_by_id UUID REFERENCES employees(id),
    order_doc_id UUID REFERENCES documents(id), -- Link to the order
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Transactions (Единый журнал)
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pvz_id UUID REFERENCES pvz_points(id),
    employee_id UUID REFERENCES employees(id), -- Optional, for payroll/fines
    
    type transaction_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    
    -- Date of the transaction (not created_at)
    transaction_date DATE NOT NULL,
    
    -- Source (e.g., 'wb_report', 'manual_entry', 'payroll_calc')
    source VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_financial_transaction UNIQUE (pvz_id, transaction_date, type, source, amount)
);

-- Indexes for performance
CREATE INDEX idx_employees_main_pvz ON employees(main_pvz_id);
CREATE INDEX idx_employees_iin ON employees(iin);
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_transfers_employee ON transfers(employee_id);
CREATE INDEX idx_transactions_pvz_date ON financial_transactions(pvz_id, transaction_date);

-- Shifts (Смены)
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    pvz_id UUID REFERENCES pvz_points(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type shift_type NOT NULL DEFAULT 'scheduled',
    status shift_status NOT NULL DEFAULT 'pending',
    planned_hours INTEGER DEFAULT 12,
    actual_hours NUMERIC(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT one_shift_per_day UNIQUE (employee_id, date)
);
-- Expense Requests (Заявки на расходы - TZ 5.2)
CREATE TABLE expense_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pvz_id UUID REFERENCES pvz_points(id) NOT NULL,
    requester_id UUID REFERENCES employees(id) NOT NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    category expense_category NOT NULL,
    description TEXT,
    proof_url TEXT, -- Фото чека/счета
    
    status expense_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    
    approved_by_id UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rent Contracts (Договоры аренды - TZ 5.3)
CREATE TABLE rent_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pvz_id UUID REFERENCES pvz_points(id) NOT NULL,
    
    landlord_name VARCHAR(255) NOT NULL,
    landlord_contact VARCHAR(255),
    
    monthly_rate DECIMAL(12, 2) NOT NULL,
    payment_day INTEGER NOT NULL DEFAULT 1, -- День месяца для оплаты
    
    start_date DATE NOT NULL,
    end_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_pvz_status ON expense_requests(pvz_id, status);
CREATE INDEX idx_expenses_requester ON expense_requests(requester_id);
CREATE INDEX idx_rent_pvz ON rent_contracts(pvz_id);
-- Indexes for shifts
CREATE INDEX idx_shifts_employee ON shifts(employee_id);
CREATE INDEX idx_shifts_pvz_date ON shifts(pvz_id, date);
CREATE INDEX idx_shifts_date ON shifts(date);

-- Fact Tables (Analytics)

-- Payroll Fact Table
CREATE TABLE fact_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pvz_id UUID REFERENCES pvz_points(id),
    employee_id UUID REFERENCES employees(id),
    month DATE NOT NULL, -- First day of month
    
    total_hours NUMERIC(10, 2) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    
    status VARCHAR(20) DEFAULT 'calculated', -- calculated, paid
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_payroll_per_month UNIQUE (employee_id, month)
);

-- WB Revenues Fact Table (Parsed from Excel)
CREATE TABLE fact_wb_revenues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pvz_id UUID REFERENCES pvz_points(id),
    report_date DATE NOT NULL,
    
    total_revenue DECIMAL(12, 2) NOT NULL,
    wb_commission DECIMAL(12, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mappings for Excel Import (Used by Parser)
CREATE TABLE import_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    mapping JSONB NOT NULL, -- The column mapping config
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payroll_month ON fact_payroll(month);
CREATE INDEX idx_wb_revenues_date ON fact_wb_revenues(report_date);
-- Seed data for PVZ Management OS
-- This script populates the database with test data for development

-- Insert PVZ Points (Kazakhstan cities)
INSERT INTO pvz_points (id, name, address, region_id, wb_id, brand, area_sqm, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'ПВЗ Абая 45', 'г. Алматы, пр. Абая, д. 45', 'ALA', '111111', 'Wildberries', 45.5, true),
    ('550e8400-e29b-41d4-a716-446655440002', 'ПВЗ Кабанбай Батыра 88', 'г. Астана, ул. Кабанбай Батыра, д. 88', 'AST', '222222', 'Wildberries', 60.0, true),
    ('550e8400-e29b-41d4-a716-446655440003', 'ПВЗ Сатпаева 12', 'г. Шымкент, ул. Сатпаева, д. 12', 'SHY', '333333', 'Wildberries', 35.0, true),
    ('550e8400-e29b-41d4-a716-446655440004', 'ПВЗ Независимости 33', 'г. Караганда, пр. Независимости, д. 33', 'KAR', '444444', 'Wildberries', 50.0, true),
    ('550e8400-e29b-41d4-a716-446655440005', 'ПВЗ Достык 7', 'г. Актобе, ул. Достык, д. 7', 'AKT', '555555', 'Wildberries', 40.0, true),
    ('550e8400-e29b-41d4-a716-446655440006', 'ПВЗ Кабанбай батыра 45/3', 'г. Астана, Кабанбай батыра 45/3', 'AST', '304673', 'Wildberries', 50.0, true),
    ('550e8400-e29b-41d4-a716-446655440007', 'ПВЗ Акмешит 11', 'г. Астана, Акмешит 11', 'AST', '50140757', 'Wildberries', 50.0, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Employees (Kazakhstan names) with hashed password 'password123'
INSERT INTO employees (id, iin, full_name, email, phone, role, status, main_pvz_id, base_rate, hired_at, password_hash) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', '900101300123', 'Нұрсұлтан Әлімов', 'nursultan.alimov@pvz.kz', '+7 (701) 123-45-67', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440001', 350000, '2023-01-15', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440002', '850505300456', 'Айдар Бекболатов', 'aidar.bekbolatov@pvz.kz', '+7 (702) 234-56-78', 'rf', 'active', '550e8400-e29b-41d4-a716-446655440001', 550000, '2022-11-20', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440003', '920303400789', 'Гүлнар Сапарова', 'gulnar.saparova@pvz.kz', '+7 (705) 345-67-89', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440002', 320000, '2023-03-10', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440004', '950707300111', 'Ержан Қайратов', 'yerzhan.kairatov@pvz.kz', '+7 (707) 456-78-90', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440002', 380000, '2023-02-05', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440005', '881111400222', 'Асель Нұрланова', 'asel.nurlanova@pvz.kz', '+7 (708) 567-89-01', 'rf', 'active', '550e8400-e29b-41d4-a716-446655440003', 550000, '2023-01-01', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440006', '980909300333', 'Дәурен Төлеуов', 'dauren.toleuov@pvz.kz', '+7 (701) 678-90-12', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440003', 350000, '2023-04-12', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440007', '910202400444', 'Жанар Әбдіқалықова', 'zhanar.abdikalykova@pvz.kz', '+7 (702) 789-01-23', 'employee', 'fired', '550e8400-e29b-41d4-a716-446655440001', 320000, '2022-08-15', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440008', '890606300555', 'Бауыржан Мұратов', 'baurzhan.muratov@pvz.kz', '+7 (705) 890-12-34', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440004', 380000, '2023-05-20', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440009', '930404400666', 'Әйгерім Сағындықова', 'aigerim.sagyndykova@pvz.kz', '+7 (707) 901-23-45', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440004', 320000, '2023-06-01', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440010', '870808300777', 'Серік Әмірханов', 'serik.amirkhanov@pvz.kz', '+7 (708) 012-34-56', 'rf', 'active', '550e8400-e29b-41d4-a716-446655440002', 550000, '2022-12-10', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440011', '940505400888', 'Айнұр Сейітова', 'ainur.seitova@pvz.kz', '+7 (701) 111-22-33', 'employee', 'signing', '550e8400-e29b-41d4-a716-446655440005', 350000, '2023-10-15', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440012', '960606300999', 'Мақсат Берікболов', 'maksat.berikbolov@pvz.kz', '+7 (702) 222-33-44', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440005', 380000, '2023-07-22', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440013', '970707400000', 'Назерке Жұмабаева', 'nazerke.zhumabaeva@pvz.kz', '+7 (705) 333-44-55', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440003', 320000, '2023-08-05', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440014', '990808300111', 'Қанат Әбілдаев', 'kanat.abildaev@pvz.kz', '+7 (707) 444-55-66', 'employee', 'review', '550e8400-e29b-41d4-a716-446655440001', 350000, '2023-10-20', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440015', '000909400222', 'Индира Досова', 'indira.dosova@pvz.kz', '+7 (708) 555-66-77', 'employee', 'review', '550e8400-e29b-41d4-a716-446655440002', 320000, '2023-09-10', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.')
ON CONFLICT (id) DO NOTHING;

-- Update fired employee
UPDATE employees SET fired_at = '2023-09-20' WHERE id = '650e8400-e29b-41d4-a716-446655440007';

-- Insert sample financial transactions
INSERT INTO financial_transactions (pvz_id, type, amount, description, transaction_date, source) VALUES
    -- Revenue for PVZ 1 (Almaty)
    ('550e8400-e29b-41d4-a716-446655440001', 'revenue', 2500000, 'WB Sales - Current Week', CURRENT_DATE, 'wb_report'),
    ('550e8400-e29b-41d4-a716-446655440001', 'fine', -45000, 'Late delivery penalty', CURRENT_DATE, 'wb_report'),
    ('550e8400-e29b-41d4-a716-446655440001', 'expense', -180000, 'Rent - Current Month', date_trunc('month', CURRENT_DATE), 'manual_entry'),
    ('550e8400-e29b-41d4-a716-446655440001', 'payout', -850000, 'Payroll - Current Month', CURRENT_DATE, 'payroll_calc'),
    
    -- Revenue for PVZ 2 (Astana)
    ('550e8400-e29b-41d4-a716-446655440002', 'revenue', 3200000, 'WB Sales - Current Week', CURRENT_DATE, 'wb_report'),
    ('550e8400-e29b-41d4-a716-446655440002', 'fine', -32000, 'Quality issues', CURRENT_DATE, 'wb_report'),
    ('550e8400-e29b-41d4-a716-446655440002', 'expense', -220000, 'Rent - Current Month', date_trunc('month', CURRENT_DATE), 'manual_entry'),
    ('550e8400-e29b-41d4-a716-446655440002', 'payout', -1100000, 'Payroll - Current Month', CURRENT_DATE, 'payroll_calc'),
    
    -- Revenue for PVZ 3 (Shymkent)
    ('550e8400-e29b-41d4-a716-446655440003', 'revenue', 1800000, 'WB Sales - Current Week', CURRENT_DATE, 'wb_report'),
    ('550e8400-e29b-41d4-a716-446655440003', 'fine', -28000, 'Damaged goods', CURRENT_DATE, 'wb_report'),
    ('550e8400-e29b-41d4-a716-446655440003', 'expense', -150000, 'Rent - Current Month', date_trunc('month', CURRENT_DATE), 'manual_entry'),
    ('550e8400-e29b-41d4-a716-446655440003', 'payout', -720000, 'Payroll - Current Month', CURRENT_DATE, 'payroll_calc')
ON CONFLICT DO NOTHING;

-- Insert Expense Requests (Pending/Approved)
INSERT INTO expense_requests (pvz_id, requester_id, amount, category, description, status, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 15000, 'supplies', 'Канцелярия (бумага, ручки)', 'approved', NOW() - INTERVAL '2 days'),
    ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 5000, 'marketing', 'Листовки', 'pending', NOW() - INTERVAL '1 day'),
    ('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', 25000, 'repairs', 'Ремонт принтера', 'pending', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Rent Contracts
INSERT INTO rent_contracts (pvz_id, landlord_name, monthly_rate, payment_day, start_date) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'ИП Арендодатель 1', 180000, 5, '2023-01-01'),
    ('550e8400-e29b-41d4-a716-446655440002', 'ИП Арендодатель 2', 220000, 10, '2023-01-01'),
    ('550e8400-e29b-41d4-a716-446655440003', 'ИП Арендодатель 3', 150000, 1, '2023-01-01')
ON CONFLICT (id) DO NOTHING;

-- Insert Shifts (Current Month)
INSERT INTO shifts (employee_id, pvz_id, date, type, status, planned_hours, actual_hours) VALUES
    -- Employee 1 at PVZ 1 (Yesterday - Closed)
    ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 day', 'scheduled', 'closed', 12, 12),
    -- Employee 1 at PVZ 1 (Today - Open)
    ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 'scheduled', 'open', 12, NULL),
    -- Employee 3 at PVZ 2 (Today - Open)
    ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'scheduled', 'open', 12, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert HR admin user
INSERT INTO employees (id, iin, full_name, email, phone, role, status, base_rate, hired_at, password_hash) VALUES
    ('650e8400-e29b-41d4-a716-446655440099', '800101400999', 'Айгүл Қасымова', 'aigul.kasymova@pvz.kz', '+7 (701) 999-99-99', 'hr', 'active', 650000, '2022-01-10', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.'),
    ('650e8400-e29b-41d4-a716-446655440000', '000000000000', 'Super Admin', 'admin@pvz.kz', '+7 (700) 000-00-00', 'admin', 'active', 0, '2020-01-01', '$2b$10$gaH3qxjXaJT1BXx0a/rHMeg2dn805mSG5tTkIfdiFLxmNgYsUZIh.')
ON CONFLICT (id) DO NOTHING;

COMMIT;
