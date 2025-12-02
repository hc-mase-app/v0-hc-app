-- Migration: Add subfolder column to documents table
-- Run this in Neon SQL Editor

-- Add subfolder column (nullable, default NULL for existing records)
-- Using IF NOT EXISTS equivalent for PostgreSQL
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'subfolder'
    ) THEN
        ALTER TABLE documents ADD COLUMN subfolder VARCHAR(100);
    END IF;
END $$;

-- Add index for faster queries by subfolder
CREATE INDEX IF NOT EXISTS idx_documents_subfolder ON documents(subfolder);

-- Add composite index for category + subfolder queries
CREATE INDEX IF NOT EXISTS idx_documents_category_subfolder ON documents(category, subfolder);

-- Update existing documents to have NULL subfolder (optional - they will show in all subfolders or a default "Umum" subfolder)
-- You can manually update existing documents to assign them to specific subfolders

COMMENT ON COLUMN documents.subfolder IS 'Subfolder grouping for documents within a category, e.g., PT GSM, PT SSS';

-- Verify the migration succeeded
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;
