-- Remove default value from level column and ensure it accepts text values

-- Step 1: Remove any default value on the level column
ALTER TABLE karyawan ALTER COLUMN level DROP DEFAULT;

-- Step 2: Ensure column is VARCHAR(50) and accepts NULL
ALTER TABLE karyawan ALTER COLUMN level TYPE VARCHAR(50) USING 
  CASE 
    WHEN level::text = '99' THEN NULL
    WHEN level::text IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12') THEN 
      CASE level::text
        WHEN '1' THEN 'General Manager'
        WHEN '2' THEN 'Manager'
        WHEN '3' THEN 'PJO'
        WHEN '4' THEN 'Deputy PJO'
        WHEN '5' THEN 'Head'
        WHEN '6' THEN 'Supervisor'
        WHEN '7' THEN 'Group Leader'
        WHEN '8' THEN 'Admin'
        WHEN '9' THEN 'Operator'
        WHEN '10' THEN 'Driver'
        WHEN '11' THEN 'Mekanik'
        WHEN '12' THEN 'Helper'
      END
    ELSE level::text
  END;

-- Step 3: Drop existing constraint if it exists
ALTER TABLE karyawan DROP CONSTRAINT IF EXISTS valid_level;

-- Step 4: Add constraint for valid level values
ALTER TABLE karyawan ADD CONSTRAINT valid_level 
  CHECK (level IS NULL OR level IN (
    'General Manager', 'Manager', 'PJO', 'Deputy PJO', 'Head', 
    'Supervisor', 'Group Leader', 'Admin', 'Operator', 'Driver', 'Mekanik', 'Helper'
  ));

-- Step 5: Verify no default exists
SELECT column_name, column_default, data_type 
FROM information_schema.columns 
WHERE table_name = 'karyawan' AND column_name = 'level';

COMMENT ON COLUMN karyawan.level IS 'Job level text value from standardized list, no default value';
