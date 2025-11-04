-- Hapus semua pengajuan cuti
DELETE FROM approval_history WHERE request_type = 'leave';
DELETE FROM leave_requests;

-- Cek hasil
SELECT COUNT(*) as total_leave_requests FROM leave_requests;
