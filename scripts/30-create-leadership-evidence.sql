-- Create activity types master table
CREATE TABLE IF NOT EXISTS tms_activity_types (
  id SERIAL PRIMARY KEY,
  activity_code VARCHAR(50) UNIQUE NOT NULL,
  activity_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default activity types: Coaching, Counseling, Mentoring, Directing
INSERT INTO tms_activity_types (activity_code, activity_name, description) VALUES
('COACHING', 'Coaching', 'Memberikan bimbingan dan arahan untuk meningkatkan kinerja karyawan'),
('COUNSELING', 'Counseling', 'Memberikan konsultasi dan dukungan untuk menyelesaikan masalah personal atau profesional'),
('MENTORING', 'Mentoring', 'Membimbing pengembangan karir dan kompetensi jangka panjang karyawan'),
('DIRECTING', 'Directing', 'Memberikan instruksi langsung dan pengawasan terhadap pekerjaan karyawan')
ON CONFLICT (activity_code) DO NOTHING;

-- Create leadership evidence table
CREATE TABLE IF NOT EXISTS tms_leadership_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_number VARCHAR(50) UNIQUE NOT NULL,
  leader_id UUID NOT NULL,
  subordinate_id UUID NOT NULL,
  activity_type_id INTEGER NOT NULL REFERENCES tms_activity_types(id),
  activity_date DATE NOT NULL,
  activity_month DATE NOT NULL,
  activity_description TEXT,
  location VARCHAR(255),
  gdrive_file_id VARCHAR(255),
  gdrive_file_url TEXT,
  gdrive_file_name VARCHAR(255),
  gdrive_file_type VARCHAR(100),
  gdrive_uploaded_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'DRAFT',
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_tms_evidence_leader ON tms_leadership_evidence(leader_id);
CREATE INDEX idx_tms_evidence_subordinate ON tms_leadership_evidence(subordinate_id);
CREATE INDEX idx_tms_evidence_activity_month ON tms_leadership_evidence(activity_month);
CREATE INDEX idx_tms_evidence_activity_type ON tms_leadership_evidence(activity_type_id);

-- Add comments
COMMENT ON TABLE tms_leadership_evidence IS 'Stores evidence of leadership activities uploaded by managers for their subordinates';
COMMENT ON COLUMN tms_leadership_evidence.activity_month IS 'First day of the month for grouping (e.g. 2025-01-01)';
