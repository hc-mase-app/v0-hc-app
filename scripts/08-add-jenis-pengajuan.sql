-- Add jenis_pengajuan column to leave_requests table
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS jenis_pengajuan VARCHAR(20) 
CHECK (jenis_pengajuan IN ('dengan_tiket', 'lokal'))
DEFAULT 'dengan_tiket';

-- Make travel fields nullable for cuti lokal
ALTER TABLE leave_requests 
ALTER COLUMN berangkat_dari DROP NOT NULL,
ALTER COLUMN tujuan DROP NOT NULL,
ALTER COLUMN tanggal_keberangkatan DROP NOT NULL;

-- Add status 'approved' for cuti lokal workflow
-- This is a comment-only change to document the new status
-- The 'approved' status will be used when cuti lokal is approved by PJO Site
