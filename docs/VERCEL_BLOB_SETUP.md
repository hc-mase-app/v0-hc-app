# Panduan Setup Vercel Blob Storage

Vercel Blob adalah solusi storage paling mudah untuk aplikasi ini. Gratis 10GB storage dan 100GB bandwidth per bulan.

## Langkah-langkah Setup (2 Menit)

### 1. Deploy Aplikasi ke Vercel (Jika Belum)

\`\`\`bash
# Install Vercel CLI (jika belum)
npm i -g vercel

# Deploy
vercel
\`\`\`

### 2. Buat Blob Storage di Vercel Dashboard

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project Anda (HCapp)
3. Klik tab **Storage**
4. Klik tombol **Create Database**
5. Pilih **Blob**
6. Beri nama: `evidence-storage` (atau nama lain sesuka Anda)
7. Klik **Create**

**Otomatis terbuat:**
- Environment variable `BLOB_READ_WRITE_TOKEN` sudah otomatis ditambahkan
- Token sudah dikonfigurasi untuk semua environments (Production, Preview, Development)

### 3. Set Storage Provider (PENTING!)

Tambahkan environment variable di Vercel:

1. Di Vercel Dashboard, buka project Anda
2. Pergi ke **Settings** > **Environment Variables**
3. Klik **Add New**
4. Isi:
   - **Key**: `STORAGE_PROVIDER`
   - **Value**: `vercel-blob`
   - **Environments**: Centang semua (Production, Preview, Development)
5. Klik **Save**

### 4. Redeploy Aplikasi

Setelah menambahkan environment variable, redeploy aplikasi:

1. Klik tab **Deployments**
2. Klik tombol titik tiga (`...`) di deployment terbaru
3. Pilih **Redeploy**
4. Tunggu hingga selesai

### 5. Test Upload

1. Login ke aplikasi
2. Pergi ke menu TMS > Leadership Evidence
3. Klik **Upload Evidence**
4. Pilih file, subordinate, activity type, dan tanggal
5. Klik **Upload Evidence**
6. File akan tersimpan di Vercel Blob

## File yang Akan Tersimpan

Struktur folder di Vercel Blob:

\`\`\`
/{SITE}/{DEPARTEMEN}/{YYYY-MM}/EVD-{YYYYMM}-{XXXX}_{NIK}_{filename}

Contoh:
/JAKARTA/IT/2025-01/EVD-202501-1234_EMP001_meeting_evidence.pdf
/SURABAYA/HR/2025-01/EVD-202501-5678_EMP002_coaching_photo.jpg
\`\`\`

## Akses File yang Diupload

Setiap file akan mendapat URL public yang bisa diakses:

\`\`\`
https://[random-id].public.blob.vercel-storage.com/[path-to-file]
\`\`\`

URL ini disimpan di database kolom `gdrive_file_url` dan bisa digunakan untuk:
- Menampilkan file di aplikasi
- Download file
- Share link ke pihak lain

## Troubleshooting

### Error: "BLOB_READ_WRITE_TOKEN is not set"

**Solusi:**
1. Pastikan Blob Storage sudah dibuat di Vercel Dashboard
2. Token seharusnya otomatis dibuat
3. Jika tidak ada, hapus dan buat ulang Blob Storage
4. Redeploy aplikasi

### Error: "Failed to upload to Vercel Blob"

**Solusi:**
1. Pastikan `STORAGE_PROVIDER=vercel-blob` sudah diset
2. Cek ukuran file tidak melebihi 500MB (limit Vercel Blob)
3. Cek koneksi internet
4. Lihat logs di Vercel Dashboard untuk detail error

### Upload Lambat

**Penyebab:**
- File terlalu besar
- Koneksi internet lambat

**Solusi:**
- Kompres file sebelum upload (gunakan tools online untuk compress PDF/image)
- Pastikan ukuran file di bawah 5MB untuk performa optimal

## Local Development

Untuk test di local (localhost):

1. Copy environment variables dari Vercel:
   \`\`\`bash
   vercel env pull .env.local
   \`\`\`

2. Atau manual tambahkan ke `.env.local`:
   \`\`\`env
   STORAGE_PROVIDER=vercel-blob
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
   \`\`\`

3. Jalankan development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Migrasi dari R2 ke Vercel Blob

Jika Anda sebelumnya menggunakan Cloudflare R2:

1. File lama di R2 tetap bisa diakses (tidak perlu migrasi)
2. Upload baru akan otomatis ke Vercel Blob
3. Database menyimpan URL lengkap, jadi aplikasi tetap bisa akses file lama dari R2

Tidak ada action yang perlu dilakukan untuk file yang sudah ada.

## Quota dan Limits

**Free Tier Vercel Blob:**
- Storage: 10GB
- Bandwidth: 100GB/bulan
- File size max: 500MB per file
- Requests: Unlimited

**Untuk aplikasi evidence management, ini lebih dari cukup untuk:**
- 10,000+ file dokumen PDF (rata-rata 1MB)
- Atau 50,000+ foto (rata-rata 200KB)

## Keamanan

- File bersifat public (siapa saja dengan URL bisa akses)
- Jika perlu private files, bisa tambahkan authentication layer
- URL mengandung random string yang sulit ditebak

## Support

Jika ada masalah:
1. Cek Vercel Dashboard > Logs untuk error details
2. Lihat browser console (F12) untuk error di frontend
3. Buka GitHub issues atau hubungi tim development
