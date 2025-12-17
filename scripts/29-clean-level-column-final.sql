-- Script to completely clean and recreate level column as VARCHAR
-- This will remove ALL old triggers, functions, constraints, and defaults

-- Step 1: Drop ALL triggers related to level
DROP TRIGGER IF EXISTS set_level_before_insert_update ON karyawan;
DROP TRIGGER IF EXISTS auto_set_level_trigger ON karyawan;
DROP TRIGGER IF EXISTS set_level_trigger ON karyawan;

-- Step 2: Drop ALL functions related to level
DROP FUNCTION IF EXISTS auto_set_level_on_insert_update();
DROP FUNCTION IF EXISTS convert_level_text_to_number(text);
DROP FUNCTION IF EXISTS set_level_from_jabatan();

-- Step 3: Drop the old level column completely
ALTER TABLE karyawan DROP COLUMN IF EXISTS level;

-- Step 4: Add level column as VARCHAR with NO defaults
ALTER TABLE karyawan ADD COLUMN level VARCHAR(50);

-- Step 5: Add check constraint for valid values (12 levels)
ALTER TABLE karyawan ADD CONSTRAINT valid_level CHECK (
  level IS NULL OR level IN (
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

-- Step 6: Update existing data based on jabatan (case-insensitive)
UPDATE karyawan SET level = 
  CASE 
    WHEN jabatan ILIKE '%general manager%' OR jabatan ILIKE '%gm%' THEN 'General Manager'
    WHEN jabatan ILIKE '%manager%' THEN 'Manager'
    WHEN jabatan ILIKE '%pjo%' THEN 'PJO'
    WHEN jabatan ILIKE '%deputy pjo%' OR jabatan ILIKE '%deputi pjo%' THEN 'Deputy PJO'
    WHEN jabatan ILIKE '%head%' OR jabatan ILIKE '%kepala%' THEN 'Head'
    WHEN jabatan ILIKE '%supervisor%' OR jabatan ILIKE '%spv%' THEN 'Supervisor'
    WHEN jabatan ILIKE '%group leader%' OR jabatan ILIKE '%gl%' OR jabatan ILIKE '%leader%' THEN 'Group Leader'
    WHEN jabatan ILIKE '%admin%' OR jabatan ILIKE '%staff%' OR jabatan ILIKE '%planner%' THEN 'Admin'
    WHEN jabatan ILIKE '%operator%' THEN 'Operator'
    WHEN jabatan ILIKE '%driver%' THEN 'Driver'
    WHEN jabatan ILIKE '%mekanik%' OR jabatan ILIKE '%welder%' OR jabatan ILIKE '%teknisi%' THEN 'Mekanik'
    WHEN jabatan ILIKE '%helper%' OR jabatan ILIKE '%house keeping%' THEN 'Helper'
    ELSE NULL
  END
WHERE level IS NULL;

-- Add comment
COMMENT ON COLUMN karyawan.level IS 'Job level using standardized text values (General Manager to Helper)';
