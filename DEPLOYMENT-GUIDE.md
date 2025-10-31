# Panduan Deployment ke Vercel dengan Neon Database

## Persiapan

### 1. Setup Neon Database

1. Buat akun di [Neon](https://neon.tech) jika belum punya
2. Buat project baru di Neon Console
3. Copy connection string dari dashboard Neon
   - Format: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### 2. Jalankan SQL Scripts

Jalankan scripts berikut secara berurutan di Neon SQL Editor atau menggunakan psql:

\`\`\`bash
# 1. Create tables
scripts/01-create-tables.sql

# 2. Add user fields (tanggal_lahir, jenis_kelamin)
scripts/04-add-user-fields.sql

# 3. Add leave request fields (tanggal_keberangkatan, etc)
scripts/05-add-leave-request-fields.sql

# 4. Seed initial data (optional)
scripts/03-seed-data.sql
\`\`\`

### 3. Setup Environment Variables

Buat file `.env.local` untuk development:

\`\`\`env
DATABASE_URL=your_neon_connection_string_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
\`\`\`

## Deployment ke Vercel

### 1. Push ke GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repo-name.git
git push -u origin main
\`\`\`

### 2. Deploy di Vercel

1. Login ke [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import repository dari GitHub
4. Configure Project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `next build`
   - Output Directory: .next

### 3. Set Environment Variables di Vercel

Di Vercel Project Settings → Environment Variables, tambahkan:

\`\`\`
DATABASE_URL = your_neon_connection_string_here
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
NODE_ENV = production
\`\`\`

### 4. Deploy

Click "Deploy" dan tunggu proses selesai.

## Verifikasi Deployment

1. Buka URL aplikasi Anda
2. Test login dengan user dari seed data
3. Test create, read, update operations
4. Verifikasi semua fitur berjalan dengan baik

## Troubleshooting

### Error: DATABASE_URL not set
- Pastikan environment variable `DATABASE_URL` sudah di-set di Vercel
- Redeploy aplikasi setelah menambahkan environment variable

### Error: Connection timeout
- Pastikan connection string Neon sudah benar
- Pastikan `?sslmode=require` ada di akhir connection string

### Error: Table does not exist
- Pastikan semua SQL scripts sudah dijalankan di Neon
- Jalankan scripts secara berurutan

## Maintenance

### Update Database Schema

1. Buat migration script baru di folder `scripts/`
2. Jalankan di Neon SQL Editor
3. Update kode aplikasi jika diperlukan
4. Push ke GitHub dan Vercel akan auto-deploy

### Backup Database

Neon menyediakan automatic backups. Untuk manual backup:
1. Go to Neon Console
2. Select your project
3. Go to "Backups" tab
4. Create manual backup

## Security Checklist

- [ ] Password hashing implemented (BELUM - masih plain text)
- [ ] Environment variables di-set dengan benar
- [ ] Database connection string tidak di-commit ke Git
- [ ] CORS settings configured
- [ ] Rate limiting implemented (optional)
- [ ] Input validation di semua forms
- [ ] SQL injection prevention (sudah handled oleh parameterized queries)

## Next Steps

1. Implement password hashing dengan bcrypt
2. Add email notifications untuk approval
3. Add file upload untuk dokumen pendukung
4. Add audit logging
5. Add monitoring dan error tracking (Sentry, LogRocket, dll)
