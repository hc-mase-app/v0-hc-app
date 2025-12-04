# HCGA App Documentation

Dokumentasi lengkap untuk HCGA App - Human Capital & General Affairs Application.

## Struktur Folder Dokumentasi

\`\`\`
docs/
├── README.md                     # File ini
├── architecture/
│   └── SERVICE-LAYER.md          # Dokumentasi arsitektur service layer
├── deployment/
│   └── DEPLOYMENT-GUIDE.md       # Panduan deployment ke production
├── setup/
│   ├── DATABASE-SETUP.md         # Panduan setup database
│   ├── CLOUDFLARE-R2-SETUP.md    # Setup Cloudflare R2 untuk dokumen
│   └── GOOGLE-DRIVE-SETUP.md     # Setup Google Drive integration
└── guides/
    ├── PWA-GUIDE.md              # Panduan Progressive Web App
    └── CONTRIBUTING.md           # Panduan kontribusi
\`\`\`

## Quick Links

- [Service Layer Architecture](./architecture/SERVICE-LAYER.md)
- [Deployment Guide](./deployment/DEPLOYMENT-GUIDE.md)
- [Database Setup](./setup/DATABASE-SETUP.md)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon PostgreSQL
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Authentication**: Custom JWT (planned)
- **Storage**: Cloudflare R2 / Google Drive

## Modules

1. **User Management** - Manajemen user dan autentikasi
2. **Leave Requests** - Pengajuan dan approval cuti
3. **Employee Assessment** - Penilaian karyawan
4. **NRP Generator** - Generate Nomor Registrasi Pegawai
5. **HCGA IMS** - Document Management System
