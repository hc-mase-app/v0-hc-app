-- Add level column to karyawan table for standardized job hierarchy
-- Level hierarchy: 1 = GM (highest), 12 = Helper (lowest)

-- Add level column
ALTER TABLE karyawan 
ADD COLUMN IF NOT EXISTS level INTEGER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_karyawan_level ON karyawan(level);

-- Create function to convert text level to number for CSV imports
CREATE OR REPLACE FUNCTION convert_level_text_to_number(level_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- If input is NULL or empty, try to detect from other sources
  IF level_text IS NULL OR TRIM(level_text) = '' THEN
    RETURN NULL;
  END IF;
  
  -- If input is already a valid number between 1-12, return it
  IF level_text ~ '^\d+$' THEN
    DECLARE
      num INTEGER := level_text::INTEGER;
    BEGIN
      IF num >= 1 AND num <= 12 THEN
        RETURN num;
      END IF;
    END;
  END IF;
  
  -- Convert text level to number based on 12-level hierarchy
  -- Using ILIKE for case-insensitive matching with flexible patterns
  RETURN CASE 
    WHEN level_text ILIKE 'GM' OR level_text ILIKE '%general%manager%' THEN 1
    WHEN level_text ILIKE 'manager' OR level_text ILIKE 'mngr' THEN 2
    WHEN level_text ILIKE 'PJO' THEN 3
    WHEN level_text ILIKE '%deputy%pjo%' OR level_text ILIKE 'deputy' OR level_text ILIKE 'dpjo' THEN 4
    WHEN level_text ILIKE 'head' THEN 5
    WHEN level_text ILIKE 'SPV' OR level_text ILIKE 'supervisor' THEN 6
    WHEN level_text ILIKE 'GL' OR level_text ILIKE '%group%leader%' THEN 7
    WHEN level_text ILIKE 'officer' THEN 7
    WHEN level_text ILIKE 'admin' OR level_text ILIKE 'administrasi' THEN 8
    WHEN level_text ILIKE 'staff' OR level_text ILIKE 'teknisi' OR level_text ILIKE 'planner' THEN 8
    WHEN level_text ILIKE 'operator' OR level_text ILIKE 'op' THEN 9
    WHEN level_text ILIKE '%driver%' THEN 10
    WHEN level_text ILIKE 'mekanik' OR level_text ILIKE 'mechanic' THEN 11
    WHEN level_text ILIKE 'helper' THEN 12
    WHEN level_text ILIKE '%house%keeping%' OR level_text ILIKE 'HK' THEN 12
    ELSE NULL -- Return NULL instead of 99 so trigger can detect from jabatan
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to auto-set level on insert/update
-- Improved trigger to handle both jabatan and level column updates
CREATE OR REPLACE FUNCTION set_karyawan_level()
RETURNS TRIGGER AS $$
BEGIN
  -- If level is provided and it's a text, try to convert it
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.level IS DISTINCT FROM OLD.level OR NEW.jabatan IS DISTINCT FROM OLD.jabatan)) THEN
    
    -- If level is 99 or NULL or invalid, derive from jabatan
    IF NEW.level IS NULL OR NEW.level = 99 OR NEW.level < 1 OR NEW.level > 12 THEN
      NEW.level := CASE 
        WHEN UPPER(NEW.jabatan) IN ('GM', 'GENERAL MANAGER') THEN 1
        WHEN UPPER(NEW.jabatan) = 'MANAGER' THEN 2
        WHEN UPPER(NEW.jabatan) = 'PJO' THEN 3
        WHEN UPPER(NEW.jabatan) IN ('DEPUTY PJO', 'DEPUTY', 'DPJO') THEN 4
        WHEN UPPER(NEW.jabatan) = 'HEAD' THEN 5
        WHEN UPPER(NEW.jabatan) IN ('SPV', 'SUPERVISOR') THEN 6
        WHEN UPPER(NEW.jabatan) IN ('GL', 'GROUP LEADER') THEN 7
        WHEN UPPER(NEW.jabatan) = 'OFFICER' THEN 7
        WHEN UPPER(NEW.jabatan) = 'ADMIN' THEN 8
        WHEN UPPER(NEW.jabatan) IN ('STAFF', 'TEKNISI', 'PLANNER') THEN 8
        WHEN UPPER(NEW.jabatan) IN ('OPERATOR', 'OP') THEN 9
        WHEN UPPER(NEW.jabatan) LIKE '%DRIVER%' THEN 10
        WHEN UPPER(NEW.jabatan) IN ('MEKANIK', 'MECHANIC') THEN 11
        WHEN UPPER(NEW.jabatan) = 'HELPER' THEN 12
        WHEN UPPER(NEW.jabatan) LIKE '%HOUSE%KEEPING%' OR UPPER(NEW.jabatan) = 'HK' THEN 12
        ELSE 99 -- Unknown jabatan
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it handles all cases
DROP TRIGGER IF EXISTS trigger_set_karyawan_level ON karyawan;
CREATE TRIGGER trigger_set_karyawan_level
  BEFORE INSERT OR UPDATE ON karyawan
  FOR EACH ROW
  EXECUTE FUNCTION set_karyawan_level();

-- Fix existing records with invalid levels (99, NULL, or out of range)
-- Update all records that have level 99 or NULL by deriving from jabatan
UPDATE karyawan 
SET level = CASE 
  WHEN UPPER(jabatan) IN ('GM', 'GENERAL MANAGER') THEN 1
  WHEN UPPER(jabatan) = 'MANAGER' THEN 2
  WHEN UPPER(jabatan) = 'PJO' THEN 3
  WHEN UPPER(jabatan) IN ('DEPUTY PJO', 'DEPUTY', 'DPJO') THEN 4
  WHEN UPPER(jabatan) = 'HEAD' THEN 5
  WHEN UPPER(jabatan) IN ('SPV', 'SUPERVISOR') THEN 6
  WHEN UPPER(jabatan) IN ('GL', 'GROUP LEADER') THEN 7
  WHEN UPPER(jabatan) = 'OFFICER' THEN 7
  WHEN UPPER(jabatan) = 'ADMIN' THEN 8
  WHEN UPPER(jabatan) IN ('STAFF', 'TEKNISI', 'PLANNER') THEN 8
  WHEN UPPER(jabatan) IN ('OPERATOR', 'OP') THEN 9
  WHEN UPPER(jabatan) LIKE '%DRIVER%' THEN 10
  WHEN UPPER(jabatan) IN ('MEKANIK', 'MECHANIC') THEN 11
  WHEN UPPER(jabatan) = 'HELPER' THEN 12
  WHEN UPPER(jabatan) LIKE '%HOUSE%KEEPING%' OR UPPER(jabatan) = 'HK' THEN 12
  ELSE 99
END
WHERE level IS NULL OR level = 99 OR level < 1 OR level > 12;

-- Verify the updates
SELECT DISTINCT jabatan, level 
FROM karyawan 
WHERE level IS NOT NULL
ORDER BY level, jabatan;
