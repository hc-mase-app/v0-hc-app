-- Add tanggal_keberangkatan column to leave_requests table
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS tanggal_keberangkatan DATE;

-- Update existing records to use periode_awal as default departure date
UPDATE leave_requests 
SET tanggal_keberangkatan = periode_awal 
WHERE tanggal_keberangkatan IS NULL;
