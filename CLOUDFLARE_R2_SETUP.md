# Cloudflare R2 Setup Guide untuk HCGA IMS

Panduan lengkap untuk mengkonfigurasi Cloudflare R2 sebagai document storage untuk HCGA Integrated Management System.

## 1. Environment Variables

Tambahkan environment variables berikut ke project Vercel Anda (melalui sidebar **Vars** di v0):

\`\`\`env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_BUCKET_NAME=hcga-ims-documents
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
\`\`\`

## 2. Cara Mendapatkan Credentials

### Step 1: Login ke Cloudflare Dashboard
1. Buka https://dash.cloudflare.com
2. Login dengan akun Cloudflare Anda

### Step 2: Buat R2 Bucket
1. Di sidebar, klik **R2**
2. Klik **Create bucket**
3. Nama bucket: `hcga-ims-documents`
4. Location: **Automatic** (recommended)
5. Klik **Create bucket**

### Step 3: Enable Public Access
1. Masuk ke bucket yang baru dibuat
2. Klik tab **Settings**
3. Scroll ke section **Public Access**
4. Klik **Allow Access** atau **Connect Domain**
5. Aktifkan **Public Development URL** (untuk testing/development)
6. Copy Public URL yang diberikan (format: `https://pub-xxxxx.r2.dev`)

**Public URL Anda:** `https://pub-1dce790269ec4d33ad6a101fbac473d2.r2.dev` ✅

### Step 4: Dapatkan Account ID
1. Lihat di URL browser setelah login: `https://dash.cloudflare.com/[ACCOUNT_ID]/r2`
2. Copy **ACCOUNT_ID** tersebut

### Step 5: Buat API Token (Access Key)
1. Di halaman R2, klik **Manage R2 API Tokens**
2. Klik **Create API token**
3. Pilih **Account API Token** (recommended)
4. Token name: `R2 Account Token`
5. Permissions: **Admin Read & Write**
6. Applied to: **All buckets**
7. Klik **Create API Token**
8. **PENTING**: Copy dan simpan:
   - Access Key ID
   - Secret Access Key
   (Hanya ditampilkan sekali!)

## 3. Setup Selesai! Cara Kerja Sistem

### Auto-Scan Documents (TANPA metadata.json)

Sistem sudah dikonfigurasi untuk **otomatis scan** semua file PDF di R2 bucket menggunakan S3-compatible API. Anda **TIDAK PERLU** membuat file `metadata.json` manual!

**Cara Kerja:**
1. Upload file PDF ke folder kategori di R2 (misal: `sk/dokumen-001.pdf`)
2. Sistem otomatis detect semua file PDF dalam folder tersebut
3. File langsung muncul di aplikasi tanpa perlu konfigurasi tambahan

### Struktur Folder di R2 Bucket

Upload dokumen Anda dengan struktur folder berikut:

\`\`\`
hcga-ims-documents/
├── sk/
│   ├── SK-001-Kebijakan.pdf
│   └── SK-002-Prosedur.pdf
├── form/
│   ├── Form-Cuti.pdf
│   └── Form-Reimbursement.pdf
├── sop-ik/
│   ├── SOP-Quality-Manual.pdf
│   └── IK-Pengadaan.pdf
├── sop-sdm/
│   ├── SOP-Recruitment.pdf
│   └── SOP-Training.pdf
├── internal-memo/
│   ├── Memo-012025.pdf
│   └── Memo-022025.pdf
└── work-instruction/
    ├── WI-Production.pdf
    └── WI-Maintenance.pdf
\`\`\`

**Catatan Penting:**
- Hanya file dengan ekstensi `.pdf` yang akan muncul
- Nama file akan otomatis diformat menjadi judul dokumen (hapus ekstensi, replace dash dengan spasi)
- File size dan upload date otomatis terdeteksi

## 4. Cara Upload Dokumen ke R2

### Opsi A: Menggunakan Cloudflare Dashboard (Paling Mudah)
1. Buka bucket `hcga-ims-documents` di Cloudflare Dashboard
2. Klik **Upload**
3. Pilih folder tujuan (misal: `sk/`) atau buat folder baru
4. Drag & drop file PDF Anda
5. Klik **Upload**
6. **Selesai!** File langsung bisa diakses di aplikasi

### Opsi B: Menggunakan Rclone (Untuk Bulk Upload)

#### Install Rclone
\`\`\`bash
# macOS
brew install rclone

# Windows - Download dari https://rclone.org/downloads/

# Linux
curl https://rclone.org/install.sh | sudo bash
\`\`\`

#### Konfigurasi Rclone
\`\`\`bash
rclone config
\`\`\`

Ikuti prompt:
- `n` untuk New remote
- Name: `cloudflare`
- Storage: `s3`
- Provider: `Cloudflare`
- Access Key ID: [paste dari Step 5]
- Secret Access Key: [paste dari Step 5]
- Region: (kosongkan, tekan Enter)
- Endpoint: `https://[ACCOUNT_ID].r2.cloudflarestorage.com`
- Location constraint: (kosongkan)
- ACL: (kosongkan)
- Konfirmasi: `y`

#### Upload Folder
\`\`\`bash
# Upload semua dokumen dari folder lokal
rclone sync /path/to/local/documents cloudflare:hcga-ims-documents

# Contoh: Upload folder SK saja
rclone copy /path/to/sk-documents cloudflare:hcga-ims-documents/sk
\`\`\`

### Opsi C: Menggunakan AWS CLI (S3-Compatible)
\`\`\`bash
# Install AWS CLI: https://aws.amazon.com/cli/

# Configure
aws configure set aws_access_key_id [ACCESS_KEY_ID]
aws configure set aws_secret_access_key [SECRET_ACCESS_KEY]

# Upload file
aws s3 cp document.pdf s3://hcga-ims-documents/sk/document.pdf \
  --endpoint-url https://[ACCOUNT_ID].r2.cloudflarestorage.com
\`\`\`

## 5. Testing

Setelah setup dan upload dokumen:

1. Pastikan semua environment variables sudah ditambahkan
2. Deploy atau restart aplikasi
3. Buka aplikasi dan klik card **HCGA Integrated Management System**
4. Pilih salah satu kategori (misal: SK)
5. **Dokumen Anda akan muncul otomatis!**
6. Klik dokumen untuk preview (PDF viewer) atau download

## 6. Troubleshooting

### Tidak ada dokumen yang muncul
**Solusi:**
- Pastikan file format `.pdf` (bukan `.docx` atau format lain)
- Cek nama folder sudah benar (lowercase, gunakan dash): `sk`, `form`, `sop-ik`
- Pastikan environment variables sudah diisi dan aplikasi sudah restart
- Cek R2 Dashboard apakah file sudah ter-upload

### Error: "R2 credentials not configured"
**Solusi:**
- Pastikan semua 4 environment variables sudah ditambahkan
- Restart aplikasi setelah menambahkan env vars
- Cek API Token masih valid (tidak expired)

### Error: "Failed to fetch documents"
**Solusi:**
- Cek API Token permissions: harus **Admin Read & Write**
- Pastikan Token applied to **All buckets**
- Cek nama bucket sudah benar di env vars

### PDF tidak bisa di-preview
**Solusi:**
- Beberapa browser memblokir iframe dari sumber external
- Gunakan tombol "Buka Tab Baru" atau "Download"
- Pastikan Public Access sudah aktif di R2 bucket

### File di R2 tapi tidak muncul di app
**Solusi:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R atau Cmd+Shift+R)
- Cek console log untuk error messages

## 7. Migrasi dari Google Drive

### Step-by-step:
1. Download semua file dari Google Drive ke komputer lokal
2. Organisir ke dalam folder sesuai kategori (sk, form, sop-ik, dll)
3. Convert semua dokumen ke PDF jika belum (Word, Excel → PDF)
4. Upload ke R2 menggunakan metode di atas (Dashboard/Rclone/AWS CLI)
5. Test di aplikasi - dokumen akan otomatis muncul
6. Jika sudah berjalan lancar, hapus Google Drive links

## 8. Keuntungan Sistem Baru

1. **User tidak keluar dari aplikasi** - Semua dibuka dalam modal
2. **Auto-scan** - Tidak perlu maintain metadata.json manual
3. **Fast loading** - CDN global Cloudflare
4. **Easy management** - Upload via dashboard, langsung live
5. **Version control** - Ganti file dengan nama sama untuk update
6. **Cost effective** - R2 lebih murah dari Google Drive API

## 9. Tips & Best Practices

### Naming Convention untuk File
\`\`\`
✅ Good: SK-001-Kebijakan-Cuti.pdf
✅ Good: Form-Reimbursement-2025.pdf
✅ Good: SOP-Quality-Manual-v2.pdf

❌ Bad: dokumen tanpa judul.pdf
❌ Bad: file (1).pdf
❌ Bad: DOKUMEN PENTING!!!.pdf
\`\`\`

### Organizing Documents
- Gunakan prefix untuk grouping: `SK-001`, `SK-002`
- Tambahkan tahun jika perlu: `Form-Cuti-2025.pdf`
- Gunakan version jika ada update: `SOP-v1.pdf`, `SOP-v2.pdf`

### Update Dokumen
- Upload file baru dengan nama yang sama untuk replace
- R2 akan overwrite otomatis
- Aplikasi akan show dokumen terbaru

---

**Setup Complete!** Aplikasi sekarang tidak redirect ke Google Drive lagi. Semua dokumen dibuka langsung dalam aplikasi dengan PDF viewer yang smooth dan fast loading dari Cloudflare CDN.
