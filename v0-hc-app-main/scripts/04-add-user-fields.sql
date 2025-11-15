-- Add tanggal_lahir and jenis_kelamin columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tanggal_lahir VARCHAR(50),
ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20);

-- Update existing users with default values if needed
UPDATE users 
SET tanggal_lahir = '1990-01-01', 
    jenis_kelamin = 'Laki-laki' 
WHERE tanggal_lahir IS NULL OR jenis_kelamin IS NULL;
