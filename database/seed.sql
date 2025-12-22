-- Seed data for PVZ Management OS
-- This script populates the database with test data for development

-- Insert PVZ Points (Kazakhstan cities)
INSERT INTO pvz_points (id, name, address, region_id, brand, area_sqm, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'ПВЗ Абая 45', 'г. Алматы, пр. Абая, д. 45', 'ALA', 'Wildberries', 45.5, true),
    ('550e8400-e29b-41d4-a716-446655440002', 'ПВЗ Кабанбай Батыра 88', 'г. Астана, ул. Кабанбай Батыра, д. 88', 'AST', 'Wildberries', 60.0, true),
    ('550e8400-e29b-41d4-a716-446655440003', 'ПВЗ Сатпаева 12', 'г. Шымкент, ул. Сатпаева, д. 12', 'SHY', 'Wildberries', 35.0, true),
    ('550e8400-e29b-41d4-a716-446655440004', 'ПВЗ Независимости 33', 'г. Караганда, пр. Независимости, д. 33', 'KAR', 'Wildberries', 50.0, true),
    ('550e8400-e29b-41d4-a716-446655440005', 'ПВЗ Достык 7', 'г. Актобе, ул. Достык, д. 7', 'AKT', 'Wildberries', 40.0, true);

-- Insert Employees (Kazakhstan names) with hashed password 'password123'
INSERT INTO employees (id, iin, full_name, email, phone, role, status, main_pvz_id, base_rate, hired_at, password_hash) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', '900101300123', 'Нұрсұлтан Әлімов', 'nursultan.alimov@pvz.kz', '+7 (701) 123-45-67', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440001', 350000, '2023-01-15', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440002', '850505300456', 'Айдар Бекболатов', 'aidar.bekbolatov@pvz.kz', '+7 (702) 234-56-78', 'rf', 'active', '550e8400-e29b-41d4-a716-446655440001', 550000, '2022-11-20', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440003', '920303400789', 'Гүлнар Сапарова', 'gulnar.saparova@pvz.kz', '+7 (705) 345-67-89', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440002', 320000, '2023-03-10', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440004', '950707300111', 'Ержан Қайратов', 'yerzhan.kairatov@pvz.kz', '+7 (707) 456-78-90', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440002', 380000, '2023-02-05', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440005', '881111400222', 'Асель Нұрланова', 'asel.nurlanova@pvz.kz', '+7 (708) 567-89-01', 'rf', 'active', '550e8400-e29b-41d4-a716-446655440003', 550000, '2023-01-01', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440006', '980909300333', 'Дәурен Төлеуов', 'dauren.toleuov@pvz.kz', '+7 (701) 678-90-12', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440003', 350000, '2023-04-12', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440007', '910202400444', 'Жанар Әбдіқалықова', 'zhanar.abdikalykova@pvz.kz', '+7 (702) 789-01-23', 'employee', 'fired', '550e8400-e29b-41d4-a716-446655440001', 320000, '2022-08-15', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440008', '890606300555', 'Бауыржан Мұратов', 'baurzhan.muratov@pvz.kz', '+7 (705) 890-12-34', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440004', 380000, '2023-05-20', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440009', '930404400666', 'Әйгерім Сағындықова', 'aigerim.sagyndykova@pvz.kz', '+7 (707) 901-23-45', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440004', 320000, '2023-06-01', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440010', '870808300777', 'Серік Әмірханов', 'serik.amirkhanov@pvz.kz', '+7 (708) 012-34-56', 'rf', 'active', '550e8400-e29b-41d4-a716-446655440002', 550000, '2022-12-10', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440011', '940505400888', 'Айнұр Сейітова', 'ainur.seitova@pvz.kz', '+7 (701) 111-22-33', 'employee', 'signing', '550e8400-e29b-41d4-a716-446655440005', 350000, '2023-10-15', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440012', '960606300999', 'Мақсат Берікболов', 'maksat.berikbolov@pvz.kz', '+7 (702) 222-33-44', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440005', 380000, '2023-07-22', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440013', '970707400000', 'Назерке Жұмабаева', 'nazerke.zhumabaeva@pvz.kz', '+7 (705) 333-44-55', 'employee', 'active', '550e8400-e29b-41d4-a716-446655440003', 320000, '2023-08-05', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440014', '990808300111', 'Қанат Әбілдаев', 'kanat.abildaev@pvz.kz', '+7 (707) 444-55-66', 'employee', 'review', '550e8400-e29b-41d4-a716-446655440001', 350000, '2023-10-20', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440015', '000909400222', 'Индира Досова', 'indira.dosova@pvz.kz', '+7 (708) 555-66-77', 'employee', 'review', '550e8400-e29b-41d4-a716-446655440002', 320000, '2023-09-10', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma');

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
    ('550e8400-e29b-41d4-a716-446655440003', 'payout', -720000, 'Payroll - Current Month', CURRENT_DATE, 'payroll_calc');

-- Insert Expense Requests (Pending/Approved)
INSERT INTO expense_requests (pvz_id, requester_id, amount, category, description, status, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 15000, 'supplies', 'Канцелярия (бумага, ручки)', 'approved', NOW() - INTERVAL '2 days'),
    ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 5000, 'marketing', 'Листовки', 'pending', NOW() - INTERVAL '1 day'),
    ('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', 25000, 'repairs', 'Ремонт принтера', 'pending', NOW());

-- Insert Rent Contracts
INSERT INTO rent_contracts (pvz_id, landlord_name, monthly_rate, payment_day, start_date) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'ИП Арендодатель 1', 180000, 5, '2023-01-01'),
    ('550e8400-e29b-41d4-a716-446655440002', 'ИП Арендодатель 2', 220000, 10, '2023-01-01'),
    ('550e8400-e29b-41d4-a716-446655440003', 'ИП Арендодатель 3', 150000, 1, '2023-01-01');

-- Insert Shifts (Current Month)
INSERT INTO shifts (employee_id, pvz_id, date, type, status, planned_hours, actual_hours) VALUES
    -- Employee 1 at PVZ 1 (Yesterday - Closed)
    ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 day', 'scheduled', 'closed', 12, 12),
    -- Employee 1 at PVZ 1 (Today - Open)
    ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 'scheduled', 'open', 12, NULL),
    -- Employee 3 at PVZ 2 (Today - Open)
    ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'scheduled', 'open', 12, NULL);

-- Insert HR admin user
INSERT INTO employees (id, iin, full_name, email, phone, role, status, base_rate, hired_at, password_hash) VALUES
    ('650e8400-e29b-41d4-a716-446655440099', '800101400999', 'Айгүл Қасымова', 'aigul.kasymova@pvz.kz', '+7 (701) 999-99-99', 'hr', 'active', 650000, '2022-01-10', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma'),
    ('650e8400-e29b-41d4-a716-446655440000', '000000000000', 'Super Admin', 'admin@pvz.kz', '+7 (700) 000-00-00', 'admin', 'active', 0, '2020-01-01', '$2b$10$56W0szsuUZopLXUoi6h9VOGlZrLWdxzYHAcbuJ0KG93SNaUMZT.Ma');

COMMIT;
