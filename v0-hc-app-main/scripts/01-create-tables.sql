-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  nik VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  site VARCHAR(100) NOT NULL,
  jabatan VARCHAR(100) NOT NULL,
  departemen VARCHAR(100) NOT NULL,
  poh VARCHAR(100),
  status_karyawan VARCHAR(50) NOT NULL,
  no_ktp VARCHAR(50),
  no_telp VARCHAR(20),
  tanggal_bergabung VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_nik VARCHAR(50) NOT NULL,
  site VARCHAR(100) NOT NULL,
  jabatan VARCHAR(100) NOT NULL,
  departemen VARCHAR(100) NOT NULL,
  poh VARCHAR(100),
  status_karyawan VARCHAR(50) NOT NULL,
  no_ktp VARCHAR(50),
  no_telp VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  jenis_pengajuan_cuti VARCHAR(100) NOT NULL,
  tanggal_pengajuan VARCHAR(50) NOT NULL,
  tanggal_mulai VARCHAR(50) NOT NULL,
  tanggal_selesai VARCHAR(50) NOT NULL,
  jumlah_hari INTEGER NOT NULL,
  berangkat_dari VARCHAR(255),
  tujuan VARCHAR(255),
  sisa_cuti_tahunan DECIMAL(5,2),
  tanggal_cuti_periodik_berikutnya VARCHAR(50),
  catatan TEXT,
  alasan TEXT,
  status VARCHAR(50) NOT NULL,
  ticket_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create approval_history table
CREATE TABLE IF NOT EXISTS approval_history (
  id VARCHAR(255) PRIMARY KEY,
  request_id VARCHAR(255) NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  approver_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approver_name VARCHAR(255) NOT NULL,
  approver_role VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employee_assessments table
CREATE TABLE IF NOT EXISTS employee_assessments (
  id VARCHAR(255) PRIMARY KEY,
  employee_nik VARCHAR(50) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_jabatan VARCHAR(100) NOT NULL,
  employee_departemen VARCHAR(100) NOT NULL,
  employee_site VARCHAR(100) NOT NULL,
  employee_start_date VARCHAR(50) NOT NULL,
  employee_status VARCHAR(50) NOT NULL,
  assessment_period VARCHAR(100) NOT NULL,
  kepribadian JSONB,
  prestasi JSONB,
  kehadiran JSONB,
  indisipliner JSONB,
  strengths TEXT,
  weaknesses TEXT,
  recommendations JSONB,
  validation JSONB,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_site ON users(site);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_site ON leave_requests(site);
CREATE INDEX IF NOT EXISTS idx_approval_history_request_id ON approval_history(request_id);
CREATE INDEX IF NOT EXISTS idx_employee_assessments_employee_nik ON employee_assessments(employee_nik);
