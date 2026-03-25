-- Migration: Add document_templates table for dynamic template management
-- Created: 2026-03-25

-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    language VARCHAR(2) DEFAULT 'ru',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by_id UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type, version, language)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_type ON document_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_default ON document_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_templates_language ON document_templates(language);

-- Add comment
COMMENT ON TABLE document_templates IS 'Dynamic document templates with versioning and localization';
COMMENT ON COLUMN document_templates.type IS 'Document type: contract, order_hiring, vacation_application, vacation_order, termination_order, employment_certificate';
COMMENT ON COLUMN document_templates.version IS 'Semantic version: 1.0, 1.1, 2.0';
COMMENT ON COLUMN document_templates.variables IS 'JSON array of variable names: ["full_name", "iin", "employer_name"]';
COMMENT ON COLUMN document_templates.language IS 'ISO language code: ru, kz';
