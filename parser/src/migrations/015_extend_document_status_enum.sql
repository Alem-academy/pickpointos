-- Расширение ENUM document_status недостающими значениями
-- Требуется для поддержки двустороннего подписания и новых статусов

ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'sent_to_employee';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'fully_signed';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'employer_signed';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'archived';
