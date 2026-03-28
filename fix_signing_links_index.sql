-- Quick fix for signing links unique constraint
-- Run this on production database

-- Add unique index on document_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_signing_links_document_unique 
ON document_signing_links(document_id);

-- Verify
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'document_signing_links' 
  AND indexname LIKE '%document%';
