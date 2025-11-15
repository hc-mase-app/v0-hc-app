-- Check if assessment for NIK 1240101198 actually exists
SELECT 
  id,
  employee_nik,
  employee_name,
  created_by_nik,
  created_by_name,
  created_by_role,
  status,
  created_at
FROM employee_assessments
WHERE employee_nik = '1240101198'
ORDER BY created_at DESC;

-- Count all assessments by DIC Leonardo Sitorus (1230700773)
SELECT 
  COUNT(*) as total_assessments,
  status,
  created_by_role
FROM employee_assessments
WHERE created_by_nik = '1230700773'
GROUP BY status, created_by_role;

-- Count all workflows created by DIC Leonardo Sitorus (1230700773)
SELECT 
  COUNT(*) as total_workflows,
  status,
  created_by_role
FROM workflows
WHERE created_by_nik = '1230700773'
GROUP BY status, created_by_role;
