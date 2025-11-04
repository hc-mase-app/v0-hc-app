-- Migration script untuk menambahkan assessment tables dan kolom
-- Jalankan script ini jika database sudah ada

-- 1. Buat table employee_assessments jika belum ada
CREATE TABLE IF NOT EXISTS employee_assessments (
  id SERIAL PRIMARY KEY,
  employee_nik VARCHAR(20) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_jabatan VARCHAR(100),
  employee_departemen VARCHAR(100),
  employee_site VARCHAR(100),
  employee_status VARCHAR(50),
  employee_tanggal_masuk DATE,
  
  -- Section A: Kepribadian (4 items)
  kepribadian_1_score INTEGER,
  kepribadian_1_nilai DECIMAL(10,3),
  kepribadian_2_score INTEGER,
  kepribadian_2_nilai DECIMAL(10,3),
  kepribadian_3_score INTEGER,
  kepribadian_3_nilai DECIMAL(10,3),
  kepribadian_4_score INTEGER,
  kepribadian_4_nilai DECIMAL(10,3),
  kepribadian_total DECIMAL(10,3),
  
  -- Section B: Prestasi & Hasil Kerja (10 items)
  prestasi_1_score INTEGER,
  prestasi_1_nilai DECIMAL(10,3),
  prestasi_2_score INTEGER,
  prestasi_2_nilai DECIMAL(10,3),
  prestasi_3_score INTEGER,
  prestasi_3_nilai DECIMAL(10,3),
  prestasi_4_score INTEGER,
  prestasi_4_nilai DECIMAL(10,3),
  prestasi_5_score INTEGER,
  prestasi_5_nilai DECIMAL(10,3),
  prestasi_6_score INTEGER,
  prestasi_6_nilai DECIMAL(10,3),
  prestasi_7_score INTEGER,
  prestasi_7_nilai DECIMAL(10,3),
  prestasi_8_score INTEGER,
  prestasi_8_nilai DECIMAL(10,3),
  prestasi_9_score INTEGER,
  prestasi_9_nilai DECIMAL(10,3),
  prestasi_10_score INTEGER,
  prestasi_10_nilai DECIMAL(10,3),
  prestasi_total DECIMAL(10,3),
  
  -- Section C: Kehadiran (ATR)
  kehadiran_sakit INTEGER DEFAULT 0,
  kehadiran_izin INTEGER DEFAULT 0,
  kehadiran_alpa INTEGER DEFAULT 0,
  kehadiran_nilai DECIMAL(10,3),
  
  -- Section D: Indisipliner (SP)
  indisipliner_sp1 INTEGER DEFAULT 0,
  indisipliner_sp2 INTEGER DEFAULT 0,
  indisipliner_sp3 INTEGER DEFAULT 0,
  indisipliner_nilai DECIMAL(10,3),
  
  -- Scoring
  subtotal DECIMAL(10,3),
  total_score DECIMAL(10,3),
  grade VARCHAR(20),
  penalties JSONB,
  
  -- Kelebihan & Kekurangan
  kelebihan TEXT,
  kekurangan TEXT,
  
  -- Rekomendasi
  rekomendasi_perpanjang_kontrak BOOLEAN DEFAULT FALSE,
  rekomendasi_perpanjang_bulan INTEGER,
  rekomendasi_pengangkatan_tetap BOOLEAN DEFAULT FALSE,
  rekomendasi_promosi_jabatan BOOLEAN DEFAULT FALSE,
  rekomendasi_perubahan_gaji BOOLEAN DEFAULT FALSE,
  rekomendasi_end_kontrak BOOLEAN DEFAULT FALSE,
  
  -- Workflow fields
  status VARCHAR(50) DEFAULT 'pending_pjo',
  created_by_nik VARCHAR(20) NOT NULL,
  created_by_name VARCHAR(255),
  created_by_role VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Buat table assessment_approvals jika belum ada
CREATE TABLE IF NOT EXISTS assessment_approvals (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL,
  approver_nik VARCHAR(20) NOT NULL,
  approver_name VARCHAR(255) NOT NULL,
  approver_role VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Buat indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_employee_assessments_status ON employee_assessments(status);
CREATE INDEX IF NOT EXISTS idx_employee_assessments_employee_nik ON employee_assessments(employee_nik);
CREATE INDEX IF NOT EXISTS idx_employee_assessments_created_by ON employee_assessments(created_by_nik);
CREATE INDEX IF NOT EXISTS idx_employee_assessments_created_at ON employee_assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_assessment_approvals_assessment_id ON assessment_approvals(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_approvals_approver ON assessment_approvals(approver_nik);
