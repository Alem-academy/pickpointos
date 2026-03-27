-- Migration 011: Add Sigex tracking columns to documents
-- Added: 2026-03-26
-- Reason: Track Sigex document IDs and save CMS signatures

-- Add Sigex tracking columns
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS sigex_document_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS signature_cms TEXT,
ADD COLUMN IF NOT EXISTS signature_xml TEXT,
ADD COLUMN IF NOT EXISTS sigex_operation_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_documents_sigex_document_id ON documents(sigex_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_sigex_operation_id ON documents(sigex_operation_id);
CREATE INDEX IF NOT EXISTS idx_documents_signature_cms ON documents(signature_cms) WHERE signature_cms IS NOT NULL;

-- Add comments
COMMENT ON COLUMN documents.sigex_document_id IS 'Document ID in Sigex system';
COMMENT ON COLUMN documents.signature_cms IS 'CMS signature in base64 format';
COMMENT ON COLUMN documents.signature_xml IS 'XML signature (alternative format)';
COMMENT ON COLUMN documents.sigex_operation_id IS 'eGov QR signing operation ID';
COMMENT ON COLUMN documents.archived_at IS 'Timestamp when document was archived';

-- Verification query
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
  AND column_name IN ('sigex_document_id', 'signature_cms', 'signature_xml', 'sigex_operation_id', 'archived_at')
ORDER BY ordinal_position;
