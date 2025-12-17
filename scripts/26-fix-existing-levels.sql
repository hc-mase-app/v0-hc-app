-- Script to fix all existing records with incorrect level values
-- This script will re-derive level from jabatan for all records

-- Update all records to derive level from jabatan
UPDATE karyawan 
SET level = CASE 
  WHEN UPPER(jabatan) IN ('GM', 'GENERAL MANAGER') THEN 1
  WHEN UPPER(jabatan) = 'MANAGER' THEN 2
  WHEN UPPER(jabatan) = 'PJO' THEN 3
  WHEN UPPER(jabatan) IN ('DEPUTY PJO', 'DEPUTY', 'DPJO') THEN 4
  WHEN UPPER(jabatan) = 'HEAD' THEN 5
  WHEN UPPER(jabatan) IN ('SPV', 'SUPERVISOR') THEN 6
  WHEN UPPER(jabatan) IN ('GL', 'GROUP LEADER') THEN 7
  WHEN UPPER(jabatan) = 'OFFICER' THEN 7
  WHEN UPPER(jabatan) = 'ADMIN' THEN 8
  WHEN UPPER(jabatan) IN ('STAFF', 'TEKNISI', 'PLANNER') THEN 8
  WHEN UPPER(jabatan) IN ('OPERATOR', 'OP') THEN 9
  WHEN UPPER(jabatan) LIKE '%DRIVER%' THEN 10
  WHEN UPPER(jabatan) IN ('MEKANIK', 'MECHANIC') THEN 11
  WHEN UPPER(jabatan) = 'HELPER' THEN 12
  WHEN UPPER(jabatan) LIKE '%HOUSE%KEEPING%' OR UPPER(jabatan) = 'HK' THEN 12
  ELSE 99
END;

-- Show summary of level distribution
SELECT 
  level,
  CASE 
    WHEN level = 1 THEN 'General Manager'
    WHEN level = 2 THEN 'Manager'
    WHEN level = 3 THEN 'PJO'
    WHEN level = 4 THEN 'Deputy PJO'
    WHEN level = 5 THEN 'Head'
    WHEN level = 6 THEN 'Supervisor'
    WHEN level = 7 THEN 'Group Leader/Officer'
    WHEN level = 8 THEN 'Admin/Staff'
    WHEN level = 9 THEN 'Operator'
    WHEN level = 10 THEN 'Driver'
    WHEN level = 11 THEN 'Mekanik'
    WHEN level = 12 THEN 'Helper'
    ELSE 'Unknown'
  END as level_name,
  COUNT(*) as jumlah,
  STRING_AGG(DISTINCT jabatan, ', ') as jabatan_list
FROM karyawan
GROUP BY level
ORDER BY level;
