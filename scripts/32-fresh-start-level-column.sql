-- Fresh start: Completely recreate level column without any legacy issues
-- Drop all constraints and triggers first
DO $$ 
BEGIN
    -- Drop all triggers related to level
    DROP TRIGGER IF EXISTS set_level_before_insert_update ON karyawan;
    DROP TRIGGER IF EXISTS auto_set_level_trigger ON karyawan;
    DROP TRIGGER IF EXISTS set_level_on_insert ON karyawan;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Trigger drop failed: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    -- Drop all functions related to level
    DROP FUNCTION IF EXISTS convert_level_text_to_number(text);
    DROP FUNCTION IF EXISTS auto_set_level_on_insert_update();
    DROP FUNCTION IF EXISTS set_level_from_jabatan();
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Function drop failed: %', SQLERRM;
END $$;

-- Completely drop the level column to remove any hidden defaults or constraints
ALTER TABLE karyawan DROP COLUMN IF EXISTS level CASCADE;

-- Recreate level column fresh as VARCHAR(50) with NO DEFAULT
ALTER TABLE karyawan ADD COLUMN level VARCHAR(50);

-- Add check constraint for valid levels only
ALTER TABLE karyawan ADD CONSTRAINT valid_level 
    CHECK (level IS NULL OR level IN (
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
    ));

-- Optionally update existing rows based on jabatan (if any data exists)
UPDATE karyawan SET level = 
    CASE 
        WHEN jabatan ILIKE '%general%manager%' OR jabatan ILIKE '%gm%' THEN 'General Manager'
        WHEN jabatan ILIKE '%manager%' AND jabatan NOT ILIKE '%general%' THEN 'Manager'
        WHEN jabatan ILIKE '%pjo%' AND jabatan NOT ILIKE '%deputy%' THEN 'PJO'
        WHEN jabatan ILIKE '%deputy%pjo%' OR jabatan ILIKE '%dpjo%' THEN 'Deputy PJO'
        WHEN jabatan ILIKE '%head%' THEN 'Head'
        WHEN jabatan ILIKE '%supervisor%' OR jabatan ILIKE '%spv%' THEN 'Supervisor'
        WHEN jabatan ILIKE '%group%leader%' OR jabatan ILIKE '%gl%' OR jabatan ILIKE '%leader%' THEN 'Group Leader'
        WHEN jabatan ILIKE '%admin%' THEN 'Admin'
        WHEN jabatan ILIKE '%operator%' THEN 'Operator'
        WHEN jabatan ILIKE '%driver%' THEN 'Driver'
        WHEN jabatan ILIKE '%mekanik%' OR jabatan ILIKE '%welder%' OR jabatan ILIKE '%mekanis%' THEN 'Mekanik'
        WHEN jabatan ILIKE '%helper%' THEN 'Helper'
        ELSE NULL
    END
WHERE level IS NULL;

COMMENT ON COLUMN karyawan.level IS 'Job level as text - matches exactly what is uploaded in CSV without conversion';
