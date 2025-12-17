-- ============================================================
-- Create TMS Tables Using Real Data from Karyawan
-- ============================================================
-- Purpose: Create TMS tables and populate with actual data
-- from existing 1580 karyawan records
-- ============================================================

-- ============================================================
-- 1. MASTER DATA TABLES
-- ============================================================

-- Master Activity Types (4 Types)
CREATE TABLE IF NOT EXISTS tms_activity_types (
  id SERIAL PRIMARY KEY,
  activity_code VARCHAR(20) UNIQUE NOT NULL,
  activity_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Sites
CREATE TABLE IF NOT EXISTS tms_sites (
  id SERIAL PRIMARY KEY,
  site_code VARCHAR(20) UNIQUE NOT NULL,
  site_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Departments
CREATE TABLE IF NOT EXISTS tms_departments (
  id SERIAL PRIMARY KEY,
  dept_code VARCHAR(20) UNIQUE NOT NULL,
  dept_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Job Levels
CREATE TABLE IF NOT EXISTS tms_job_levels (
  id SERIAL PRIMARY KEY,
  level_code VARCHAR(50) UNIQUE NOT NULL,
  level_name VARCHAR(100) NOT NULL,
  level_order INT, -- Optional: untuk ordering
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Jabatan (Positions)
CREATE TABLE IF NOT EXISTS tms_jabatan (
  id SERIAL PRIMARY KEY,
  jabatan_code VARCHAR(50) UNIQUE NOT NULL,
  jabatan_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. ORGANIZATIONAL HIERARCHY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_organizational_hierarchy (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id INT REFERENCES users(id) ON DELETE SET NULL,
  direct_reports_count INT DEFAULT 0,
  effective_month DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT REFERENCES users(id),
  UNIQUE(user_id, effective_month)
);

-- ============================================================
-- 3. EVIDENCE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_leadership_evidence (
  id SERIAL PRIMARY KEY,
  evidence_number VARCHAR(50) UNIQUE NOT NULL,
  leader_id INT NOT NULL REFERENCES users(id),
  subordinate_id INT NOT NULL REFERENCES users(id),
  activity_type_id INT NOT NULL REFERENCES tms_activity_types(id),
  activity_date DATE NOT NULL,
  activity_month DATE NOT NULL,
  activity_description TEXT,
  location VARCHAR(255),
  gdrive_file_id VARCHAR(255) NOT NULL,
  gdrive_file_url TEXT NOT NULL,
  gdrive_file_name VARCHAR(500),
  gdrive_file_type VARCHAR(50),
  gdrive_uploaded_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'DRAFT',
  approved_by INT REFERENCES users(id),
  approved_at TIMESTAMP,
  locked_by INT REFERENCES users(id),
  locked_at TIMESTAMP,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_by INT REFERENCES users(id),
  deleted_at TIMESTAMP
);

-- ============================================================
-- 4. MONTHLY TARGET TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_monthly_targets (
  id SERIAL PRIMARY KEY,
  period_month DATE NOT NULL,
  leader_id INT NOT NULL REFERENCES users(id),
  site VARCHAR(255),
  department VARCHAR(255),
  target_count INT DEFAULT 0,
  realization_count INT DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  is_finalized BOOLEAN DEFAULT FALSE,
  finalized_at TIMESTAMP,
  finalized_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(leader_id, period_month)
);

-- ============================================================
-- 5. AUDIT LOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_audit_logs (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INT,
  user_id INT REFERENCES users(id),
  user_nik VARCHAR(50),
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  old_data JSONB,
  new_data JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- ============================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tms_hierarchy_user_month ON tms_organizational_hierarchy(user_id, effective_month);
CREATE INDEX IF NOT EXISTS idx_tms_hierarchy_manager ON tms_organizational_hierarchy(manager_id);
CREATE INDEX IF NOT EXISTS idx_tms_hierarchy_active ON tms_organizational_hierarchy(is_active, effective_month);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_leader ON tms_leadership_evidence(leader_id, activity_month);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_subordinate ON tms_leadership_evidence(subordinate_id, activity_month);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_status ON tms_leadership_evidence(status, activity_month);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_month ON tms_leadership_evidence(activity_month);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_deleted ON tms_leadership_evidence(is_deleted);
CREATE INDEX IF NOT EXISTS idx_tms_targets_period ON tms_monthly_targets(period_month);
CREATE INDEX IF NOT EXISTS idx_tms_targets_leader ON tms_monthly_targets(leader_id, period_month);
CREATE INDEX IF NOT EXISTS idx_tms_targets_site ON tms_monthly_targets(site, period_month);
CREATE INDEX IF NOT EXISTS idx_tms_targets_dept ON tms_monthly_targets(department, period_month);
CREATE INDEX IF NOT EXISTS idx_tms_audit_user ON tms_audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tms_audit_table ON tms_audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_tms_audit_date ON tms_audit_logs(created_at);

-- ============================================================
-- 7. SEED MASTER DATA FROM EXISTING KARYAWAN TABLE
-- ============================================================

-- Insert Activity Types (Fixed 4 types)
INSERT INTO tms_activity_types (activity_code, activity_name, description) VALUES
('COACHING', 'Coaching', 'Memberikan arahan dan bimbingan untuk meningkatkan kinerja'),
('COUNSELING', 'Counseling', 'Memberikan konseling dan dukungan untuk masalah personal/profesional'),
('DIRECTING', 'Directing', 'Memberikan instruksi dan arahan kerja spesifik'),
('MENTORING', 'Mentoring', 'Memberikan bimbingan jangka panjang untuk pengembangan karir')
ON CONFLICT (activity_code) DO NOTHING;

-- Populate Sites from actual karyawan data
INSERT INTO tms_sites (site_code, site_name)
SELECT DISTINCT 
  site as site_code,
  site as site_name
FROM karyawan
WHERE site IS NOT NULL AND site != ''
ORDER BY site
ON CONFLICT (site_code) DO NOTHING;

-- Populate Departments from actual karyawan data
INSERT INTO tms_departments (dept_code, dept_name)
SELECT DISTINCT 
  departemen as dept_code,
  departemen as dept_name
FROM karyawan
WHERE departemen IS NOT NULL AND departemen != ''
ORDER BY departemen
ON CONFLICT (dept_code) DO NOTHING;

-- Populate Job Levels from actual karyawan data
-- Using actual level values: "Mekanik", "Operator", etc.
INSERT INTO tms_job_levels (level_code, level_name, level_order)
SELECT DISTINCT 
  level as level_code,
  level as level_name,
  CASE level
    WHEN 'General Manager' THEN 1
    WHEN 'Manager' THEN 2
    WHEN 'PJO' THEN 3
    WHEN 'Deputy PJO' THEN 4
    WHEN 'Head' THEN 5
    WHEN 'Supervisor' THEN 6
    WHEN 'Group Leader' THEN 7
    WHEN 'Operator' THEN 8
    WHEN 'Mekanik' THEN 9
    WHEN 'Staff' THEN 10
    WHEN 'Foreman' THEN 11
    WHEN 'Helper' THEN 12
    ELSE 99
  END as level_order
FROM karyawan
WHERE level IS NOT NULL AND level != ''
ORDER BY level
ON CONFLICT (level_code) DO NOTHING;

-- Populate Jabatan from actual karyawan data
INSERT INTO tms_jabatan (jabatan_code, jabatan_name)
SELECT DISTINCT 
  jabatan as jabatan_code,
  jabatan as jabatan_name
FROM karyawan
WHERE jabatan IS NOT NULL AND jabatan != ''
ORDER BY jabatan
ON CONFLICT (jabatan_code) DO NOTHING;

-- ============================================================
-- 8. COMMENTS
-- ============================================================

COMMENT ON TABLE tms_sites IS 'Master data sites - populated from karyawan table';
COMMENT ON TABLE tms_departments IS 'Master data departments - populated from karyawan table';
COMMENT ON TABLE tms_job_levels IS 'Master data job levels - populated from karyawan table';
COMMENT ON TABLE tms_jabatan IS 'Master data jabatan/positions - populated from karyawan table';
COMMENT ON TABLE tms_activity_types IS 'Master data tipe aktivitas kepemimpinan (fixed 4 types)';
COMMENT ON TABLE tms_organizational_hierarchy IS 'Relasi atasan-bawahan langsung per bulan';
COMMENT ON TABLE tms_leadership_evidence IS 'Evidence form aktivitas kepemimpinan (file di Google Drive)';
COMMENT ON TABLE tms_monthly_targets IS 'Perhitungan target vs realisasi per bulan (auto-calculated)';
COMMENT ON TABLE tms_audit_logs IS 'Audit trail semua perubahan data TMS';

-- ============================================================
-- END OF SCRIPT
-- ============================================================
