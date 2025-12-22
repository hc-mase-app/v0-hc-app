-- Add composite indexes for PJO Site queries optimization
-- These indexes improve query performance for multi-column WHERE clauses

-- Composite index for PJO queries (status + site)
CREATE INDEX IF NOT EXISTS idx_leave_requests_status_site 
ON leave_requests(status, site);

-- Composite index for filtering by status, site, and date
CREATE INDEX IF NOT EXISTS idx_leave_requests_status_site_date 
ON leave_requests(status, site, created_at DESC);

-- Composite index for year extraction and filtering
CREATE INDEX IF NOT EXISTS idx_leave_requests_tanggal_mulai 
ON leave_requests(tanggal_mulai DESC);

-- Analyze tables to update statistics for query planner
ANALYZE leave_requests;
ANALYZE users;
ANALYZE approval_history;
