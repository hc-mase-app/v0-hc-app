-- Add separate route fields for return ticket to support different departure/destination
-- Example: Departure: Ternate → Jakarta, Return: Surabaya → Ternate

ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS berangkat_dari_balik VARCHAR(255),
ADD COLUMN IF NOT EXISTS tujuan_balik VARCHAR(255),
ADD COLUMN IF NOT EXISTS tanggal_berangkat_balik DATE;

-- Add comment to document the purpose
COMMENT ON COLUMN leave_requests.berangkat_dari_balik IS 'Departure city for return ticket (can be different from initial destination)';
COMMENT ON COLUMN leave_requests.tujuan_balik IS 'Destination city for return ticket (can be different from initial departure)';
COMMENT ON COLUMN leave_requests.tanggal_berangkat_balik IS 'Departure date for return flight';

-- Fixed RENAME COLUMN syntax - PostgreSQL doesn't support IF EXISTS with RENAME
-- Using DO block to check column existence before renaming
DO $$ 
BEGIN
    -- Rename booking_code_pulang to booking_code_balik
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'booking_code_pulang'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN booking_code_pulang TO booking_code_balik;
    END IF;

    -- Rename nama_pesawat_pulang to nama_pesawat_balik
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'nama_pesawat_pulang'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN nama_pesawat_pulang TO nama_pesawat_balik;
    END IF;

    -- Rename jam_keberangkatan_pulang to jam_keberangkatan_balik
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'jam_keberangkatan_pulang'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN jam_keberangkatan_pulang TO jam_keberangkatan_balik;
    END IF;

    -- Rename status_tiket_pulang to status_tiket_balik
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'status_tiket_pulang'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN status_tiket_pulang TO status_tiket_balik;
    END IF;

    -- Rename tanggal_issue_tiket_pulang to tanggal_issue_tiket_balik
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'tanggal_issue_tiket_pulang'
    ) THEN
        ALTER TABLE leave_requests RENAME COLUMN tanggal_issue_tiket_pulang TO tanggal_issue_tiket_balik;
    END IF;
END $$;
