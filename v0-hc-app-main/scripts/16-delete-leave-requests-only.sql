-- =====================================================
-- Script untuk Menghapus History Pengajuan Cuti Saja
-- =====================================================
-- PERINGATAN: Script ini akan menghapus SEMUA pengajuan cuti
-- Pastikan Anda sudah backup database sebelum menjalankan!
-- =====================================================

-- 1. Hapus approval history untuk leave requests
DELETE FROM approval_history 
WHERE request_type = 'leave';

-- 2. Hapus semua leave requests
DELETE FROM leave_requests;

-- Reset sequence (optional)
-- ALTER SEQUENCE leave_requests_id_seq RESTART WITH 1;

-- Verifikasi hasil
SELECT 'Leave Requests' as table_name, COUNT(*) as remaining_records FROM leave_requests
UNION ALL
SELECT 'Leave Approval History', COUNT(*) FROM approval_history WHERE request_type = 'leave';
