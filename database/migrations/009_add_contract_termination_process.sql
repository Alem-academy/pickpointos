-- Migration 009: Add contract termination and re-signing process
-- Added: 2026-03-26
-- Reason: Support permanent transfers between PVZ with different employers
--         Temporary replacements do NOT require contract re-signing

-- Contract termination requests (for permanent transfers)
CREATE TABLE IF NOT EXISTS contract_terminations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    
    -- From/to employers
    from_employer_id UUID REFERENCES employers(id) NOT NULL,
    to_employer_id UUID REFERENCES employers(id) NOT NULL,
    
    -- From/to PVZ
    from_pvz_id UUID REFERENCES pvz_points(id) NOT NULL,
    to_pvz_id UUID REFERENCES pvz_points(id) NOT NULL,
    
    -- Termination details
    termination_date DATE NOT NULL,
    reason TEXT NOT NULL DEFAULT 'Перевод на другой ПВЗ',
    
    -- Document links
    termination_doc_id UUID REFERENCES documents(id), -- Приказ об увольнении/расторжении
    new_contract_doc_id UUID REFERENCES documents(id), -- Новый трудовой договор
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, completed, cancelled
    approved_by_id UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Meta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_terminations_employee ON contract_terminations(employee_id);
CREATE INDEX IF NOT EXISTS idx_terminations_status ON contract_terminations(status);

-- Add comment to current_pvz_id to clarify its purpose
COMMENT ON COLUMN employees.current_pvz_id IS 'Текущий ПВЗ для временной замены (не влияет на employer_id и договор)';

-- View: Employees on temporary assignment (working on different PVZ than their main)
CREATE OR REPLACE VIEW employees_on_assignment AS
SELECT 
    e.id,
    e.full_name,
    e.iin,
    main_pvz.name as main_pvz_name,
    main_pvz.address as main_pvz_address,
    main_emp.name_short as main_employer,
    current_pvz.name as current_pvz_name,
    current_pvz.address as current_pvz_address,
    current_emp.name_short as current_employer,
    CASE 
        WHEN e.current_pvz_id IS NOT NULL AND e.current_pvz_id != e.main_pvz_id THEN 'temporary'
        WHEN e.current_pvz_id IS NULL OR e.current_pvz_id = e.main_pvz_id THEN 'main'
        ELSE 'unknown'
    END as assignment_type
FROM employees e
LEFT JOIN pvz_points main_pvz ON e.main_pvz_id = main_pvz.id
LEFT JOIN employers main_emp ON main_pvz.employer_id = main_emp.id
LEFT JOIN pvz_points current_pvz ON e.current_pvz_id = current_pvz.id
LEFT JOIN employers current_emp ON current_pvz.employer_id = current_emp.id
WHERE e.current_pvz_id IS NOT NULL;

-- Grant permissions (adjust as needed)
-- GRANT SELECT ON employees_on_assignment TO hr;
