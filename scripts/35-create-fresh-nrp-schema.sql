-- Fresh NRP schema with correct structure from the start
-- Level is VARCHAR(50) from the beginning, no conversion needed

-- Create entitas table
CREATE TABLE IF NOT EXISTS entitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(10) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create site table
CREATE TABLE IF NOT EXISTS site (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(10) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create departemen table
CREATE TABLE IF NOT EXISTS departemen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create karyawan table with level as VARCHAR from the start
CREATE TABLE IF NOT EXISTS karyawan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nrp VARCHAR(20) UNIQUE NOT NULL,
  nama_karyawan VARCHAR(100) NOT NULL,
  jabatan VARCHAR(50) NOT NULL,
  level VARCHAR(50), -- Text-based level, no default value
  departemen VARCHAR(50) NOT NULL,
  site VARCHAR(50) NOT NULL,
  tanggal_masuk_kerja DATE NOT NULL,
  entitas VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  manager_id UUID REFERENCES karyawan(id) ON DELETE SET NULL,
  direct_reports_count INTEGER DEFAULT 0,
  CONSTRAINT valid_level CHECK (
    level IS NULL OR
    level IN (
      'General Manager',
      'Manager', 
      'PJO',
      'Deputy PJO',
      'Head',
      'Supervisor',
      'Group Leader',
      'Admin',
      'Operator',
      'Driver',
      'Mekanik',
      'Helper'
    )
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_karyawan_nrp ON karyawan(nrp);
CREATE INDEX IF NOT EXISTS idx_karyawan_departemen ON karyawan(departemen);
CREATE INDEX IF NOT EXISTS idx_karyawan_site ON karyawan(site);
CREATE INDEX IF NOT EXISTS idx_karyawan_manager ON karyawan(manager_id);
CREATE INDEX IF NOT EXISTS idx_karyawan_level ON karyawan(level);
CREATE INDEX IF NOT EXISTS idx_karyawan_jabatan ON karyawan(jabatan);

-- Insert default entitas
INSERT INTO entitas (kode, nama) VALUES
  ('SSS', 'PT Sarana Sukses Sejahtera'),
  ('GSM', 'PT Gemilang Sejahtera Makmur')
ON CONFLICT (kode) DO NOTHING;

-- Insert default sites
INSERT INTO site (kode, nama) VALUES
  ('hcga', 'HCGA'),
  ('hsm', 'HSM'),
  ('gsm', 'GSM'),
  ('mhm', 'MHM'),
  ('wbn', 'WBN'),
  ('bsf', 'BSF'),
  ('tcmm', 'TCMM'),
  ('abn', 'ABN'),
  ('im', 'IM')
ON CONFLICT (kode) DO NOTHING;

-- Insert default departemen
INSERT INTO departemen (kode, nama) VALUES
  ('HCGA', 'HCGA'),
  ('PLANT', 'PLANT'),
  ('ENGINEERING', 'ENGINEERING'),
  ('OPERATION', 'OPERATION'),
  ('MAINTENANCE', 'MAINTENANCE')
ON CONFLICT (kode) DO NOTHING;

COMMENT ON TABLE karyawan IS 'Employee master data with text-based job levels';
COMMENT ON COLUMN karyawan.level IS 'Job level using standardized text values (General Manager, Manager, etc.)';
