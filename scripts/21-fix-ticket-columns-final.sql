-- Drop existing columns if they exist and recreate with correct names
-- This ensures we have a clean state

-- Step 1: Add new columns if they don't exist
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS booking_code_balik VARCHAR(50),
ADD COLUMN IF NOT EXISTS nama_pesawat_balik VARCHAR(100),
ADD COLUMN IF NOT EXISTS jam_keberangkatan_balik TIME,
ADD COLUMN IF NOT EXISTS tanggal_berangkat_balik DATE,
ADD COLUMN IF NOT EXISTS berangkat_dari_balik VARCHAR(100),
ADD COLUMN IF NOT EXISTS tujuan_balik VARCHAR(100),
ADD COLUMN IF NOT EXISTS status_tiket_balik VARCHAR(20) DEFAULT 'belum_issued';

-- Step 2: Copy data from old columns to new columns if old columns exist
DO $$
BEGIN
    -- Copy booking_code_pulang to booking_code_balik if old column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='booking_code_pulang') THEN
        UPDATE leave_requests 
        SET booking_code_balik = booking_code_pulang 
        WHERE booking_code_pulang IS NOT NULL AND booking_code_balik IS NULL;
    END IF;

    -- Copy nama_pesawat_pulang to nama_pesawat_balik if old column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='nama_pesawat_pulang') THEN
        UPDATE leave_requests 
        SET nama_pesawat_balik = nama_pesawat_pulang 
        WHERE nama_pesawat_pulang IS NOT NULL AND nama_pesawat_balik IS NULL;
    END IF;

    -- Copy jam_keberangkatan_pulang to jam_keberangkatan_balik if old column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='jam_keberangkatan_pulang') THEN
        UPDATE leave_requests 
        SET jam_keberangkatan_balik = jam_keberangkatan_pulang 
        WHERE jam_keberangkatan_pulang IS NOT NULL AND jam_keberangkatan_balik IS NULL;
    END IF;

    -- Copy tanggal_berangkat_pulang to tanggal_berangkat_balik if old column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='tanggal_berangkat_pulang') THEN
        UPDATE leave_requests 
        SET tanggal_berangkat_balik = tanggal_berangkat_pulang 
        WHERE tanggal_berangkat_pulang IS NOT NULL AND tanggal_berangkat_balik IS NULL;
    END IF;

    -- Copy status_tiket_pulang to status_tiket_balik if old column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='status_tiket_pulang') THEN
        UPDATE leave_requests 
        SET status_tiket_balik = status_tiket_pulang 
        WHERE status_tiket_pulang IS NOT NULL;
    END IF;
END $$;

-- Step 3: Drop old columns if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='booking_code_pulang') THEN
        ALTER TABLE leave_requests DROP COLUMN booking_code_pulang;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='nama_pesawat_pulang') THEN
        ALTER TABLE leave_requests DROP COLUMN nama_pesawat_pulang;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='jam_keberangkatan_pulang') THEN
        ALTER TABLE leave_requests DROP COLUMN jam_keberangkatan_pulang;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='tanggal_berangkat_pulang') THEN
        ALTER TABLE leave_requests DROP COLUMN tanggal_berangkat_pulang;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='status_tiket_pulang') THEN
        ALTER TABLE leave_requests DROP COLUMN status_tiket_pulang;
    END IF;
END $$;

-- Verify the schema is correct
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
AND column_name LIKE '%balik%'
ORDER BY column_name;
