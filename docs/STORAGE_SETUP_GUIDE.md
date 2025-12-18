# Storage Setup Guide

## Opsi 1: Cloudflare R2 (RECOMMENDED)

**Kelebihan:**
- ✅ Gratis 10GB storage
- ✅ Unlimited bandwidth (no egress fees)
- ✅ S3-compatible API
- ✅ Global CDN

**Setup Steps:**

1. Buat akun Cloudflare (gratis): https://dash.cloudflare.com
2. Buka R2 Object Storage di dashboard
3. Create Bucket (nama: `tms-evidence` atau sesuai keinginan)
4. Create API Token:
   - Permissions: Object Read & Write
   - Copy Account ID, Access Key ID, Secret Access Key
5. Tambahkan ke Vercel Environment Variables:
   ```
   R2_ACCOUNT_ID=xxx
   R2_ACCESS_KEY_ID=xxx
   R2_SECRET_ACCESS_KEY=xxx
   R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
   R2_BUCKET_NAME=tms-evidence
   R2_PUBLIC_URL=https://pub-xxx.r2.dev
   ```
6. Set storage provider:
   ```
   STORAGE_PROVIDER=r2
   ```

---

## Opsi 2: Google Drive API (Personal Account - GRATIS)

**Kelebihan:**
- ✅ Gratis 15GB storage
- ✅ Tidak perlu Google Workspace
- ✅ File langsung bisa dilihat di Google Drive
- ✅ Bisa pakai akun Gmail pribadi

**Setup Steps:**

### A. Setup Google Cloud Project

1. Buka Google Cloud Console: https://console.cloud.google.com
2. Create New Project (nama: `TMS Evidence Upload`)
3. Enable Google Drive API:
   - Menu → APIs & Services → Library
   - Cari "Google Drive API"
   - Click Enable

### B. Create OAuth 2.0 Credentials

1. APIs & Services → Credentials
2. Click "Create Credentials" → OAuth client ID
3. Application type: Web application
4. Name: `TMS Evidence Uploader`
5. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   https://yourdomain.vercel.app/api/auth/google/callback
   ```
6. Save dan copy:
   - Client ID
   - Client Secret

### C. Get Refresh Token

1. Buka OAuth 2.0 Playground: https://developers.google.com/oauthplayground
2. Settings (⚙️) → Use your own OAuth credentials
3. Masukkan Client ID dan Client Secret
4. Left panel: Pilih "Drive API v3" → https://www.googleapis.com/auth/drive.file
5. Click "Authorize APIs"
6. Login dengan akun Gmail Anda
7. Click "Exchange authorization code for tokens"
8. Copy **Refresh Token**

### D. Setup Environment Variables

Tambahkan ke Vercel:
```
STORAGE_PROVIDER=google-drive
GOOGLE_DRIVE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=xxx
GOOGLE_DRIVE_REFRESH_TOKEN=xxx
GOOGLE_DRIVE_FOLDER_ID=xxx (optional - ID folder khusus di Drive)
```

### E. Get Folder ID (Optional)

1. Buka Google Drive
2. Create folder baru: "TMS Evidence"
3. Open folder
4. Copy ID dari URL: `https://drive.google.com/drive/folders/[FOLDER_ID]`

---

## Opsi 3: Vercel Blob (EASIEST)

**Kelebihan:**
- ✅ Gratis 10GB storage
- ✅ Setup paling mudah (1 klik)
- ✅ Terintegrasi sempurna dengan Vercel
- ✅ CDN otomatis

**Setup Steps:**

1. Buka Vercel Project Dashboard
2. Storage → Create Database → Blob
3. Connect to Project
4. Vercel otomatis generate `BLOB_READ_WRITE_TOKEN`
5. Set storage provider:
   ```
   STORAGE_PROVIDER=vercel-blob
   ```
6. Done! Tidak ada setup tambahan.

---

## Switching Between Providers

Cukup ubah environment variable `STORAGE_PROVIDER`:

- `STORAGE_PROVIDER=r2` → Cloudflare R2
- `STORAGE_PROVIDER=google-drive` → Google Drive
- `STORAGE_PROVIDER=vercel-blob` → Vercel Blob

Aplikasi akan otomatis menggunakan provider yang dipilih tanpa perlu ubah kode!

---

## Perbandingan

| Feature | R2 | Google Drive | Vercel Blob |
|---------|----|--------------| ------------|
| Free Storage | 10GB | 15GB | 10GB |
| Free Bandwidth | Unlimited | - | 100GB |
| Setup Difficulty | Medium | Medium | Easy |
| View Files | Via URL | Via Drive | Via URL |
| Max File Size | 5TB | 5TB | 500MB |
| Monthly Cost (setelah free) | $0.015/GB | $1.99/100GB | $0.15/GB |

**Rekomendasi:**
- **Untuk Production Jangka Panjang**: Cloudflare R2 (unlimited bandwidth)
- **Untuk File yang Perlu Review**: Google Drive (bisa buka langsung di Drive)
- **Untuk Setup Tercepat**: Vercel Blob (1 klik setup)
