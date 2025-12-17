-- Fresh TMS schema

-- Create activity types table
CREATE TABLE IF NOT EXISTS tms_activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(100) NOT NULL UNIQUE,
  target_bulanan INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create leadership activities table
CREATE TABLE IF NOT EXISTS tms_leadership_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID NOT NULL REFERENCES karyawan(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES tms_activity_types(id) ON DELETE CASCADE,
  subordinate_id UUID NOT NULL REFERENCES karyawan(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  bulan INTEGER NOT NULL,
  tahun INTEGER NOT NULL,
  evidence_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create evidence table
CREATE TABLE IF NOT EXISTS tms_activity_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES tms_leadership_activities(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tms_activities_leader ON tms_leadership_activities(leader_id);
CREATE INDEX IF NOT EXISTS idx_tms_activities_subordinate ON tms_leadership_activities(subordinate_id);
CREATE INDEX IF NOT EXISTS idx_tms_activities_date ON tms_leadership_activities(tanggal);
CREATE INDEX IF NOT EXISTS idx_tms_activities_month_year ON tms_leadership_activities(bulan, tahun);

-- Insert default activity types
INSERT INTO tms_activity_types (nama, target_bulanan) VALUES
  ('Training', 2),
  ('Coaching', 4),
  ('Mentoring', 3),
  ('Performance Review', 1),
  ('Team Meeting', 4)
ON CONFLICT (nama) DO NOTHING;

COMMENT ON SCHEMA public IS 'Fresh TMS schema created';
