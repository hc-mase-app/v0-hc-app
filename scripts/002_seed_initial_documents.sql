-- Seed initial document data
-- You can add more documents here following the same pattern

-- Updated document name to match actual SK document
INSERT INTO documents (name, drive_id, category, size, uploaded_at) VALUES
('SK - GSM - 111. Yan Firdaus - Head HC Development - HO Jakarta', '1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug', 'sk', '236.32 KB', '2025-12-02')
ON CONFLICT (drive_id) DO NOTHING;

-- Add more documents here in the same format:
-- INSERT INTO documents (name, drive_id, category, size, uploaded_at) VALUES
-- ('Document Name', 'GOOGLE_DRIVE_ID', 'category', 'file_size', 'YYYY-MM-DD');
