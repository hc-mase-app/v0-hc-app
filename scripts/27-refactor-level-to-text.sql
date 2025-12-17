-- Refactor level column to use TEXT instead of INTEGER
-- This makes the system simpler and avoids conversion issues

-- Drop existing level column and related functions/triggers
ALTER TABLE karyawan DROP COLUMN IF EXISTS level CASCADE;
DROP FUNCTION IF EXISTS convert_level_text_to_number(TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_set_level_on_insert_update() CASCADE;
DROP TRIGGER IF EXISTS set_level_before_insert_update ON karyawan;

-- Add level as TEXT column with proper values
ALTER TABLE karyawan ADD COLUMN level VARCHAR(50);

-- Add check constraint to ensure only valid levels
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

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_karyawan_level ON karyawan(level);

-- Optional: Set default level based on jabatan for existing data (if needed)
-- This is just a helper, can be removed if you're starting fresh
UPDATE karyawan SET level = 
  CASE 
    WHEN jabatan ILIKE '%general%manager%' OR jabatan ILIKE '%gm%' THEN 'General Manager'
    WHEN jabatan ILIKE '%manager%' THEN 'Manager'
    WHEN jabatan ILIKE '%pjo%' THEN 'PJO'
    WHEN jabatan ILIKE '%deputy%pjo%' THEN 'Deputy PJO'
    WHEN jabatan ILIKE '%head%' THEN 'Head'
    WHEN jabatan ILIKE '%supervisor%' OR jabatan ILIKE '%spv%' THEN 'Supervisor'
    WHEN jabatan ILIKE '%group%leader%' OR jabatan ILIKE '%gl%' THEN 'Group Leader'
    WHEN jabatan ILIKE '%admin%' THEN 'Admin'
    WHEN jabatan ILIKE '%operator%' THEN 'Operator'
    WHEN jabatan ILIKE '%driver%' THEN 'Driver'
    WHEN jabatan ILIKE '%mekanik%' THEN 'Mekanik'
    WHEN jabatan ILIKE '%helper%' THEN 'Helper'
    ELSE NULL
  END
WHERE level IS NULL;

-- Add comment
COMMENT ON COLUMN karyawan.level IS 'Job level using standardized text values';
