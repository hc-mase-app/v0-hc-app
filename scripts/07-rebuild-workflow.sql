-- Rebuild Multi-Approval Workflow Database
-- This script cleans up and prepares the database for the rebuilt system

-- Drop existing tables (only if they exist, for fresh start)
-- Uncomment the lines below if you want a completely fresh database
-- DROP TABLE IF EXISTS approval_history CASCADE;
-- DROP TABLE IF EXISTS leave_requests CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============ USERS TABLE ============
-- Stores all users with their roles and organizational info

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  nik VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  site VARCHAR(100) NOT NULL,
  jabatan VARCHAR(100) NOT NULL,
  departemen VARCHAR(100) NOT NULL,
  poh VARCHAR(100),
  status_karyawan VARCHAR(50) NOT NULL DEFAULT 'Tetap',
  no_ktp VARCHAR(50),
  no_telp VARCHAR(20),
  tanggal_lahir DATE,
  jenis_kelamin VARCHAR(20),
  tanggal_bergabung DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_role CHECK (role IN ('user', 'hr_site', 'dic', 'pjo_site', 'hr_ho', 'hr_ticketing', 'super_admin')),
  CONSTRAINT valid_gender CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  CONSTRAINT valid_status CHECK (status_karyawan IN ('Tetap', 'Kontrak'))
);

-- ============ LEAVE_REQUESTS TABLE ============
-- Stores all leave requests with full journey through approval workflow

CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(255) PRIMARY KEY,
  nik VARCHAR(50) NOT NULL REFERENCES users(nik) ON DELETE RESTRICT,
  
  -- Leave Details
  jenis_cuti VARCHAR(100) NOT NULL,
  tanggal_pengajuan DATE NOT NULL,
  periode_awal DATE NOT NULL,
  periode_akhir DATE NOT NULL,
  jumlah_hari INTEGER NOT NULL,
  tanggal_keberangkatan DATE,
  berangkat_dari VARCHAR(255),
  tujuan VARCHAR(255),
  catatan TEXT,
  
  -- Leave-related dates
  cuti_periodik_berikutnya DATE,
  
  -- Workflow Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending_dic',
  
  -- Ticketing
  booking_code VARCHAR(100),
  
  -- Metadata
  submitted_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN (
    'pending_dic', 'pending_pjo', 'pending_hr_ho', 
    'di_proses', 'tiket_issued',
    'ditolak_dic', 'ditolak_pjo', 'ditolak_hr_ho'
  ))
);

-- ============ APPROVAL_HISTORY TABLE ============
-- Tracks every approval/rejection action with complete audit trail

CREATE TABLE IF NOT EXISTS approval_history (
  id VARCHAR(255) PRIMARY KEY,
  leave_request_id VARCHAR(255) NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  approver_nik VARCHAR(50) NOT NULL REFERENCES users(nik) ON DELETE RESTRICT,
  approver_name VARCHAR(255) NOT NULL,
  approver_role VARCHAR(50) NOT NULL,
  
  -- Action Details
  action VARCHAR(50) NOT NULL,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_action CHECK (action IN ('approved', 'rejected'))
);

-- ============ INDEXES FOR PERFORMANCE ============

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nik ON users(nik);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_site ON users(site);
CREATE INDEX IF NOT EXISTS idx_users_site_dept ON users(site, departemen);

CREATE INDEX IF NOT EXISTS idx_leave_requests_nik ON leave_requests(nik);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON leave_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status_created ON leave_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_approval_history_request_id ON approval_history(leave_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_approver ON approval_history(approver_nik);
CREATE INDEX IF NOT EXISTS idx_approval_history_created ON approval_history(created_at DESC);

-- ============ VERIFICATION QUERIES ============
-- Run these to verify the schema is correct

-- Show all tables
-- \dt

-- Show leave_requests columns
-- \d leave_requests

-- Show indexes
-- \di

-- Check for sample data
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM leave_requests WHERE status = 'pending_dic';
-- SELECT COUNT(*) FROM approval_history;
