-- Фаза 3: Лист подписей и финальный PDF
-- Генерируется после того как обе стороны подписали документ

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS signature_sheet_url TEXT,
ADD COLUMN IF NOT EXISTS signature_sheet_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS final_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS final_pdf_generated_at TIMESTAMP WITH TIME ZONE;

-- Индекс для быстрого поиска документов без листа подписей
CREATE INDEX IF NOT EXISTS idx_documents_needs_signature_sheet
    ON documents(status, signature_sheet_url)
    WHERE status = 'fully_signed' AND signature_sheet_url IS NULL;
