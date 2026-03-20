-- Migration 005: Add new document types to ENUM
-- Added: 2026-03-17
-- Reason: Upload was failing with "invalid input value for enum document_type: id_main"

-- Add new document types for employee onboarding
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'id_main';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'id_register';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'photo';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'cert_075';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'bank_details';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'cert_tb';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'address_cert';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'application';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'order_hiring';
