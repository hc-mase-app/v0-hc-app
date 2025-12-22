# Cara Deploy Aplikasi ke Vercel

Panduan lengkap untuk deploy aplikasi HCapp ke Vercel dari awal.

## Prerequisites

- Akun GitHub (untuk simpan kode)
- Akun Vercel (gratis di [vercel.com](https://vercel.com))
- Database Neon sudah setup (lihat `DATABASE_SETUP_INSTRUCTIONS.md`)

## Metode 1: Deploy dari GitHub (RECOMMENDED)

### Step 1: Push Code ke GitHub

\`\`\`bash
# Initialize git (jika belum)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repository di GitHub.com, lalu:
git remote add origin https://github.com/USERNAME/hcapp.git
git branch -M main
git push -u origin main
\`\`\`

### Step 2: Import ke Vercel

1. Login ke [Vercel Dashboard](https://vercel.com)
2. Klik **Add New Project**
3. Pilih **Import Git Repository**
4. Authorize Vercel untuk akses GitHub
5. Pilih repository `hcapp`
6. Klik **Import**

### Step 3: Configure Environment Variables

Di halaman import, sebelum deploy, tambahkan environment variables:

**Required Variables:**
\`\`\`
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
STORAGE_PROVIDER=vercel-blob
\`\`\`

**Optional (jika pakai R2):**
\`\`\`
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_BUCKET_NAME=tms-evidence
R2_PUBLIC_URL=https://pub-xxx.r2.dev
\`\`\`

### Step 4: Deploy

1. Klik **Deploy**
2. Tunggu proses build dan deployment (sekitar 2-3 menit)
3. Setelah selesai, aplikasi otomatis live di URL: `https://hcapp-xxx.vercel.app`

### Step 5: Setup Blob Storage

1. Di Vercel Dashboard, buka project yang baru dideploy
2. Klik tab **Storage**
3. Klik **Create Database** > pilih **Blob**
4. Beri nama `evidence-storage`
5. Klik **Create**
6. Token `BLOB_READ_WRITE_TOKEN` otomatis ditambahkan

### Step 6: Verifikasi

1. Buka aplikasi di browser
2. Login dengan user test (lihat `DATABASE_SETUP_INSTRUCTIONS.md`)
3. Test upload evidence di menu TMS > Leadership Evidence

## Metode 2: Deploy dengan Vercel CLI

### Step 1: Install Vercel CLI

\`\`\`bash
npm i -g vercel
\`\`\`

### Step 2: Login

\`\`\`bash
vercel login
\`\`\`

### Step 3: Deploy

\`\`\`bash
# Di root folder project
vercel

# Ikuti prompt:
# - Set up and deploy? Yes
# - Which scope? Pilih account Anda
# - Link to existing project? No
# - Project name? hcapp (atau nama lain)
# - Directory? ./ (default)
# - Override settings? No
\`\`\`

### Step 4: Setup Environment Variables

\`\`\`bash
# Tambah environment variables
vercel env add DATABASE_URL
vercel env add STORAGE_PROVIDER

# Untuk production
vercel env add DATABASE_URL production
vercel env add STORAGE_PROVIDER production
\`\`\`

Atau via dashboard seperti metode 1.

### Step 5: Deploy Production

\`\`\`bash
vercel --prod
\`\`\`

## Setelah Deploy

### Custom Domain (Optional)

1. Di Vercel Dashboard, buka project
2. Klik tab **Settings** > **Domains**
3. Klik **Add Domain**
4. Input domain Anda (contoh: `hcapp.company.com`)
5. Follow instruksi untuk setup DNS
6. Tunggu verifikasi (biasanya beberapa menit)

### Auto Deploy on Git Push

Setelah deploy via GitHub, setiap push ke branch `main` akan otomatis trigger deployment baru.

\`\`\`bash
# Edit code
git add .
git commit -m "Update feature"
git push

# Vercel otomatis detect dan deploy
\`\`\`

### Preview Deployments

Setiap pull request otomatis dapat preview URL untuk testing sebelum merge.

## Environment Variables Management

### Menambah Variable Baru

Via Dashboard:
1. Project Settings > Environment Variables
2. Add New
3. Isi Key dan Value
4. Pilih environments (Production/Preview/Development)
5. Save

Via CLI:
\`\`\`bash
vercel env add VARIABLE_NAME
\`\`\`

### Edit Variable

1. Hapus variable lama
2. Tambah variable baru dengan value baru
3. Redeploy

### Pull Variables ke Local

\`\`\`bash
vercel env pull .env.local
\`\`\`

## Monitoring dan Logs

### Realtime Logs

Via Dashboard:
1. Project > Deployments
2. Klik deployment terbaru
3. Klik **View Function Logs**

Via CLI:
\`\`\`bash
vercel logs [deployment-url]
\`\`\`

### Error Tracking

1. Buka Deployment logs di dashboard
2. Filter by error level
3. Klik error untuk detail stack trace

## Database Setup

Setelah deploy, run SQL scripts untuk setup database:

1. Download script `99-init-complete-database.sql`
2. Buka [Neon Console](https://console.neon.tech)
3. Pilih database project
4. Klik **SQL Editor**
5. Paste isi script
6. Klik **Run**

Atau gunakan Vercel CLI:
\`\`\`bash
# Connect ke database
psql [DATABASE_URL]

# Run script
\i scripts/99-init-complete-database.sql
\`\`\`

## Troubleshooting

### Build Failed

**Error: "Module not found"**
- Solusi: Pastikan semua dependencies di `package.json`
- Run `npm install` lokal untuk verifikasi

**Error: "Type error"**
- Solusi: Fix TypeScript errors
- Run `npm run build` lokal untuk test

### Runtime Errors

**Error: "DATABASE_URL is not defined"**
- Solusi: Tambahkan environment variable di Vercel
- Redeploy

**Error: "Failed to upload to storage"**
- Solusi: Setup Blob Storage di Vercel Dashboard
- Pastikan `STORAGE_PROVIDER=vercel-blob`

### Deployment Tidak Auto Update

- Pastikan GitHub repository connected
- Cek Vercel Git integration di Settings
- Manual trigger redeploy jika perlu

## Best Practices

1. **Gunakan GitHub** untuk version control
2. **Test lokal** sebelum push (`npm run build`)
3. **Environment variables** jangan commit ke git
4. **Preview deployments** untuk test fitur baru
5. **Monitor logs** untuk detect errors early
6. **Setup custom domain** untuk production
7. **Enable automatic deployments** untuk CI/CD

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
