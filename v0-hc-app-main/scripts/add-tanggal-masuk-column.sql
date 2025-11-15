-- Migration: Add tanggal_masuk column to users table
-- Description: Menambahkan kolom tanggal masuk kerja ke tabel users

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'tanggal_masuk'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN tanggal_masuk DATE;
        
        RAISE NOTICE 'Column tanggal_masuk added successfully';
    ELSE
        RAISE NOTICE 'Column tanggal_masuk already exists';
    END IF;
END $$;

-- Optional: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_tanggal_masuk ON users(tanggal_masuk);

-- Optional: Update existing records with sample data (if needed)
-- UPDATE users SET tanggal_masuk = created_at::date WHERE tanggal_masuk IS NULL;
