-- Migration 004: Add missing columns to documents table
-- Added: 2026-03-12
-- Reason: Backend was trying to insert thumbnail_url but column didn't exist

ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS egov_operation_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS egov_status TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signers JSONB;
