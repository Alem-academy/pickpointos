-- Migration: Import PVZ from CSV with employer linkage
-- Run this SQL directly in Railway database

-- First, verify employers exist
-- ИП Жасмин, ИП Ориентал, ТОО PVZ.kz should already exist

-- Update existing PVZ with employer_id based on company mapping
-- ИП Жасмин PVZ (most common)
UPDATE pvz_points SET employer_id = (SELECT id FROM employers WHERE name_full LIKE '%Жасмин%' LIMIT 1)
WHERE wb_id IN (
    '5129','111497','4204','2090','155819','103784','146649','140349','2404','1122',
    '108011','107363','2344','101634','150721','50035323','156629','5771','135366',
    '50140757','110972','50062171','50034972','688','3102','289','2536','109515',
    '5855','113428','212720','212961','3508','113516','105311','5066','4159',
    '109451','211180','211437','211549','112836','3517','3687','102231','105383',
    '106167','111251','105954','108803','3735','105903','118324','2609','1991',
    '1414','2914'
);

-- ИП Ориентал PVZ
UPDATE pvz_points SET employer_id = (SELECT id FROM employers WHERE name_full LIKE '%Ориентал%' LIMIT 1)
WHERE wb_id IN (
    '167580','316701','50001191','304673','327906','304514','50009003','312008',
    '301012','300486','301005','154426','211253'
);

-- ТОО PVZ.kz PVZ
UPDATE pvz_points SET employer_id = (SELECT id FROM employers WHERE name_full LIKE '%PVZ%' LIMIT 1)
WHERE wb_id IN ('50100802');

-- Verify the update
SELECT 
    e.name_full as employer,
    COUNT(p.id) as pvz_count
FROM pvz_points p
LEFT JOIN employers e ON p.employer_id = e.id
GROUP BY e.name_full
ORDER BY pvz_count DESC;
