-- Step 1: Drop the problematic check constraint
ALTER TABLE karyawan DROP CONSTRAINT IF EXISTS valid_level;

-- Step 2: Change level column type to VARCHAR without any constraints
ALTER TABLE karyawan ALTER COLUMN level TYPE VARCHAR(50);

-- Step 3: Remove any default value
ALTER TABLE karyawan ALTER COLUMN level DROP DEFAULT;

-- Step 4: Convert all 99 values to NULL
UPDATE karyawan SET level = NULL WHERE level = '99';

-- Step 5: Update existing data based on jabatan
UPDATE karyawan SET level = 
  CASE 
    WHEN jabatan ILIKE '%general%manager%' OR jabatan = 'GM' THEN 'General Manager'
    WHEN jabatan ILIKE '%manager%' AND jabatan NOT ILIKE '%general%' THEN 'Manager'
    WHEN jabatan ILIKE '%pjo%' AND jabatan NOT ILIKE '%deputy%' THEN 'PJO'
    WHEN jabatan ILIKE '%deputy%pjo%' THEN 'Deputy PJO'
    WHEN jabatan ILIKE '%head%' THEN 'Head'
    WHEN jabatan ILIKE '%supervisor%' OR jabatan = 'SPV' THEN 'Supervisor'
    WHEN jabatan ILIKE '%group%leader%' OR jabatan = 'GL' THEN 'Group Leader'
    WHEN jabatan ILIKE '%admin%' THEN 'Admin'
    WHEN jabatan ILIKE '%operator%' THEN 'Operator'
    WHEN jabatan ILIKE '%driver%' THEN 'Driver'
    WHEN jabatan ILIKE '%mekanik%' OR jabatan ILIKE '%welder%' OR jabatan ILIKE '%mechanic%' THEN 'Mekanik'
    WHEN jabatan ILIKE '%helper%' THEN 'Helper'
    ELSE level
  END
WHERE level IS NULL OR level = '99';

-- Step 6: NOW add the constraint back (after data is clean)
ALTER TABLE karyawan ADD CONSTRAINT valid_level 
  CHECK (level IN ('General Manager', 'Manager', 'PJO', 'Deputy PJO', 'Head', 'Supervisor', 'Group Leader', 'Admin', 'Operator', 'Driver', 'Mekanik', 'Helper') OR level IS NULL);

COMMENT ON COLUMN karyawan.level IS 'Job level text value from standardized list - no default, accepts NULL';
