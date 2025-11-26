-- ============================================
-- Script: Menambahkan Role Manager HO
-- ============================================
-- Database menggunakan VARCHAR untuk role dan status,
-- sehingga TIDAK perlu ALTER TABLE untuk enum.
-- Script ini hanya menambahkan user Manager HO.
--
-- Status baru yang didukung untuk approval PJO:
-- - pending_manager_ho : Menunggu approval Manager HO
-- - ditolak_manager_ho : Ditolak oleh Manager HO
-- 
-- Alur Approval untuk Cuti PJO:
-- Admin Submit (role pjo_site) 
--   → pending_manager_ho 
--   → Manager HO Approve 
--   → pending_hr_ho 
--   → HR HO Approve 
--   → di_proses
-- ============================================

-- Fixed field name from 'name' to 'nama' to match database schema
INSERT INTO users (
  nik, 
  nama, 
  email, 
  password, 
  role, 
  site, 
  jabatan, 
  departemen, 
  poh, 
  status_karyawan, 
  no_ktp, 
  no_telp, 
  tanggal_bergabung
) VALUES (
  'MGRHO001',
  'Bambang Sutrisno',
  'bambang@3s-gsm.com',
  'password123',
  'manager_ho',
  'Head Office',
  'Manager',
  'HCGA',
  'POH007',
  'Tetap',
  '3201234567890130',
  '081234567897',
  '2016-04-01'
) ON CONFLICT (nik) DO UPDATE SET
  role = 'manager_ho',
  nama = 'Bambang Sutrisno',
  jabatan = 'Manager';
