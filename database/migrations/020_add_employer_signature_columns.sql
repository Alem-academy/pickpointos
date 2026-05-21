-- Migration 020: Add employer signature and document completion columns
-- Added: 2026-04-27
-- Reason: Support employer NCALayer signing and signature sheet generation

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS signature_cms_employer TEXT,
ADD COLUMN IF NOT EXISTS employer_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS employer_cert_info JSONB,
ADD COLUMN IF NOT EXISTS requires_employer_signature BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS signing_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS signing_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signature_sheet_url TEXT,
ADD COLUMN IF NOT EXISTS signature_sheet_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS final_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS final_pdf_generated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_documents_employer_signed_at ON documents(employer_signed_at);
CREATE INDEX IF NOT EXISTS idx_documents_requires_employer_signature ON documents(requires_employer_signature);
CREATE INDEX IF NOT EXISTS idx_documents_signing_method ON documents(signing_method);

-- Add comments
COMMENT ON COLUMN documents.signature_cms_employer IS 'CMS signature (base64) from employer NCALayer signing';
COMMENT ON COLUMN documents.employer_signed_at IS 'Timestamp when employer signed the document';
COMMENT ON COLUMN documents.employer_cert_info IS 'Employer certificate info (JSONB)';
COMMENT ON COLUMN documents.requires_employer_signature IS 'Whether document requires employer signature';
COMMENT ON COLUMN documents.signing_method IS 'Method used for signing: egov, ncalayer, etc.';
COMMENT ON COLUMN documents.signing_completed_at IS 'Timestamp when both parties signed';
COMMENT ON COLUMN documents.signature_sheet_url IS 'URL to generated signature sheet PDF';
COMMENT ON COLUMN documents.signature_sheet_generated_at IS 'Timestamp when signature sheet was generated';
COMMENT ON COLUMN documents.final_pdf_url IS 'URL to final signed PDF with all signatures';
COMMENT ON COLUMN documents.final_pdf_generated_at IS 'Timestamp when final PDF was generated';

-- Verification query
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
  AND column_name IN (
    'signature_cms_employer', 'employer_signed_at', 'employer_cert_info',
    'requires_employer_signature', 'signing_method', 'signing_completed_at',
    'signature_sheet_url', 'signature_sheet_generated_at',
    'final_pdf_url', 'final_pdf_generated_at'
  )
ORDER BY ordinal_position;
