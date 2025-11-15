# Setup Guide untuk Production dengan Neon dan Vercel

## Prasyarat
- Node.js 18+ dan npm/yarn
- Akun Neon (https://neon.tech)
- Akun Vercel (https://vercel.com)
- Akun GitHub (https://github.com)

## Langkah 1: Setup Neon Database

1. Buka https://neon.tech dan buat akun
2. Buat project baru
3. Copy connection string (format: `postgresql://user:password@host/database`)
4. Buka SQL editor di Neon dashboard
5. Copy-paste isi file `scripts/01-create-schema.sql` dan jalankan
6. Copy-paste isi file `scripts/03-seed-data.sql` untuk seed data awal (opsional)

## Langkah 2: Setup Local Development

1. Clone repository:
   \`\`\`bash
   git clone <your-repo-url>
   cd hc-app
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Buat file `.env.local` di root directory:
   \`\`\`env
   DATABASE_URL=postgresql://user:password@host/database
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   \`\`\`

4. Jalankan development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Buka http://localhost:3000 di browser

## Langkah 3: Push ke GitHub

1. Buat repository baru di GitHub
2. Push kode:
   \`\`\`bash
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   \`\`\`

## Langkah 4: Deploy ke Vercel

1. Buka https://vercel.com dan login
2. Click "Add New..." → "Project"
3. Import GitHub repository
4. Di "Environment Variables", tambahkan:
   - `DATABASE_URL` = connection string dari Neon
   - `NEXT_PUBLIC_APP_URL` = URL Vercel project Anda
5. Click "Deploy"

## Akun Test

Setelah seed data, gunakan akun berikut untuk login:

- **HR Site**: email: `hr-site@company.com`, password: `password123`
- **Atasan**: email: `atasan@company.com`, password: `password123`
- **PJO**: email: `pjo@company.com`, password: `password123`
- **HR HO**: email: `hr-ho@company.com`, password: `password123`

## Troubleshooting

### Database Connection Error
- Pastikan DATABASE_URL benar di `.env.local`
- Pastikan IP address Anda di-whitelist di Neon dashboard

### Login Gagal
- Pastikan seed data sudah dijalankan
- Cek email dan password di database

### Build Error di Vercel
- Pastikan semua environment variables sudah ditambahkan
- Cek logs di Vercel dashboard
\`\`\`

\`\`\`json file="" isHidden
