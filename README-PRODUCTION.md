# HC App - Multi-Level Approval System

Aplikasi sistem approval cuti multi-level untuk manajemen HR dengan workflow approval dari Atasan → PJO → HR HO.

## Fitur Utama

- **Multi-Level Approval**: Workflow approval dari Atasan Langsung → PJO → HR Head Office
- **Role-Based Access**: Berbagai role dengan permission yang berbeda (HR Site, Atasan, PJO, HR HO, Admin)
- **History & Progress Tracking**: Lihat riwayat pengajuan dan progress approval real-time
- **Leave Request Management**: Kelola pengajuan cuti dengan berbagai tipe cuti
- **Approval Timeline**: Visualisasi timeline approval untuk setiap pengajuan

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel
- **UI Components**: shadcn/ui, Radix UI

## Quick Start

Lihat [SETUP.md](./SETUP.md) untuk panduan setup lengkap.

## Project Structure

\`\`\`
hc-app/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages untuk berbagai role
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/           # React components
├── lib/
│   ├── neon-db-new.ts   # Database layer untuk Neon
│   ├── auth-context.tsx # Authentication context
│   └── types.ts         # TypeScript types
├── scripts/             # SQL scripts untuk database
└── public/              # Static assets
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login dengan email dan password

### Leave Requests
- `GET /api/leave-requests` - Get semua leave requests
- `GET /api/leave-requests?type=user&userId=xxx` - Get leave requests untuk user
- `GET /api/leave-requests?type=submitted-by&userId=xxx` - Get leave requests yang diajukan oleh user
- `POST /api/leave-requests` - Create leave request
- `PUT /api/leave-requests` - Update leave request

### Approvals
- `GET /api/approvals` - Get semua approvals
- `GET /api/approvals?type=by-request&requestId=xxx` - Get approvals untuk request
- `GET /api/approvals?type=by-approver&approverId=xxx` - Get approvals dari approver
- `POST /api/approvals` - Create approval
- `PUT /api/approvals` - Update approval

### Users
- `GET /api/users` - Get semua users
- `GET /api/users?type=by-role&role=xxx` - Get users by role
- `POST /api/users` - Create user
- `PUT /api/users` - Update user

## Environment Variables

\`\`\`env
DATABASE_URL=postgresql://user:password@host/database
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Setup .env.local
cp .env.example .env.local

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Deployment

Aplikasi ini di-deploy ke Vercel dengan automatic deployment dari GitHub. Setiap push ke branch `main` akan trigger deployment otomatis.

Lihat [SETUP.md](./SETUP.md) untuk panduan deployment lengkap.

## Contributing

Lihat [CONTRIBUTING.md](./CONTRIBUTING.md) untuk panduan contributing.

## License

MIT
