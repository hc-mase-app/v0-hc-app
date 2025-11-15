-- Add new fields for HR Site and HR Ticketing

-- Add lama_onsite field for HR Site (duration onsite in days)
ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS lama_onsite INTEGER;

-- Add nama_pesawat field for HR Ticketing (airline name)
ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS nama_pesawat VARCHAR(255);

-- Add jam_keberangkatan field for HR Ticketing (departure time)
ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS jam_keberangkatan TIME;

-- Add site and departemen columns if they don't exist (for compatibility)
ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS site VARCHAR(100);

ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS departemen VARCHAR(100);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_site ON leave_requests(site);
CREATE INDEX IF NOT EXISTS idx_leave_requests_departemen ON leave_requests(departemen);
