# HC App - Multi-Level Leave Request Approval System

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/yans-projects-0f4eb0c7/v0-hc-app-r8)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/OdTbYMJLrwn)

## Overview

Sistem pengajuan cuti multi-level dengan workflow approval dari Atasan Langsung → PJO → HR Head Office. Aplikasi ini dibangun dengan Next.js 16, React 19, dan menggunakan Neon PostgreSQL sebagai database.

**Fitur Utama:**
- Multi-level approval workflow
- History dan progress tracking untuk setiap pengajuan
- Role-based access control (HR Site, Atasan Langsung, PJO, HR HO, Admin)
- Real-time approval timeline
- Dashboard untuk setiap role

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Database:** Neon PostgreSQL
- **Deployment:** Vercel
- **UI Components:** shadcn/ui

## Setup Lokal

### Prerequisites

- Node.js 20+
- pnpm (recommended) atau npm
- Neon account (https://neon.tech)

### 1. Clone Repository

\`\`\`bash
git clone <your-repo-url>
cd hc-app
\`\`\`

### 2. Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### 3. Setup Neon Database

1. Buat akun di [Neon.tech](https://neon.tech)
2. Buat project baru
3. Copy connection string (format: `postgresql://user:password@host/dbname`)
4. Buat file `.env.local`:

\`\`\`env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
\`\`\`

### 4. Setup Database Schema

Jalankan SQL scripts untuk membuat tables:

\`\`\`bash
# Gunakan Neon SQL Editor atau psql
psql $DATABASE_URL < scripts/02-init-neon-db.sql
psql $DATABASE_URL < scripts/03-seed-data.sql
\`\`\`

### 5. Run Development Server

\`\`\`bash
pnpm dev
\`\`\`

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Test Credentials

Gunakan data dari seed untuk login:

| NIK | Password | Role |
|-----|----------|------|
| 12345678 | password123 | HR Site |
| 87654321 | password123 | Atasan Langsung |
| 11111111 | password123 | PJO |
| 22222222 | password123 | HR HO |
| 33333333 | password123 | Super Admin |

## Deployment ke Vercel

### 1. Push ke GitHub

\`\`\`bash
git add .
git commit -m "Setup production with Neon database"
git push origin main
\`\`\`

### 2. Connect ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com)
2. Click "Add New" → "Project"
3. Import GitHub repository
4. Vercel akan auto-detect Next.js

### 3. Add Environment Variables

Di Vercel Project Settings → Environment Variables, tambahkan:

\`\`\`
DATABASE_URL = postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname
NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
NODE_ENV = production
\`\`\`

### 4. Deploy

Vercel akan otomatis deploy ketika ada push ke main branch.

## Project Structure

\`\`\`
hc-app/
├── app/
│   ├── api/                    # API routes
│   │   └── auth/
│   │       └── login/
│   ├── dashboard/              # Dashboard untuk setiap role
│   │   ├── hr-site/
│   │   ├── atasan/
│   │   ├── pjo/
│   │   └── hr-ho/
│   ├── login/                  # Login page
│   └── layout.tsx
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components
│   ├── approval-progress.tsx
│   ├── leave-request-detail-dialog.tsx
│   └── ...
├── lib/
│   ├── neon-db.ts             # Database functions
│   ├── database.ts            # Mock database (legacy)
│   ├── types.ts               # TypeScript types
│   └── auth-context.tsx       # Auth context
├── scripts/
│   ├── 01-create-tables.sql
│   ├── 02-init-neon-db.sql
│   └── 03-seed-data.sql
└── public/                     # Static assets
\`\`\`

## Database Schema

### Users Table
- id (UUID)
- nik (VARCHAR, unique)
- nama (VARCHAR)
- email (VARCHAR, unique)
- password (VARCHAR)
- role (VARCHAR)
- site, jabatan, departemen, poh
- status_karyawan, no_ktp, no_telp
- tanggal_bergabung (DATE)

### Leave Requests Table
- id (UUID)
- user_id (UUID) - karyawan yang mengajukan cuti
- submitted_by (UUID) - HR Site yang mengajukan (jika berbeda)
- submitted_by_name (VARCHAR)
- status (VARCHAR) - pending_atasan, pending_pjo, pending_hr_ho, approved, rejected
- tanggal_mulai, tanggal_selesai (DATE)
- jenis_pengajuan_cuti, alasan, catatan (VARCHAR/TEXT)

### Approval History Table
- id (UUID)
- request_id (UUID)
- approver_user_id (UUID)
- approver_name (VARCHAR)
- approver_role (VARCHAR)
- action (VARCHAR) - approved, rejected
- notes (TEXT)
- timestamp (TIMESTAMP)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login dengan NIK dan password

### Leave Requests
- `GET /api/leave-requests` - Get all requests
- `GET /api/leave-requests?type=user&userId=xxx` - Get requests untuk user
- `GET /api/leave-requests?type=submitted-by&userId=xxx` - Get requests yang diajukan oleh user
- `GET /api/leave-requests?type=pending-atasan&site=xxx` - Get pending requests untuk atasan
- `POST /api/leave-requests` - Create new leave request

## Workflow Approval

1. **HR Site** mengajukan cuti untuk karyawan
2. **Atasan Langsung** approve/reject di dashboard mereka
3. **PJO** approve/reject jika disetujui atasan
4. **HR HO** approve/reject jika disetujui PJO
5. Status berubah menjadi **Approved** atau **Rejected**

Setiap tahap approval tercatat di Approval History dengan timestamp dan notes.

## Troubleshooting

### Database Connection Error
- Pastikan DATABASE_URL benar di `.env.local`
- Cek IP whitelist di Neon dashboard
- Verifikasi credentials

### Login Gagal
- Pastikan seed data sudah dijalankan
- Cek NIK dan password di database
- Lihat console untuk error messages

### Deployment Error di Vercel
- Pastikan environment variables sudah di-set
- Cek build logs di Vercel dashboard
- Verifikasi database connection dari Vercel

## Development

### Menambah User Baru

\`\`\`sql
INSERT INTO users (id, nik, nama, email, password, role, site, jabatan, departemen, poh, status_karyawan, no_ktp, no_telp, tanggal_bergabung)
VALUES (gen_random_uuid(), 'NIK', 'Nama', 'email@example.com', 'password', 'role', 'site', 'jabatan', 'departemen', 'poh', 'Tetap', 'KTP', 'TELP', NOW());
\`\`\`

### Menjalankan SQL Scripts

\`\`\`bash
# Lokal
psql $DATABASE_URL < scripts/02-init-neon-db.sql

# Atau gunakan Neon SQL Editor di dashboard
\`\`\`

## Deployment

Your project is live at:

**[https://vercel.com/yans-projects-0f4eb0c7/v0-hc-app-r8](https://vercel.com/yans-projects-0f4eb0c7/v0-hc-app-r8)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/OdTbYMJLrwn](https://v0.app/chat/OdTbYMJLrwn)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Support

Untuk pertanyaan atau issues, buka GitHub Issues atau hubungi tim development.
