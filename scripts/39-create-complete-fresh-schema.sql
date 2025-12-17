-- Drop all existing tables if any remain
DROP TABLE IF EXISTS employee_hierarchy CASCADE;
DROP TABLE IF EXISTS karyawan CASCADE;
DROP TABLE IF EXISTS nrp_counter CASCADE;

-- Create karyawan table with clean structure
CREATE TABLE karyawan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nrp VARCHAR(20) UNIQUE NOT NULL,
    nama_karyawan VARCHAR(255) NOT NULL,
    jabatan VARCHAR(100) NOT NULL,
    level VARCHAR(50), -- Level as text from the start, no default value
    departemen VARCHAR(100) NOT NULL,
    site VARCHAR(50) NOT NULL,
    entitas VARCHAR(100) NOT NULL,
    tanggal_masuk_kerja DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    manager_id UUID REFERENCES karyawan(id) ON DELETE SET NULL,
    direct_reports_count INTEGER DEFAULT 0,
    
    -- Constraint untuk valid level values
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

-- Create indexes for performance
CREATE INDEX idx_karyawan_nrp ON karyawan(nrp);
CREATE INDEX idx_karyawan_site ON karyawan(site);
CREATE INDEX idx_karyawan_departemen ON karyawan(departemen);
CREATE INDEX idx_karyawan_jabatan ON karyawan(jabatan);
CREATE INDEX idx_karyawan_level ON karyawan(level);
CREATE INDEX idx_karyawan_manager ON karyawan(manager_id);

-- Fixed nrp_counter structure to match service expectations
-- Create nrp_counter table with correct column names
CREATE TABLE nrp_counter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entitas_code VARCHAR(10) NOT NULL,  -- Changed from 'site' to 'entitas_code'
    tahun VARCHAR(2) NOT NULL,          -- Changed from 'year' to 'tahun'
    last_nomor_urut INTEGER NOT NULL DEFAULT 1,  -- Changed from 'counter' to 'last_nomor_urut'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entitas_code, tahun)  -- Updated unique constraint
);

-- Create index for nrp_counter
CREATE INDEX idx_nrp_counter_entitas_tahun ON nrp_counter(entitas_code, tahun);

-- Trigger to auto-update direct_reports_count
CREATE OR REPLACE FUNCTION update_direct_reports_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old manager's count
    IF OLD.manager_id IS NOT NULL THEN
        UPDATE karyawan
        SET direct_reports_count = (
            SELECT COUNT(*) FROM karyawan WHERE manager_id = OLD.manager_id
        )
        WHERE id = OLD.manager_id;
    END IF;
    
    -- Update new manager's count
    IF NEW.manager_id IS NOT NULL THEN
        UPDATE karyawan
        SET direct_reports_count = (
            SELECT COUNT(*) FROM karyawan WHERE manager_id = NEW.manager_id
        )
        WHERE id = NEW.manager_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_direct_reports_count
AFTER INSERT OR UPDATE OF manager_id OR DELETE ON karyawan
FOR EACH ROW
EXECUTE FUNCTION update_direct_reports_count();

-- Add comments
COMMENT ON COLUMN karyawan.level IS 'Job level using standardized text values (General Manager, Manager, PJO, Deputy PJO, Head, Supervisor, Group Leader, Admin, Operator, Driver, Mekanik, Helper)';
COMMENT ON COLUMN karyawan.manager_id IS 'Reference to direct manager/supervisor';
COMMENT ON COLUMN karyawan.direct_reports_count IS 'Number of direct reports under this employee';
COMMENT ON TABLE karyawan IS 'Employee master data for NRP Generator and TMS Hierarchy';
COMMENT ON TABLE nrp_counter IS 'Counter for auto-generating NRP numbers by entitas code and year';
COMMENT ON COLUMN nrp_counter.entitas_code IS 'Entity code (e.g., 11, 12, 22, 21)';
COMMENT ON COLUMN nrp_counter.tahun IS '2-digit year (e.g., 24, 25)';
COMMENT ON COLUMN nrp_counter.last_nomor_urut IS 'Last sequential number used for NRP generation';
