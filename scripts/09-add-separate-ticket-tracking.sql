-- Add separate ticket tracking fields
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS status_tiket_berangkat VARCHAR(20) DEFAULT 'belum_issued',
ADD COLUMN IF NOT EXISTS status_tiket_pulang VARCHAR(20) DEFAULT 'belum_issued',
ADD COLUMN IF NOT EXISTS tanggal_issue_tiket_berangkat TIMESTAMP,
ADD COLUMN IF NOT EXISTS tanggal_issue_tiket_pulang TIMESTAMP,
ADD COLUMN IF NOT EXISTS booking_code_pulang VARCHAR(255),
ADD COLUMN IF NOT EXISTS nama_pesawat_pulang VARCHAR(255),
ADD COLUMN IF NOT EXISTS jam_keberangkatan_pulang TIME;

-- Add comment for documentation
COMMENT ON COLUMN leave_requests.status_tiket_berangkat IS 'Status tiket berangkat: belum_issued, issued';
COMMENT ON COLUMN leave_requests.status_tiket_pulang IS 'Status tiket pulang: belum_issued, issued';
