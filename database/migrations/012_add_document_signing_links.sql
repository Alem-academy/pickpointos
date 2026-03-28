-- Migration 012: Add document signing links for remote signing
-- Added: 2026-03-27
-- Reason: Allow employees to sign documents remotely via unique link

-- Add signing links table
CREATE TABLE IF NOT EXISTS document_signing_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Unique token for public link
    token VARCHAR(100) UNIQUE NOT NULL,
    
    -- Link metadata
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID REFERENCES employees(id),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_signing_links_token ON document_signing_links(token);
CREATE INDEX IF NOT EXISTS idx_signing_links_document ON document_signing_links(document_id);
CREATE INDEX IF NOT EXISTS idx_signing_links_employee ON document_signing_links(employee_id);
CREATE INDEX IF NOT EXISTS idx_signing_links_active ON document_signing_links(is_active, expires_at) WHERE is_active = TRUE;

-- UNIQUE constraint on document_id for ON CONFLICT to work
CREATE UNIQUE INDEX IF NOT EXISTS idx_signing_links_document_unique ON document_signing_links(document_id);

-- Comments
COMMENT ON TABLE document_signing_links IS 'Unique links for remote document signing via eGov QR';
COMMENT ON COLUMN document_signing_links.token IS 'Public token for signing link (e.g., /sign/abc123)';
COMMENT ON COLUMN document_signing_links.expires_at IS 'Link expiration time (default: 7 days)';
COMMENT ON COLUMN document_signing_links.used_at IS 'When document was successfully signed';
COMMENT ON COLUMN document_signing_links.access_count IS 'Number of times link was accessed';

-- Verification query
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'document_signing_links'
ORDER BY ordinal_position;
