-- Migration: Add new document types to ENUM
-- This adds support for vacation, termination, and certificate documents

-- Add new values to document_type ENUM
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'vacation_application';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'vacation_order';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'termination_order';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'employment_certificate';

COMMENT ON TYPE document_type IS 'Document types including HR documents, vacation, termination, and certificates';
