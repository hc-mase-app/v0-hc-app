-- Remove DEFAULT 99 from level column
-- This script ensures level column accepts text values without any default

-- Drop any existing default value on level column (will error if no default exists, but that's ok)
DO $$
BEGIN
    ALTER TABLE karyawan ALTER COLUMN level DROP DEFAULT;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore error if no default exists
        NULL;
END $$;

-- Verify column type is VARCHAR
DO $$ 
BEGIN
    -- Check if level column is still INTEGER type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'karyawan' 
        AND column_name = 'level' 
        AND data_type = 'integer'
    ) THEN
        -- Convert INTEGER to VARCHAR
        ALTER TABLE karyawan ALTER COLUMN level TYPE VARCHAR(50) USING CASE 
            WHEN level = 99 THEN NULL
            WHEN level = 1 THEN 'General Manager'
            WHEN level = 2 THEN 'Manager'
            WHEN level = 3 THEN 'PJO'
            WHEN level = 4 THEN 'Deputy PJO'
            WHEN level = 5 THEN 'Head'
            WHEN level = 6 THEN 'Supervisor'
            WHEN level = 7 THEN 'Group Leader'
            WHEN level = 8 THEN 'Admin'
            WHEN level = 9 THEN 'Operator'
            WHEN level = 10 THEN 'Driver'
            WHEN level = 11 THEN 'Mekanik'
            WHEN level = 12 THEN 'Helper'
            ELSE NULL
        END;
    END IF;
END $$;

-- Add check constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_level'
    ) THEN
        ALTER TABLE karyawan ADD CONSTRAINT valid_level 
        CHECK (level IN ('General Manager', 'Manager', 'PJO', 'Deputy PJO', 'Head', 'Supervisor', 'Group Leader', 'Admin', 'Operator', 'Driver', 'Mekanik', 'Helper') OR level IS NULL);
    END IF;
END $$;

COMMENT ON COLUMN karyawan.level IS 'Job level text value from standardized list';
