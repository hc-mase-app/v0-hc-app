-- Add site and departemen columns to leave_requests table
-- This allows filtering without requiring employees to be in users table

ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS site VARCHAR(100),
ADD COLUMN IF NOT EXISTS departemen VARCHAR(100);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_site ON leave_requests(site);
CREATE INDEX IF NOT EXISTS idx_leave_requests_site_dept ON leave_requests(site, departemen);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status_site ON leave_requests(status, site);

-- Update existing records to populate site/departemen from users table
UPDATE leave_requests lr
SET 
  site = u.site,
  departemen = u.departemen
FROM users u
WHERE lr.nik = u.nik AND lr.site IS NULL;

-- Verify the changes
SELECT 
  COUNT(*) as total_requests,
  COUNT(site) as requests_with_site,
  COUNT(departemen) as requests_with_dept
FROM leave_requests;
