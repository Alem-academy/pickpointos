-- Подпись работодателя (директора/ИП) для двусторонних документов.
-- Требуется по ст. 33 ТК РК: трудовой договор подписывается обеими сторонами.

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS signature_cms_employer TEXT,
ADD COLUMN IF NOT EXISTS employer_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS employer_cert_info JSONB,
ADD COLUMN IF NOT EXISTS requires_employer_signature BOOLEAN DEFAULT FALSE;

-- Индекс для быстрого поиска документов, ожидающих подписи работодателя
CREATE INDEX IF NOT EXISTS idx_documents_requires_employer ON documents(requires_employer_signature)
    WHERE requires_employer_signature = TRUE AND employer_signed_at IS NULL;

-- Индекс для поиска документов по статусу подписания
CREATE INDEX IF NOT EXISTS idx_documents_sign_status ON documents(status, employer_signed_at);
