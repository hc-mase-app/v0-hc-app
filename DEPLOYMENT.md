# Deployment Guide - Vercel & Neon

Panduan lengkap untuk deploy aplikasi ke Vercel dengan Neon database.

## Prerequisites

- GitHub account dengan repository yang sudah di-push
- Neon account dengan database yang sudah di-setup
- Vercel account

## Step 1: Prepare Neon Database

1. Buka https://neon.tech dan login
2. Buka project Anda
3. Copy connection string (format: `postgresql://user:password@host/database`)
4. Jalankan SQL schema dari `scripts/01-create-schema.sql`
5. (Optional) Jalankan seed data dari `scripts/03-seed-data.sql`

## Step 2: Push ke GitHub

Pastikan semua kode sudah di-push ke GitHub:

\`\`\`bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
\`\`\`

**Penting**: Pastikan `.env.local` ada di `.gitignore` dan TIDAK di-commit!

## Step 3: Deploy ke Vercel

### Opsi A: Via Vercel Dashboard (Recommended)

1. Buka https://vercel.com dan login
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Pilih GitHub repository Anda
5. Di halaman "Configure Project":
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./ (default)
   - Build Command: npm run build (default)
   - Output Directory: .next (default)
6. Click "Environment Variables" dan tambahkan:
   - Key: `DATABASE_URL`
   - Value: Connection string dari Neon
   - Click "Add"
7. (Optional) Tambahkan variable lain:
   - `NEXT_PUBLIC_APP_URL` = URL Vercel project Anda (akan diberikan setelah deploy)
   - `NODE_ENV` = production
8. Click "Deploy"
9. Tunggu deployment selesai (biasanya 2-5 menit)

### Opsi B: Via Vercel CLI

1. Install Vercel CLI:
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. Login ke Vercel:
   \`\`\`bash
   vercel login
   \`\`\`

3. Deploy:
   \`\`\`bash
   vercel --prod
   \`\`\`

4. Saat diminta, pilih:
   - Set up and deploy? → Y
   - Which scope? → Pilih personal account Anda
   - Link to existing project? → N (untuk project baru)
   - Project name? → hc-app (atau nama lain)
   - Which directory? → ./ (default)

5. Saat diminta environment variables, input:
   - DATABASE_URL = connection string dari Neon

## Step 4: Verify Deployment

1. Buka URL Vercel yang diberikan (format: https://hc-app-xxx.vercel.app)
2. Coba login dengan akun test:
   - Email: `hr-site@company.com`
   - Password: `password123`
3. Jika login berhasil, deployment sukses!

## Step 5: Setup Automatic Deployment

Vercel sudah auto-setup GitHub integration. Setiap push ke `main` branch akan trigger deployment otomatis.

Untuk disable auto-deployment:
1. Buka project di Vercel dashboard
2. Settings → Git
3. Uncheck "Automatic Deployments"

## Troubleshooting

### Database Connection Error

**Error**: `Error: connect ECONNREFUSED`

**Solution**:
- Pastikan DATABASE_URL benar di Vercel environment variables
- Pastikan IP address Vercel di-whitelist di Neon dashboard:
  1. Buka Neon dashboard
  2. Settings → IP Whitelist
  3. Add IP: 0.0.0.0/0 (allow all) atau specific Vercel IPs

### Build Failed

**Error**: `Build failed with exit code 1`

**Solution**:
- Cek build logs di Vercel dashboard
- Pastikan semua dependencies di-install: `npm install`
- Pastikan tidak ada TypeScript errors: `npm run build` locally
- Pastikan environment variables sudah ditambahkan

### Login Gagal di Production

**Error**: `Email atau password salah`

**Solution**:
- Pastikan seed data sudah dijalankan di Neon database
- Cek database connection dengan query:
  \`\`\`sql
  SELECT * FROM users;
  \`\`\`
- Pastikan user dengan email `hr-site@company.com` ada di database

### Slow Performance

**Solution**:
- Cek Neon database performance di dashboard
- Pastikan database region sama dengan Vercel region
- Optimize database queries

## Monitoring

### Vercel Dashboard
- Buka https://vercel.com/dashboard
- Pilih project Anda
- Monitor:
  - Deployments: Lihat history deployment
  - Analytics: Lihat traffic dan performance
  - Logs: Lihat server logs

### Neon Dashboard
- Buka https://console.neon.tech
- Monitor:
  - Connections: Lihat active connections
  - Queries: Lihat slow queries
  - Storage: Lihat database size

## Rollback

Jika ada issue setelah deployment:

1. Buka Vercel dashboard
2. Pilih project
3. Buka "Deployments"
4. Cari deployment sebelumnya yang stabil
5. Click "..." → "Promote to Production"

## Next Steps

1. Setup custom domain (optional)
2. Setup SSL certificate (auto via Vercel)
3. Setup monitoring dan alerts
4. Setup backup strategy untuk database
5. Setup CI/CD pipeline untuk automated testing

## Support

Jika ada masalah:
- Cek Vercel docs: https://vercel.com/docs
- Cek Neon docs: https://neon.tech/docs
- Buka issue di GitHub repository
\`\`\`
