-- Migration 008: Import PVZ data from точки.csv
-- Added: 2026-03-26
-- Prerequisites: Migration 007 must be run first to create employers table
-- Usage: Run this AFTER migration 007

-- This migration links existing PVZ to employers based on the CSV mapping
-- ИП Жасмин: 58 PVZ
-- ИП Ориентал: 12 PVZ  
-- ТОО PVZ.kz: 1 PVZ

-- Update PVZ with employer_id based on WB ID mapping from точки.csv

-- ИП Жасмин (58 точек)
UPDATE pvz_points SET employer_id = (SELECT id FROM employers WHERE name_short = 'Жасмин' LIMIT 1)
WHERE wb_id IN (
    '5129','111497','4204','2090','155819','103784','146649','140349','2404','1122',
    '108011','107363','2344','101634','150721','50035323','156629','5771','135366',
    '50140757','110972','50062171','50034972','688','3102','289','2536','109515',
    '5855','113428','212720','212961','3508','113516','105311','5066','4159',
    '109451','211180','211437','211549','112836','3517','3687','102231','105383',
    '106167','111251','105954','108803','3735','105903','118324','2609','1991',
    '1414','2914'
);

-- ИП Ориентал (12 точек)
UPDATE pvz_points SET employer_id = (SELECT id FROM employers WHERE name_short = 'Ориентал' LIMIT 1)
WHERE wb_id IN (
    '167580','316701','50001191','304673','327906','304514','50009003','312008',
    '301012','300486','301005','154426','211253'
);

-- ТОО PVZ.kz (1 точка)
UPDATE pvz_points SET employer_id = (SELECT id FROM employers WHERE name_short = 'PVZ.kz' LIMIT 1)
WHERE wb_id IN ('50100802');

-- Verification: Show PVZ count per employer
SELECT 
    e.name_full as employer,
    e.name_short,
    COUNT(p.id) as pvz_count
FROM pvz_points p
INNER JOIN employers e ON p.employer_id = e.id
GROUP BY e.name_full, e.name_short
ORDER BY pvz_count DESC;

-- Update employees' employer_id based on their main_pvz_id
-- This ensures all employees inherit the employer from their assigned PVZ
UPDATE employees e
SET employer_id = (
    SELECT p.employer_id 
    FROM pvz_points p 
    WHERE p.id = e.main_pvz_id
)
WHERE e.main_pvz_id IS NOT NULL 
  AND e.employer_id IS NULL;

-- Verification: Show employee count per employer
SELECT 
    e.name_full as employer,
    COUNT(emp.id) as employee_count
FROM employers e
LEFT JOIN employees emp ON emp.employer_id = e.id
GROUP BY e.name_full
ORDER BY employee_count DESC;
