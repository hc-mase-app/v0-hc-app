-- Create documents table for HCGA IMS Document Management
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  -- Increased drive_id from 100 to 255 to accommodate longer Google Drive IDs
  drive_id VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  -- Increased size from 20 to 50 for more flexible file size formats
  size VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by category
CREATE INDEX idx_documents_category ON documents(category);

-- Create index for search by name
CREATE INDEX idx_documents_name ON documents(name);

-- Add comment to table
COMMENT ON TABLE documents IS 'Stores metadata for Google Drive documents in HCGA IMS';
