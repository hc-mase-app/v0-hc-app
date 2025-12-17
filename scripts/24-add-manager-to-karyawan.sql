-- Add manager_id column to karyawan table for TMS hierarchy
ALTER TABLE karyawan 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES karyawan(id) ON DELETE SET NULL;

-- Add direct_reports_count for caching subordinate count
ALTER TABLE karyawan 
ADD COLUMN IF NOT EXISTS direct_reports_count INTEGER DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_karyawan_manager ON karyawan(manager_id);
CREATE INDEX IF NOT EXISTS idx_karyawan_site_dept ON karyawan(site, departemen);
CREATE INDEX IF NOT EXISTS idx_karyawan_jabatan ON karyawan(jabatan);

-- Add trigger to auto-update direct_reports_count when manager changes
CREATE OR REPLACE FUNCTION update_manager_direct_reports_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease old manager's count
  IF OLD.manager_id IS NOT NULL THEN
    UPDATE karyawan 
    SET direct_reports_count = (
      SELECT COUNT(*) FROM karyawan WHERE manager_id = OLD.manager_id
    )
    WHERE id = OLD.manager_id;
  END IF;
  
  -- Increase new manager's count
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

CREATE TRIGGER trigger_update_manager_direct_reports
AFTER INSERT OR UPDATE OF manager_id OR DELETE ON karyawan
FOR EACH ROW
EXECUTE FUNCTION update_manager_direct_reports_count();

-- Initial calculation of direct_reports_count for all managers
UPDATE karyawan k
SET direct_reports_count = (
  SELECT COUNT(*) FROM karyawan WHERE manager_id = k.id
);
