-- Add indexes for performance optimization
-- These indexes will significantly speed up search and filter operations

-- Index for departemen column (frequently used in filters)
CREATE INDEX IF NOT EXISTS idx_karyawan_departemen ON karyawan(departemen);

-- Index for site column (frequently used in filters)
CREATE INDEX IF NOT EXISTS idx_karyawan_site ON karyawan(site);

-- Index for entitas column (frequently used in filters)
CREATE INDEX IF NOT EXISTS idx_karyawan_entitas ON karyawan(entitas);

-- Composite index for search operations (nama + nrp)
CREATE INDEX IF NOT EXISTS idx_karyawan_search ON karyawan(nama_karyawan, nrp);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_karyawan_tanggal_masuk ON karyawan(tanggal_masuk_kerja);

-- Success message
SELECT 'Performance indexes created successfully!' as message;
