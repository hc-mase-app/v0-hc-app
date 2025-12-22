# Setup Google Drive Service Account untuk TMS

Sistem TMS menggunakan Google Drive API untuk menyimpan file evidence aktivitas kepemimpinan.

## Prerequisites

1. Google Account dengan akses ke Google Cloud Console
2. Google Drive folder untuk menyimpan evidence files

## Langkah Setup

### 1. Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Catat Project ID

### 2. Enable Google Drive API

1. Di Google Cloud Console, buka **APIs & Services** > **Library**
2. Cari "Google Drive API"
3. Klik **Enable**

### 3. Buat Service Account

1. Buka **APIs & Services** > **Credentials**
2. Klik **Create Credentials** > **Service Account**
3. Isi nama service account (contoh: `tms-evidence-uploader`)
4. Klik **Create and Continue**
5. Skip role assignment (opsional)
6. Klik **Done**

### 4. Generate Private Key

1. Klik service account yang baru dibuat
2. Buka tab **Keys**
3. Klik **Add Key** > **Create New Key**
4. Pilih format **JSON**
5. Download file JSON (simpan dengan aman)

### 5. Buat Folder di Google Drive

1. Buka Google Drive
2. Buat folder baru (contoh: `TMS Evidence`)
3. Klik kanan folder > **Share**
4. Share ke email service account (dari langkah 3) dengan role **Editor**
5. Copy Folder ID dari URL (contoh: `https://drive.google.com/drive/folders/[FOLDER_ID]`)

### 6. Setup Environment Variables

Tambahkan environment variables berikut di Vercel atau file `.env.local`:

\`\`\`env
# Google Drive Service Account
GOOGLE_DRIVE_CLIENT_EMAIL=tms-evidence-uploader@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
\`\`\`

**Catatan:**
- `GOOGLE_DRIVE_CLIENT_EMAIL`: Ambil dari file JSON di field `client_email`
- `GOOGLE_DRIVE_PRIVATE_KEY`: Ambil dari file JSON di field `private_key` (pastikan termasuk `\n`)
- `GOOGLE_DRIVE_FOLDER_ID`: ID folder dari langkah 5

### 7. Verifikasi Setup

1. Jalankan aplikasi
2. Coba upload evidence dari halaman `/tms/evidence`
3. Cek folder Google Drive untuk memastikan file terupload
4. Struktur folder otomatis: `Site/Departemen/Bulan-Tahun`

## Troubleshooting

### Error: "Google Drive credentials not configured"
- Pastikan environment variables sudah diset dengan benar
- Restart aplikasi setelah menambah environment variables

### Error: "Failed to get access token"
- Periksa format `GOOGLE_DRIVE_PRIVATE_KEY` (harus termasuk `\n`)
- Pastikan Service Account masih aktif di Google Cloud Console

### Error: "Permission denied"
- Pastikan Service Account email sudah di-share ke folder Google Drive
- Pastikan role nya adalah **Editor** bukan **Viewer**

### File tidak muncul di folder
- Periksa `GOOGLE_DRIVE_FOLDER_ID` sudah benar
- Pastikan folder structure (Site/Dept/Month) dibuat dengan benar

## Struktur Folder Evidence

\`\`\`
TMS Evidence (Root Folder)
├── WBN
│   ├── HCGA
│   │   ├── Januari-2025
│   │   ├── Februari-2025
│   │   └── ...
│   ├── OPERATION
│   └── ...
├── HSM
│   ├── PRODUKSI
│   └── ...
└── ...
\`\`\`

## Security Notes

- Private key harus disimpan dengan aman (jangan commit ke git)
- Gunakan environment variables untuk production
- Service Account hanya punya akses ke folder yang di-share
- File evidence di Google Drive bersifat read-only untuk publik (anyone with link can view)
