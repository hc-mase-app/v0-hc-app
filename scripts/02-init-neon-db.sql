-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nik VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  site VARCHAR(100),
  jabatan VARCHAR(100),
  departemen VARCHAR(100),
  poh VARCHAR(100),
  status_karyawan VARCHAR(50),
  no_ktp VARCHAR(20),
  no_telp VARCHAR(20),
  tanggal_bergabung DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_nik VARCHAR(20) NOT NULL,
  site VARCHAR(100),
  jabatan VARCHAR(100),
  departemen VARCHAR(100),
  poh VARCHAR(100),
  status_karyawan VARCHAR(50),
  no_ktp VARCHAR(20),
  no_telp VARCHAR(20),
  email VARCHAR(255),
  jenis_pengajuan_cuti VARCHAR(100),
  tanggal_pengajuan DATE NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  jumlah_hari INTEGER,
  berangkat_dari VARCHAR(255),
  tujuan VARCHAR(255),
  sisa_cuti_tahunan DECIMAL(5,2),
  tanggal_cuti_periodik_berikutnya DATE,
  catatan TEXT,
  alasan TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_atasan',
  ticket_number VARCHAR(50),
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create approval_history table
CREATE TABLE IF NOT EXISTS approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  approver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approver_name VARCHAR(255) NOT NULL,
  approver_role VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employee_assessments table
CREATE TABLE IF NOT EXISTS employee_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_nik VARCHAR(20) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_jabatan VARCHAR(100),
  employee_departemen VARCHAR(100),
  employee_site VARCHAR(100),
  employee_start_date DATE,
  employee_status VARCHAR(50),
  assessment_period VARCHAR(50),
  kepribadian JSONB,
  prestasi JSONB,
  kehadiran JSONB,
  indisipliner JSONB,
  strengths TEXT,
  weaknesses TEXT,
  recommendations JSONB,
  validation JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nik ON users(nik);
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_submitted_by ON leave_requests(submitted_by);
CREATE INDEX idx_approval_history_request_id ON approval_history(request_id);
CREATE INDEX idx_employee_assessments_nik ON employee_assessments(employee_nik);
