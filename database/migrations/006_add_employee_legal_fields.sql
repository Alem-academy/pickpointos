-- Добавление паспортных данных и адреса прописки
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS id_card_issued_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS id_card_issue_date DATE,
ADD COLUMN IF NOT EXISTS registered_address TEXT;
