-- ============================================================
-- Create Archive Logs Table
-- ============================================================
-- Purpose: Track all archive and delete operations for audit trail
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_archive_logs (
  id SERIAL PRIMARY KEY,
  archive_number VARCHAR(50) UNIQUE NOT NULL,
  archived_by INT NOT NULL REFERENCES users(id),
  archived_by_nik VARCHAR(50),
  archived_by_name VARCHAR(255),
  action_type VARCHAR(20) NOT NULL, -- 'DOWNLOAD' or 'DELETE'
  filter_site VARCHAR(255),
  filter_department VARCHAR(255),
  filter_date_from DATE,
  filter_date_to DATE,
  total_files INT DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  evidence_ids TEXT -- JSON array of evidence IDs that were archived
);

-- Add archived_status to evidence table
ALTER TABLE tms_leadership_evidence 
ADD COLUMN IF NOT EXISTS archived_status VARCHAR(20) DEFAULT 'ACTIVE';

ALTER TABLE tms_leadership_evidence 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

ALTER TABLE tms_leadership_evidence 
ADD COLUMN IF NOT EXISTS archived_by INT REFERENCES users(id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tms_archive_logs_date ON tms_archive_logs(archived_at);
CREATE INDEX IF NOT EXISTS idx_tms_archive_logs_user ON tms_archive_logs(archived_by);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_archived ON tms_leadership_evidence(archived_status, activity_month);

COMMENT ON TABLE tms_archive_logs IS 'Log semua operasi archive dan delete evidence untuk audit trail';
COMMENT ON COLUMN tms_leadership_evidence.archived_status IS 'Status: ACTIVE, ARCHIVED, DELETED';
