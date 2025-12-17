-- Final fix untuk memastikan kolom level adalah VARCHAR tanpa default 99

-- Drop semua constraints dan triggers terkait level
ALTER TABLE karyawan DROP CONSTRAINT IF EXISTS valid_level CASCADE;
DROP TRIGGER IF EXISTS set_level_before_insert_update ON karyawan CASCADE;
DROP FUNCTION IF EXISTS convert_level_text_to_number(TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_set_level_on_insert_update() CASCADE;

-- Drop dan recreate kolom level untuk memastikan clean state
ALTER TABLE karyawan DROP COLUMN IF EXISTS level CASCADE;

-- Tambahkan level sebagai VARCHAR(50) yang nullable
ALTER TABLE karyawan ADD COLUMN level VARCHAR(50) DEFAULT NULL;

-- Tambahkan check constraint untuk validasi
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

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_karyawan_level ON karyawan(level);

-- Set level otomatis berdasarkan jabatan untuk data yang sudah ada
UPDATE karyawan SET level = 
  CASE 
    WHEN jabatan ILIKE '%general%manager%' OR jabatan = 'GM' THEN 'General Manager'
    WHEN jabatan ILIKE '%manager%' AND jabatan NOT ILIKE '%general%' THEN 'Manager'
    WHEN jabatan ILIKE '%pjo%' AND jabatan NOT ILIKE '%deputy%' THEN 'PJO'
    WHEN jabatan ILIKE '%deputy%pjo%' OR jabatan = 'Deputy PJO' THEN 'Deputy PJO'
    WHEN jabatan ILIKE '%head%' THEN 'Head'
    WHEN jabatan ILIKE '%supervisor%' OR jabatan = 'SPV' THEN 'Supervisor'
    WHEN jabatan ILIKE '%group%leader%' OR jabatan = 'GL' THEN 'Group Leader'
    WHEN jabatan ILIKE '%officer%' THEN 'Group Leader'
    WHEN jabatan ILIKE '%admin%' THEN 'Admin'
    WHEN jabatan ILIKE '%operator%' THEN 'Operator'
    WHEN jabatan ILIKE '%driver%' THEN 'Driver'
    WHEN jabatan ILIKE '%mekanik%' THEN 'Mekanik'
    WHEN jabatan ILIKE '%welder%' THEN 'Operator'
    WHEN jabatan ILIKE '%helper%' THEN 'Helper'
    ELSE NULL
  END
WHERE level IS NULL;

COMMENT ON COLUMN karyawan.level IS 'Job level using standardized text values (General Manager, Manager, PJO, Deputy PJO, Head, Supervisor, Group Leader, Admin, Operator, Driver, Mekanik, Helper)';
