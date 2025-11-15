-- Script untuk menghapus semua data leave requests
-- PERINGATAN: Script ini akan menghapus SEMUA data pengajuan cuti!
-- Gunakan dengan hati-hati!

-- Hapus semua approval history terlebih dahulu (karena ada foreign key constraint)
DELETE FROM approval_history;

-- Hapus semua leave requests
DELETE FROM leave_requests;

-- Reset sequence jika menggunakan auto-increment (opsional)
-- ALTER SEQUENCE leave_requests_id_seq RESTART WITH 1;

-- Verifikasi bahwa data sudah terhapus
SELECT COUNT(*) as total_leave_requests FROM leave_requests;
SELECT COUNT(*) as total_approval_history FROM approval_history;

-- Tampilkan struktur tabel untuk memastikan kolom yang diperlukan ada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leave_requests'
AND column_name IN ('lama_onsite', 'nama_pesawat', 'jam_keberangkatan', 'booking_code')
ORDER BY column_name;
