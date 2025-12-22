# Panduan Upload Evidence - Solusi Storage

Upload evidence di aplikasi ini mendukung 3 provider storage:
1. **Vercel Blob** (RECOMMENDED - Paling Mudah)
2. **Google Drive** (Personal Gmail Account - Gratis 15GB)
3. Cloudflare R2 (DISABLED - Ada masalah teknis)

---

## SOLUSI 1: VERCEL BLOB (RECOMMENDED)

### Kelebihan
- Paling mudah setup
- Gratis 10GB storage
- Tidak perlu konfigurasi tambahan
- Otomatis terintegrasi dengan Vercel deployment
- CDN built-in untuk akses cepat

### Setup (Sangat Mudah!)

#### 1. Deploy ke Vercel
\`\`\`bash
# Login ke Vercel
vercel login

# Deploy project
vercel --prod
\`\`\`

#### 2. Vercel Otomatis Generate Token
Saat deploy, Vercel otomatis membuat `BLOB_READ_WRITE_TOKEN`. Anda tidak perlu lakukan apa-apa!

#### 3. Set Storage Provider
Di Vercel Dashboard:
1. Buka project Anda
2. Go to **Settings** → **Environment Variables**
3. Tambahkan variable baru:
   - **Name**: `STORAGE_PROVIDER`
   - **Value**: `vercel-blob`
   - **Environment**: Production, Preview, Development

#### 4. Redeploy
\`\`\`bash
vercel --prod
\`\`\`

#### 5. SELESAI!
Upload evidence sekarang sudah berfungsi!

### Troubleshooting
Jika upload gagal:
1. Cek di Vercel Dashboard → Settings → Environment Variables
2. Pastikan `BLOB_READ_WRITE_TOKEN` ada (otomatis dibuat Vercel)
3. Pastikan `STORAGE_PROVIDER=vercel-blob`
4. Redeploy project

---

## SOLUSI 2: GOOGLE DRIVE (Personal Gmail)

### Kelebihan
- Gratis 15GB storage per akun Gmail
- Tidak perlu Google Workspace (berbayar)
- File langsung terlihat di Google Drive Anda
- Bisa dibuka/download dari Google Drive

### Setup Google Drive API

#### Step 1: Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Login dengan akun Gmail Anda (personal, gratis)
3. Klik **Select a project** → **New Project**
4. Nama project: `HCapp Evidence Storage` (atau nama lain)
5. Klik **Create**

#### Step 2: Enable Google Drive API

1. Di sidebar, klik **APIs & Services** → **Library**
2. Search: `Google Drive API`
3. Klik **Google Drive API**
4. Klik **Enable**

#### Step 3: Buat OAuth 2.0 Credentials

1. Sidebar → **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth client ID**
3. Jika diminta, configure consent screen:
   - User Type: **External** (untuk personal Gmail)
   - App name: `HCapp Evidence`
   - User support email: Email Anda
   - Developer contact: Email Anda
   - Klik **Save and Continue**
   - Scopes: Skip (klik Save and Continue)
   - Test users: Tambahkan email Anda sendiri
   - Klik **Save and Continue**
4. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: `HCapp Web Client`
   - Authorized redirect URIs:
     - `https://your-app.vercel.app/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback` (untuk testing lokal)
   - Klik **Create**
5. **COPY** Client ID dan Client Secret (simpan di notepad)

#### Step 4: Generate Refresh Token

Cara paling mudah menggunakan OAuth Playground:

1. Buka [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Klik icon gear (⚙️) di kanan atas
3. Centang **Use your own OAuth credentials**
4. Masukkan:
   - OAuth Client ID: (dari step 3)
   - OAuth Client secret: (dari step 3)
5. Close settings
6. Di sidebar kiri, scroll ke **Drive API v3**
7. Centang:
   - `https://www.googleapis.com/auth/drive.file`
8. Klik **Authorize APIs**
9. Login dengan akun Gmail Anda
10. Klik **Allow**
11. Klik **Exchange authorization code for tokens**
12. **COPY** Refresh token yang muncul

#### Step 5: (Optional) Buat Folder Khusus di Google Drive

1. Buka [Google Drive](https://drive.google.com)
2. Klik **New** → **Folder**
3. Nama: `HCapp Evidence Files`
4. Klik kanan folder → **Share** → **Get link**
5. Set: **Anyone with the link** → **Viewer**
6. Copy link, ambil ID dari URL:
   - URL: `https://drive.google.com/drive/folders/1ABC-xyz123...`
   - Folder ID: `1ABC-xyz123...`

#### Step 6: Setup Environment Variables di Vercel

1. Buka Vercel Dashboard
2. Project → **Settings** → **Environment Variables**
3. Tambahkan variables berikut:

| Variable Name | Value | Keterangan |
|---------------|-------|------------|
| `STORAGE_PROVIDER` | `google-drive` | Aktifkan Google Drive storage |
| `GOOGLE_DRIVE_CLIENT_ID` | (dari step 3) | OAuth Client ID |
| `GOOGLE_DRIVE_CLIENT_SECRET` | (dari step 3) | OAuth Client Secret |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | (dari step 4) | Refresh Token |
| `GOOGLE_DRIVE_FOLDER_ID` | (dari step 5, optional) | Folder ID untuk simpan files |

4. Set untuk semua environment: Production, Preview, Development
5. Klik **Save**

#### Step 7: Redeploy

\`\`\`bash
vercel --prod
\`\`\`

#### Step 8: Test Upload

1. Buka aplikasi
2. Go to Upload Evidence
3. Upload file
4. Cek di Google Drive → Folder "HCapp Evidence Files"
5. File seharusnya muncul!

### Troubleshooting Google Drive

**Error: "Failed to get access token"**
- Pastikan Client ID, Client Secret, dan Refresh Token benar
- Cek apakah refresh token masih valid (bisa expire kalau tidak digunakan lama)
- Generate refresh token baru dari OAuth Playground

**Error: "Insufficient permission"**
- Pastikan Google Drive API sudah di-enable
- Pastikan scope `drive.file` sudah di-authorize

**File tidak muncul di Google Drive**
- Cek Folder ID benar (atau kosongkan untuk simpan di root)
- Cek quota storage Gmail Anda (mungkin sudah penuh)

---

## PERBANDINGAN

| Feature | Vercel Blob | Google Drive |
|---------|-------------|--------------|
| **Setup Complexity** | Sangat Mudah ⭐⭐⭐⭐⭐ | Sedang ⭐⭐⭐ |
| **Free Storage** | 10GB | 15GB |
| **Config Required** | Minimal (1 env var) | 4-5 env vars |
| **File Access** | Via URL | Google Drive UI + URL |
| **CDN** | Built-in | Ya (Google CDN) |
| **Upload Speed** | Sangat Cepat | Cepat |
| **Biaya Setelah Free** | $0.15/GB | Gratis sampai 15GB, lalu $1.99/100GB/bulan |

---

## REKOMENDASI

### Gunakan Vercel Blob jika:
- Anda deploy di Vercel
- Ingin setup yang paling mudah
- 10GB cukup untuk kebutuhan Anda
- Tidak perlu akses file dari Google Drive

### Gunakan Google Drive jika:
- Ingin storage gratis lebih besar (15GB)
- Perlu akses file langsung dari Google Drive
- Ingin backup file di tempat familiar
- Tidak masalah dengan setup yang sedikit lebih kompleks

---

## FAQ

**Q: Kenapa R2 tidak berfungsi?**
A: Cloudflare R2 menggunakan AWS SDK yang memiliki masalah kompatibilitas dengan Next.js edge runtime. Error `e.getAll is not a function` muncul karena library internal mencoba menggunakan Node.js APIs yang tidak tersedia.

**Q: Apakah bisa pakai keduanya (Vercel Blob + Google Drive)?**
A: Ya, tapi hanya satu yang aktif. Switch dengan mengubah `STORAGE_PROVIDER` environment variable.

**Q: File yang sudah diupload kemana jika ganti provider?**
A: File lama tetap di provider lama. Hanya upload baru yang ke provider baru. Database menyimpan URL lengkap jadi file lama tetap bisa diakses.

**Q: Apakah aman?**
A: Ya, semua file diupload dengan authentication dan access control. Google Drive set permission "anyone with link" tapi link-nya unik dan panjang (tidak bisa ditebak).

**Q: Bisa hapus file?**
A: Saat ini belum ada fitur hapus dari aplikasi, tapi Anda bisa hapus manual dari Vercel Blob dashboard atau Google Drive.

---

## Support

Jika masih ada masalah:
1. Cek environment variables di Vercel Dashboard
2. Cek logs di Vercel deployment
3. Test di local development dulu (`npm run dev`)
4. Pastikan semua dependencies sudah terinstall

**Vercel Blob** adalah solusi paling mudah dan recommended untuk mayoritas kasus!
