-- Create fresh karyawan table with level as VARCHAR from the start
-- No legacy issues, no default value 99, clean structure

CREATE TABLE IF NOT EXISTS karyawan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nrp VARCHAR(10) UNIQUE NOT NULL,
    nama_karyawan VARCHAR(255) NOT NULL,
    jabatan VARCHAR(100) NOT NULL,
    level VARCHAR(50), -- Text level: General Manager, Manager, PJO, etc. (nullable)
    departemen VARCHAR(100) NOT NULL,
    tanggal_masuk_kerja DATE NOT NULL,
    site VARCHAR(10) NOT NULL,
    entitas VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atasan_langsung_id UUID REFERENCES karyawan(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true
);

-- Add check constraint for valid level values (12 levels + NULL allowed)
ALTER TABLE karyawan ADD CONSTRAINT valid_level 
CHECK (
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
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_karyawan_nrp ON karyawan(nrp);
CREATE INDEX IF NOT EXISTS idx_karyawan_site ON karyawan(site);
CREATE INDEX IF NOT EXISTS idx_karyawan_departemen ON karyawan(departemen);
CREATE INDEX IF NOT EXISTS idx_karyawan_level ON karyawan(level);
CREATE INDEX IF NOT EXISTS idx_karyawan_atasan ON karyawan(atasan_langsung_id);

-- Create nrp_counter table
CREATE TABLE IF NOT EXISTS nrp_counter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site VARCHAR(10) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    counter INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site, year, month)
);

CREATE INDEX IF NOT EXISTS idx_nrp_counter_site_year_month ON nrp_counter(site, year, month);

COMMENT ON COLUMN karyawan.level IS 'Job level text value from standardized list';
COMMENT ON TABLE karyawan IS 'Employee master data with NRP and hierarchy';
COMMENT ON TABLE nrp_counter IS 'Counter for generating unique NRP numbers per site/month';
