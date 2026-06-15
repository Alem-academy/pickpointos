-- Migration 020: Add persistent document numbering counters
-- Reason: Move from per-employee transient numbering to per-employer/year
-- sequential numbers that are persisted in the database.

CREATE TABLE IF NOT EXISTS document_counters (
    employer_id UUID REFERENCES employers(id) NOT NULL,
    year INT NOT NULL,
    contract_seq INT NOT NULL DEFAULT 0,
    order_seq INT NOT NULL DEFAULT 0,
    PRIMARY KEY (employer_id, year)
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_documents_document_number ON documents(document_number);
