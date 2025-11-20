-- Script untuk memastikan kolom tiket balik ada dan benar
-- Jalankan script ini di SQL Editor

-- 1. Cek apakah kolom status_tiket_balik sudah ada
DO $$ 
BEGIN
    -- Jika masih ada kolom lama (status_tiket_pulang), rename ke status_tiket_balik
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'status_tiket_pulang'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN status_tiket_pulang TO status_tiket_balik;
        RAISE NOTICE 'Renamed status_tiket_pulang to status_tiket_balik';
    END IF;
    
    -- Jika kolom status_tiket_balik belum ada, buat baru
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'status_tiket_balik'
    ) THEN
        ALTER TABLE leave_requests ADD COLUMN status_tiket_balik VARCHAR(50) DEFAULT 'belum_issued';
        RAISE NOTICE 'Created status_tiket_balik column';
    END IF;
    
    -- Rename kolom lainnya jika masih ada
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'booking_code_pulang'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN booking_code_pulang TO booking_code_balik;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'nama_pesawat_balik'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'nama_pesawat_balik'
    ) THEN
        ALTER TABLE leave_requests ADD COLUMN nama_pesawat_balik VARCHAR(255);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'jam_keberangkatan_pulang'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN jam_keberangkatan_pulang TO jam_keberangkatan_balik;
    END IF;
    
    -- Tambahkan kolom baru untuk rute balik jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'berangkat_dari_balik'
    ) THEN
        ALTER TABLE leave_requests ADD COLUMN berangkat_dari_balik VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'tujuan_balik'
    ) THEN
        ALTER TABLE leave_requests ADD COLUMN tujuan_balik VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'tanggal_berangkat_balik'
    ) THEN
        ALTER TABLE leave_requests ADD COLUMN tanggal_berangkat_balik DATE;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'tanggal_issue_tiket_pulang'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN tanggal_issue_tiket_pulang TO tanggal_issue_tiket_balik;
    END IF;
    
END $$;

-- Tampilkan hasil untuk verifikasi
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
    AND column_name LIKE '%balik%'
ORDER BY column_name;
