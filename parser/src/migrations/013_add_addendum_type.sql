-- Migration 013: Add addendum document type
-- Added: 2026-04-08
-- Reason: Support for supplementary agreements to employment contracts

ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'addendum';
COMMENT ON TYPE document_type IS 'Document types including addendum (supplementary agreement)';
