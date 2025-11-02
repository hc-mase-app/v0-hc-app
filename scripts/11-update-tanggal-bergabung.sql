-- Script untuk menambahkan/update Tanggal Bergabung (Join Date) untuk users yang sudah ada
-- Kolom tanggal_bergabung sudah ada di database, script ini untuk mengisi data

-- ============================================
-- CARA 1: Update semua users dengan tanggal contoh
-- ============================================
-- Uncomment baris di bawah untuk update semua users dengan tanggal yang sama
-- UPDATE users SET tanggal_bergabung = '2020-01-01' WHERE tanggal_bergabung IS NULL;

-- ============================================
-- CARA 2: Update per NIK (Recommended)
-- ============================================
-- Ganti NIK dan tanggal sesuai data karyawan Anda
-- Format tanggal: 'YYYY-MM-DD' (contoh: '2020-01-15')

-- Contoh update untuk beberapa NIK:
UPDATE users SET tanggal_bergabung = '2020-01-15' WHERE nik = '1240101198';
UPDATE users SET tanggal_bergabung = '2019-06-01' WHERE nik = '2230100729';
UPDATE users SET tanggal_bergabung = '2021-03-10' WHERE nik = '3210100456';

-- ============================================
-- CARA 3: Update berdasarkan departemen
-- ============================================
-- Jika ingin set tanggal default berdasarkan departemen
-- UPDATE users SET tanggal_bergabung = '2020-01-01' 
-- WHERE departemen = 'Production' AND tanggal_bergabung IS NULL;

-- ============================================
-- CARA 4: Set tanggal_bergabung = created_at untuk users lama
-- ============================================
-- Jika tidak ada data pasti, gunakan tanggal created_at sebagai fallback
-- UPDATE users SET tanggal_bergabung = DATE(created_at) 
-- WHERE tanggal_bergabung IS NULL;

-- ============================================
-- VERIFIKASI: Cek users yang belum ada tanggal_bergabung
-- ============================================
SELECT nik, name, departemen, site, tanggal_bergabung 
FROM users 
WHERE tanggal_bergabung IS NULL
ORDER BY name;

-- ============================================
-- VERIFIKASI: Cek semua users dengan tanggal_bergabung
-- ============================================
SELECT nik, name, departemen, site, tanggal_bergabung 
FROM users 
ORDER BY tanggal_bergabung DESC;
