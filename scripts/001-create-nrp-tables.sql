-- Create karyawan table for NRP Generator
CREATE TABLE IF NOT EXISTS karyawan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nrp VARCHAR(20) UNIQUE NOT NULL,
  nama_karyawan VARCHAR(255) NOT NULL,
  jabatan VARCHAR(100) NOT NULL,
  departemen VARCHAR(100) NOT NULL,
  tanggal_masuk_kerja DATE NOT NULL,
  site VARCHAR(100) NOT NULL,
  entitas VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create nrp_counter table for tracking sequential NRP numbers
CREATE TABLE IF NOT EXISTS nrp_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitas_code VARCHAR(10) NOT NULL,
  tahun VARCHAR(4) NOT NULL,
  last_nomor_urut INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entitas_code, tahun)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_karyawan_nrp ON karyawan(nrp);
CREATE INDEX IF NOT EXISTS idx_karyawan_nama ON karyawan(nama_karyawan);
CREATE INDEX IF NOT EXISTS idx_karyawan_entitas ON karyawan(entitas);
CREATE INDEX IF NOT EXISTS idx_nrp_counter_lookup ON nrp_counter(entitas_code, tahun);
