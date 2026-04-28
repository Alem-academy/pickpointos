-- Track document signing lifecycle: sent → completed/canceled

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS signing_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signing_method VARCHAR(50), -- 'egov_qr', 'ncalayer', 'public_link'
ADD COLUMN IF NOT EXISTS signing_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signing_canceled_at TIMESTAMP WITH TIME ZONE;
