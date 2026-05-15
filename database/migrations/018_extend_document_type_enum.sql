-- Extend document_type enum to support template-based document generation
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'employee_application';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'employer_order';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'mutual_agreement';
