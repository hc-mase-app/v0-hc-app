-- Fix nrp_counter table structure without dropping karyawan data
-- This only modifies nrp_counter to match what the service expects

-- Drop existing nrp_counter table (no data loss for karyawan)
DROP TABLE IF EXISTS nrp_counter CASCADE;

-- Create nrp_counter with correct structure
CREATE TABLE nrp_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitas_code VARCHAR(10) NOT NULL,
  tahun INTEGER NOT NULL,
  last_nomor_urut INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entitas_code, tahun)
);

-- Add index for faster lookups
CREATE INDEX idx_nrp_counter_entitas_tahun ON nrp_counter(entitas_code, tahun);

-- Add comment
COMMENT ON TABLE nrp_counter IS 'Counter for generating sequential NRP numbers per entitas per year';
COMMENT ON COLUMN nrp_counter.entitas_code IS 'Entitas code (e.g., GSM, SSS, MKM)';
COMMENT ON COLUMN nrp_counter.tahun IS 'Year for the counter';
COMMENT ON COLUMN nrp_counter.last_nomor_urut IS 'Last sequential number used';
