-- Drop all NRP and TMS related tables to start fresh
-- Run this script first to clean up all legacy issues

-- Drop TMS tables
DROP TABLE IF EXISTS tms_activity_evidence CASCADE;
DROP TABLE IF EXISTS tms_leadership_activities CASCADE;
DROP TABLE IF EXISTS tms_activity_types CASCADE;

-- Drop NRP related tables
DROP TABLE IF EXISTS karyawan CASCADE;
DROP TABLE IF EXISTS entitas CASCADE;
DROP TABLE IF EXISTS departemen CASCADE;
DROP TABLE IF EXISTS site CASCADE;

-- Drop any functions that might exist
DROP FUNCTION IF EXISTS convert_level_text_to_number(text) CASCADE;
DROP FUNCTION IF EXISTS auto_set_level_on_insert_update() CASCADE;

-- Drop any sequences
DROP SEQUENCE IF EXISTS karyawan_id_seq CASCADE;

COMMENT ON SCHEMA public IS 'All NRP and TMS tables dropped - ready for fresh start';
