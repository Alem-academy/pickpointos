-- Migration 019: Change document.type from ENUM to TEXT to support template keys
-- Reason: Template-based document generation uses specific keys like '13_zayavlenie-o-prieme-na-rabotu'
-- which don't fit in the fixed ENUM. TEXT allows any document type identifier.

ALTER TABLE documents ALTER COLUMN type TYPE TEXT;
