-- Query untuk menemukan siapa yang membuat assessment untuk NIK 1240101198
-- Run this script di Neon database Anda

SELECT 
  id,
  employee_nik,
  employee_name,
  created_by_nik,
  created_by_name,
  created_by_role,
  status,
  total_score,
  grade,
  created_at,
  updated_at
FROM employee_assessments
WHERE employee_nik = '1240101198'
ORDER BY created_at DESC;

-- Jika ingin melihat detail approval history juga:
SELECT 
  aa.id,
  aa.assessment_id,
  aa.approver_nik,
  aa.approver_name,
  aa.approver_role,
  aa.action,
  aa.notes,
  aa.created_at as approval_timestamp,
  ea.employee_nik,
  ea.employee_name,
  ea.created_by_name as assessment_creator
FROM assessment_approvals aa
LEFT JOIN employee_assessments ea ON aa.assessment_id = ea.id
WHERE ea.employee_nik = '1240101198'
ORDER BY aa.created_at ASC;
