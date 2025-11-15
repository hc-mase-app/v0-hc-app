-- =====================================================
-- Script untuk Menghapus History Assessment Saja
-- =====================================================
-- PERINGATAN: Script ini akan menghapus SEMUA assessment
-- Pastikan Anda sudah backup database sebelum menjalankan!
-- =====================================================

-- 1. Hapus approval history untuk assessments
DELETE FROM approval_history 
WHERE request_type = 'assessment';

-- 2. Hapus assessment approvals
DELETE FROM assessment_approvals;

-- 3. Hapus semua assessments
DELETE FROM assessments;

-- Reset sequences (optional)
-- ALTER SEQUENCE assessments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE assessment_approvals_id_seq RESTART WITH 1;

-- Verifikasi hasil
SELECT 'Assessments' as table_name, COUNT(*) as remaining_records FROM assessments
UNION ALL
SELECT 'Assessment Approvals', COUNT(*) FROM assessment_approvals
UNION ALL
SELECT 'Assessment Approval History', COUNT(*) FROM approval_history WHERE request_type = 'assessment';
