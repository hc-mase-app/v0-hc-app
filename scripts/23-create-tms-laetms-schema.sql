-- ============================================================
-- LAETMS (Leadership Activity Evidence & Target Monitoring System)
-- Database Schema for Target Monitoring System
-- ============================================================
-- Created: 2025-01-16
-- Purpose: Monitoring target leadership bulanan berbasis evidence
-- Database: NEON PostgreSQL (DATABASE_URL existing)
-- ============================================================

-- ============================================================
-- 1. MASTER DATA TABLES
-- ============================================================

-- Master Sites (11 Sites)
CREATE TABLE IF NOT EXISTS tms_sites (
  id SERIAL PRIMARY KEY,
  site_code VARCHAR(20) UNIQUE NOT NULL,
  site_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Departments (9 Departments)
CREATE TABLE IF NOT EXISTS tms_departments (
  id SERIAL PRIMARY KEY,
  dept_code VARCHAR(20) UNIQUE NOT NULL,
  dept_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Job Levels (10 Levels)
CREATE TABLE IF NOT EXISTS tms_job_levels (
  id SERIAL PRIMARY KEY,
  level_code VARCHAR(20) UNIQUE NOT NULL,
  level_name VARCHAR(100) NOT NULL,
  level_order INT NOT NULL, -- 1 = GM (highest), 10 = HELPER (lowest)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- ============================================================
-- 2. ORGANIZATIONAL HIERARCHY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_organizational_hierarchy (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id INT REFERENCES users(id) ON DELETE SET NULL, -- Atasan langsung
  direct_reports_count INT DEFAULT 0, -- Jumlah bawahan langsung (auto-calculated)
  effective_month DATE NOT NULL, -- Periode berlaku (format: YYYY-MM-01)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT REFERENCES users(id), -- Master Admin yang input
  
  -- Constraint: Satu user hanya punya 1 atasan per bulan
  UNIQUE(user_id, effective_month)
);

-- ============================================================
-- 3. EVIDENCE TABLE (File Storage via Google Drive)
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_leadership_evidence (
  id SERIAL PRIMARY KEY,
  
  -- Evidence metadata
  evidence_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated: EVD-YYYYMM-XXXX
  
  -- Relasi
  leader_id INT NOT NULL REFERENCES users(id), -- Siapa pemimpin yang melakukan activity
  subordinate_id INT NOT NULL REFERENCES users(id), -- Siapa bawahan yang menerima activity
  activity_type_id INT NOT NULL REFERENCES tms_activity_types(id),
  
  -- Form data
  activity_date DATE NOT NULL, -- Tanggal kegiatan
  activity_month DATE NOT NULL, -- Periode bulan (format: YYYY-MM-01)
  activity_description TEXT, -- Deskripsi singkat kegiatan
  location VARCHAR(255), -- Lokasi kegiatan
  
  -- Google Drive Integration
  gdrive_file_id VARCHAR(255) NOT NULL, -- File ID dari Google Drive
  gdrive_file_url TEXT NOT NULL, -- URL akses file di Google Drive
  gdrive_file_name VARCHAR(500), -- Nama file asli
  gdrive_file_type VARCHAR(50), -- pdf, jpg, png, dll
  gdrive_uploaded_at TIMESTAMP, -- Waktu upload ke Google Drive
  
  -- Status management
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, APPROVED, LOCKED
  approved_by INT REFERENCES users(id), -- Master Admin yang approve
  approved_at TIMESTAMP,
  locked_by INT REFERENCES users(id), -- Master Admin yang lock
  locked_at TIMESTAMP,
  
  -- Audit trail
  created_by INT NOT NULL REFERENCES users(id), -- Admin Dept Site yang upload
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_by INT REFERENCES users(id),
  deleted_at TIMESTAMP
);

-- ============================================================
-- 4. MONTHLY TARGET TRACKING (Auto-calculated)
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_monthly_targets (
  id SERIAL PRIMARY KEY,
  
  -- Periode & identitas
  period_month DATE NOT NULL, -- Format: YYYY-MM-01
  leader_id INT NOT NULL REFERENCES users(id),
  
  -- Agregasi level
  site VARCHAR(255),
  department VARCHAR(255),
  
  -- Target & Realisasi
  target_count INT DEFAULT 0, -- Jumlah bawahan langsung dari hierarchy
  realization_count INT DEFAULT 0, -- Jumlah bawahan dengan min 1 evidence
  percentage DECIMAL(5,2) DEFAULT 0.00, -- (realization / target) * 100
  
  -- Status
  is_finalized BOOLEAN DEFAULT FALSE, -- Lock status untuk periode
  finalized_at TIMESTAMP,
  finalized_by INT REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: Satu leader hanya 1 record per bulan
  UNIQUE(leader_id, period_month)
);

-- ============================================================
-- 5. AUDIT LOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_audit_logs (
  id SERIAL PRIMARY KEY,
  
  -- What happened
  action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, APPROVE, LOCK, etc
  table_name VARCHAR(100) NOT NULL,
  record_id INT,
  
  -- Who did it
  user_id INT REFERENCES users(id),
  user_nik VARCHAR(50),
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  
  -- Details
  old_data JSONB, -- Data sebelum perubahan
  new_data JSONB, -- Data setelah perubahan
  description TEXT,
  
  -- When
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Client info
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- ============================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================

-- Hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_tms_hierarchy_user_month ON tms_organizational_hierarchy(user_id, effective_month);
CREATE INDEX IF NOT EXISTS idx_tms_hierarchy_manager ON tms_organizational_hierarchy(manager_id);
CREATE INDEX IF NOT EXISTS idx_tms_hierarchy_active ON tms_organizational_hierarchy(is_active, effective_month);

-- Evidence indexes
CREATE INDEX IF NOT EXISTS idx_tms_evidence_leader ON tms_leadership_evidence(leader_id, activity_month);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_subordinate ON tms_leadership_evidence(subordinate_id, activity_month);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_status ON tms_leadership_evidence(status, activity_month);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_month ON tms_leadership_evidence(activity_month);
CREATE INDEX IF NOT EXISTS idx_tms_evidence_deleted ON tms_leadership_evidence(is_deleted);

-- Monthly targets indexes
CREATE INDEX IF NOT EXISTS idx_tms_targets_period ON tms_monthly_targets(period_month);
CREATE INDEX IF NOT EXISTS idx_tms_targets_leader ON tms_monthly_targets(leader_id, period_month);
CREATE INDEX IF NOT EXISTS idx_tms_targets_site ON tms_monthly_targets(site, period_month);
CREATE INDEX IF NOT EXISTS idx_tms_targets_dept ON tms_monthly_targets(department, period_month);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_tms_audit_user ON tms_audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tms_audit_table ON tms_audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_tms_audit_date ON tms_audit_logs(created_at);

-- ============================================================
-- 7. SEED MASTER DATA
-- ============================================================

-- Insert Master Sites (11 Sites)
INSERT INTO tms_sites (site_code, site_name) VALUES
('WBN', 'WBN'),
('HSM', 'HSM'),
('PSN', 'PSN'),
('ABN', 'ABN'),
('KE', 'KE'),
('IM', 'IM'),
('TCM_BUNYUT', 'TCM BUNYUT'),
('TCMM', 'TCMM'),
('BEKB', 'BEKB'),
('BSF', 'BSF'),
('HEAD_OFFICE', 'HEAD OFFICE')
ON CONFLICT (site_code) DO NOTHING;

-- Insert Master Departments (9 Departments)
INSERT INTO tms_departments (dept_code, dept_name) VALUES
('OPERATION', 'OPERATION'),
('PRODUKSI', 'PRODUKSI'),
('PLANT', 'PLANT'),
('SCM', 'SCM'),
('HCGA', 'HCGA'),
('HSE', 'HSE'),
('FINANCE', 'FINANCE'),
('ACC_TAX', 'ACC & TAX'),
('IT', 'IT')
ON CONFLICT (dept_code) DO NOTHING;

-- Insert Master Job Levels (10 Levels)
INSERT INTO tms_job_levels (level_code, level_name, level_order) VALUES
('GM', 'GM', 1),
('SM', 'SM', 2),
('DH', 'DH', 3),
('SPV', 'Supervisor', 4),
('AM', 'Asst. Manager', 5),
('STAFF', 'Staff', 6),
('OPERATOR', 'Operator', 7),
('FOREMAN', 'Foreman', 8),
('TECHNICIAN', 'Technician', 9),
('HELPER', 'Helper', 10)
ON CONFLICT (level_code) DO NOTHING;

-- Insert Master Activity Types (4 Types)
INSERT INTO tms_activity_types (activity_code, activity_name, description) VALUES
('COACHING', 'Coaching', 'Memberikan arahan dan bimbingan untuk meningkatkan kinerja'),
('COUNSELING', 'Counseling', 'Memberikan konseling dan dukungan untuk masalah personal/profesional'),
('DIRECTING', 'Directing', 'Memberikan instruksi dan arahan kerja spesifik'),
('MENTORING', 'Mentoring', 'Memberikan bimbingan jangka panjang untuk pengembangan karir')
ON CONFLICT (activity_code) DO NOTHING;

-- ============================================================
-- 8. COMMENTS
-- ============================================================

COMMENT ON TABLE tms_sites IS 'Master data sites untuk TMS';
COMMENT ON TABLE tms_departments IS 'Master data departments untuk TMS';
COMMENT ON TABLE tms_job_levels IS 'Master data job levels dengan urutan hierarki';
COMMENT ON TABLE tms_activity_types IS 'Master data tipe aktivitas kepemimpinan';
COMMENT ON TABLE tms_organizational_hierarchy IS 'Relasi atasan-bawahan langsung per bulan';
COMMENT ON TABLE tms_leadership_evidence IS 'Evidence form aktivitas kepemimpinan (file di Google Drive)';
COMMENT ON TABLE tms_monthly_targets IS 'Perhitungan target vs realisasi per bulan (auto-calculated)';
COMMENT ON TABLE tms_audit_logs IS 'Audit trail semua perubahan data TMS';

COMMENT ON COLUMN tms_organizational_hierarchy.direct_reports_count IS 'Jumlah bawahan langsung = TARGET bulanan';
COMMENT ON COLUMN tms_leadership_evidence.gdrive_file_id IS 'File ID dari Google Drive (bukan simpan file)';
COMMENT ON COLUMN tms_monthly_targets.realization_count IS 'Jumlah bawahan dengan minimal 1 evidence dalam bulan';
COMMENT ON COLUMN tms_monthly_targets.percentage IS 'Persentase pencapaian: (realization / target) * 100';

-- ============================================================
-- END OF SCHEMA
-- ============================================================
