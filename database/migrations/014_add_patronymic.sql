-- Migration 014: Add patronymic (otchestvo) to employees
-- Added: 2026-04-08
-- Reason: Full name requires middle name for document generation

ALTER TABLE employees ADD COLUMN IF NOT EXISTS patronymic VARCHAR(100);
