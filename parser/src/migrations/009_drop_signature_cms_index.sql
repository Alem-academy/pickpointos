-- Индекс btree на TEXT с длинной base64-CMS ломает UPDATE (row size exceeds btree maximum).
DROP INDEX IF EXISTS idx_documents_signature_cms;
