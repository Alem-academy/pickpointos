-- Колонки Sigex (идемпотентно). Индекс на signature_cms НЕ создаём — длинная CMS ломает btree.
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS sigex_document_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS signature_cms TEXT,
ADD COLUMN IF NOT EXISTS signature_xml TEXT,
ADD COLUMN IF NOT EXISTS sigex_operation_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_documents_sigex_document_id ON documents(sigex_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_sigex_operation_id ON documents(sigex_operation_id);
