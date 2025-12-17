-- Drop remaining NRP tables
DROP TABLE IF EXISTS karyawan CASCADE;
DROP TABLE IF EXISTS nrp_counter CASCADE;

-- Also drop related tables if they still exist
DROP TABLE IF EXISTS hierarchy_assignments CASCADE;
DROP TABLE IF EXISTS manager_hierarchy CASCADE;
DROP TABLE IF EXISTS ticket_assignments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

COMMENT ON SCHEMA public IS 'Cleaned up all NRP and TMS tables - ready for fresh start';
