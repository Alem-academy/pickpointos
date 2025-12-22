
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
