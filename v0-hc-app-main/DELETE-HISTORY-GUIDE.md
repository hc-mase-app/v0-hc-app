# Panduan Menghapus History Pengajuan

## ⚠️ PERINGATAN PENTING
**BACKUP DATABASE TERLEBIH DAHULU SEBELUM MENJALANKAN SCRIPT INI!**

Script ini akan menghapus data secara permanen dan tidak dapat di-undo.

## Script yang Tersedia

### 1. `scripts/15-delete-all-history.sql`
Menghapus **SEMUA** history pengajuan (cuti dan assessment)

**Menghapus:**
- Semua pengajuan cuti
- Semua assessment karyawan
- Semua approval history
- Semua assessment approvals

### 2. `scripts/16-delete-leave-requests-only.sql`
Menghapus **HANYA** history pengajuan cuti

**Menghapus:**
- Semua pengajuan cuti
- Approval history untuk cuti

**Tidak menghapus:**
- Assessment karyawan tetap ada

### 3. `scripts/17-delete-assessments-only.sql`
Menghapus **HANYA** history assessment

**Menghapus:**
- Semua assessment karyawan
- Semua assessment approvals
- Approval history untuk assessment

**Tidak menghapus:**
- Pengajuan cuti tetap ada

## Cara Menjalankan

### Di v0 Interface:
1. Buka file script yang ingin dijalankan
2. Klik tombol "Run" di pojok kanan atas
3. Tunggu hingga selesai
4. Cek hasil verifikasi di output

### Via Command Line:
\`\`\`bash
# Untuk menghapus semua history
psql $DATABASE_URL -f scripts/15-delete-all-history.sql

# Untuk menghapus cuti saja
psql $DATABASE_URL -f scripts/16-delete-leave-requests-only.sql

# Untuk menghapus assessment saja
psql $DATABASE_URL -f scripts/17-delete-assessments-only.sql
\`\`\`

## Reset ID Counter (Optional)

Jika Anda ingin reset ID counter agar mulai dari 1 lagi, uncomment baris berikut di script:

\`\`\`sql
ALTER SEQUENCE leave_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE assessments_id_seq RESTART WITH 1;
\`\`\`

## Verifikasi Setelah Penghapusan

Setiap script akan menampilkan jumlah record yang tersisa di setiap tabel.
Pastikan semua menunjukkan 0 untuk tabel yang ingin dihapus.

## Rollback

**TIDAK ADA ROLLBACK!** Data yang sudah dihapus tidak bisa dikembalikan.
Pastikan Anda sudah backup database sebelum menjalankan script.

## Backup Database

Sebelum menjalankan script, backup database dengan:

\`\`\`bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
\`\`\`

Atau gunakan Neon dashboard untuk membuat snapshot.
