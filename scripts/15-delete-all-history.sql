-- =====================================================
-- Script untuk Menghapus Semua History Pengajuan
-- =====================================================
-- PERINGATAN: Script ini akan menghapus SEMUA data pengajuan
-- Pastikan Anda sudah backup database sebelum menjalankan!
-- =====================================================

-- 1. Hapus semua approval history untuk leave requests
DELETE FROM approval_history 
WHERE request_type = 'leave';

-- 2. Hapus semua leave requests
DELETE FROM leave_requests;

-- 3. Hapus semua approval history untuk assessments
DELETE FROM approval_history 
WHERE request_type = 'assessment';

-- 4. Hapus semua assessment approvals
DELETE FROM assessment_approvals;

-- 5. Hapus semua assessments
DELETE FROM assessments;

-- Reset sequences (optional - untuk reset ID counter)
-- ALTER SEQUENCE leave_requests_id_seq RESTART WITH 1;
-- ALTER SEQUENCE assessments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE approval_history_id_seq RESTART WITH 1;

-- Verifikasi hasil
SELECT 'Leave Requests' as table_name, COUNT(*) as remaining_records FROM leave_requests
UNION ALL
SELECT 'Assessments', COUNT(*) FROM assessments
UNION ALL
SELECT 'Assessment Approvals', COUNT(*) FROM assessment_approvals
UNION ALL
SELECT 'Approval History', COUNT(*) FROM approval_history;
