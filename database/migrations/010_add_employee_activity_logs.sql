-- Migration 010: Add employee activity logs
-- Added: 2026-03-26
-- Reason: Track all employee actions (documents, transfers, status changes)

CREATE TABLE IF NOT EXISTS employee_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- What happened
    action_type VARCHAR(50) NOT NULL,  -- 'document_generated', 'transfer', 'status_changed'
    action_category VARCHAR(50),        -- 'document', 'transfer', 'status'
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Who did it
    performed_by_id UUID REFERENCES employees(id),
    performed_by_name VARCHAR(255),
    
    -- When
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_employee ON employee_activity_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON employee_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_date ON employee_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_category ON employee_activity_logs(action_category);

-- Comments
COMMENT ON TABLE employee_activity_logs IS 'Activity log for employee actions (documents, transfers, status changes)';
COMMENT ON COLUMN employee_activity_logs.action_type IS 'Type of action: document_generated, document_signed, document_deleted, transfer, status_changed, hired';
COMMENT ON COLUMN employee_activity_logs.action_category IS 'Category: document, transfer, status';
COMMENT ON COLUMN employee_activity_logs.metadata IS 'Additional data: {document_type, old_status, new_status, from_pvz, to_pvz}';
