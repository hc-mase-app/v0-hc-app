# ARCHIVED: Cara Menjalankan Migration untuk Subfolder

**Status:** ARCHIVED - Migration ini sudah selesai dijalankan
**Tanggal Archive:** Januari 2025

---

## Langkah-langkah (Untuk Referensi Historis):

### 1. Buka Neon Console
- Pergi ke https://console.neon.tech
- Pilih project HCGA IMS Anda
- Klik tab **SQL Editor**

### 2. Copy-Paste SQL Script
- Buka file `scripts/003_add_subfolder_column.sql`
- Copy seluruh isi file (semua baris dari awal sampai akhir)
- Paste ke Neon SQL Editor

### 3. Jalankan Script
- Klik tombol **Run** atau tekan `Ctrl+Enter`
- Tunggu sampai selesai (biasanya < 1 detik)
- Pastikan ada pesan success tanpa error

### 4. Verifikasi
Script akan otomatis menampilkan struktur kolom table `documents`. 
Pastikan kolom `subfolder` muncul dalam hasil query dengan data type `character varying`.

### 5. Test di Aplikasi
- Refresh aplikasi HCGA IMS
- Buka kategori yang punya subfolder (misal: SOP-IK)
- Seharusnya sudah bisa berfungsi tanpa error
- Pilih subfolder (misal: PT SSS atau PT GSM)
- Dokumen akan difilter berdasarkan subfolder

## Catatan:
- Migration ini **AMAN** karena menggunakan check `IF NOT EXISTS`
- Jika sudah pernah dijalankan, tidak akan error atau duplikat
- Existing data tidak akan hilang atau berubah
- Kolom subfolder nullable, jadi dokumen tanpa subfolder tetap valid
- Index otomatis dibuat untuk performa query yang lebih cepat

## Troubleshooting:
Jika masih error setelah migration:
1. Pastikan migration berhasil dijalankan (cek hasil query verifikasi)
2. Refresh browser dengan hard reload (Ctrl+Shift+R)
3. Clear cache browser jika perlu

---

**File ini telah diarsipkan dan dipindahkan ke `/docs/archive/` untuk referensi historis.**

Untuk informasi terkini tentang project, lihat:
- `/docs/PROJECT-ANALYSIS.md`
- `/docs/setup/DATABASE-SETUP.md`
\`\`\`

\`\`\`md file="CARA_JALANKAN_MIGRATION.md" isDeleted="true"
...deleted...
