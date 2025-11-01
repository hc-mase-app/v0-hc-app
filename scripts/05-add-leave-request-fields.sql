-- Add new fields to leave_requests table
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS tanggal_keberangkatan VARCHAR(50),
ADD COLUMN IF NOT EXISTS tanggal_lahir VARCHAR(50),
ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20),
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS submitted_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS booking_code VARCHAR(100);

-- Add foreign key for submitted_by if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leave_requests_submitted_by_fkey'
  ) THEN
    ALTER TABLE leave_requests 
    ADD CONSTRAINT leave_requests_submitted_by_fkey 
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_submitted_by ON leave_requests(submitted_by);
