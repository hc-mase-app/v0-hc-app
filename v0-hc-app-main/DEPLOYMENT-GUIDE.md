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

# 5. Add tanggal_keberangkatan column
scripts/06-add-tanggal-keberangkatan.sql
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

### ❌ Masih muncul "Invalid Date"
**Penyebab:** SQL migration belum dijalankan atau data di database tidak valid

**Solusi:**
1. Pastikan script `06-add-tanggal-keberangkatan.sql` sudah dijalankan di Neon
2. Check data di database dengan query:
   \`\`\`sql
   SELECT id, nik, tanggal_keberangkatan, periode_awal 
   FROM leave_requests 
   LIMIT 10;
   \`\`\`
3. Jika `tanggal_keberangkatan` masih NULL, jalankan UPDATE:
   \`\`\`sql
   UPDATE leave_requests 
   SET tanggal_keberangkatan = periode_awal 
   WHERE tanggal_keberangkatan IS NULL;
   \`\`\`

### ❌ Data tidak muncul di dashboard PJO/HR HO/HR Ticketing
**Penyebab:** Backend masih menggunakan versi lama atau belum di-deploy

**Solusi:**
1. Check apakah push ke GitHub berhasil: `git log --oneline -5`
2. Check Vercel deployment status di dashboard Vercel
3. Buka browser console (F12) dan check Network tab untuk error API
4. Check response dari `/api/leave-requests` - harusnya return array dengan data lengkap
5. Jika masih error, check Vercel logs untuk error message

### ❌ Approval tidak berfungsi (klik tapi tidak berubah)
**Penyebab:** API error atau data tidak refresh

**Solusi:**
1. Buka browser console (F12) dan check error message
2. Check Network tab untuk melihat response dari `/api/leave-requests` (PUT) dan `/api/approvals` (POST)
3. Pastikan user memiliki role yang benar
4. Check approval_history table di database:
   \`\`\`sql
   SELECT * FROM approval_history ORDER BY created_at DESC LIMIT 10;
   \`\`\`
5. Check leave_requests status:
   \`\`\`sql
   SELECT id, nik, status, updated_at 
   FROM leave_requests 
   ORDER BY updated_at DESC 
   LIMIT 10;
   \`\`\`

### ❌ Error: "column does not exist"
**Penyebab:** Database schema tidak sesuai dengan kode

**Solusi:**
1. Jalankan semua migration scripts secara berurutan:
   - `01-create-tables.sql`
   - `04-add-user-fields.sql`
   - `05-add-leave-request-fields.sql`
   - `06-add-tanggal-keberangkatan.sql`
2. Verify schema dengan query:
   \`\`\`sql
   -- Check leave_requests columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'leave_requests';
   
   -- Check users columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users';
   \`\`\`

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

## PERBAIKAN SISTEM PENGAJUAN CUTI - PANDUAN LENGKAP

## ⚠️ MASALAH YANG TELAH DIPERBAIKI

### 1. Backend (lib/neon-db.ts)
- ✅ **SQL Syntax Error Fixed** - `updateUser` dan `updateLeaveRequest` sekarang menggunakan `sql.query()` dengan placeholder
- ✅ **JOIN dengan Users Table** - Semua query leave requests sekarang JOIN dengan tabel users untuk mendapatkan site, departemen, dll
- ✅ **Data Transformation** - Menambahkan `transformUserData` dan `transformLeaveRequestData` untuk konversi snake_case ke camelCase
- ✅ **Column Names Fixed** - Mengubah `user_nik` menjadi `nik` sesuai schema database
- ✅ **New Query Functions** - Menambahkan `getLeaveRequestsBySiteDept` untuk query berdasarkan site dan departemen
- ✅ **Case-Insensitive NIK Search** - Menggunakan `UPPER(TRIM(nik))` untuk pencarian NIK

### 2. Frontend Components
- ✅ **Detail Dialog Fixed** - `leave-request-detail-dialog.tsx` sekarang fetch approval history dari API `/api/approvals`
- ✅ **Approval Card Fixed** - Menggunakan API untuk approve/reject, bukan localStorage
- ✅ **Access Control Removed** - Semua role dapat melihat detail pengajuan sesuai hak akses

### 3. API Routes
- ✅ **Site-Dept Query** - API route sekarang support query type `site-dept`
- ✅ **Debug Logging** - Menambahkan console.log untuk debugging
- ✅ **All Query Types** - Support submitted-by, user, status, site, site-dept, pending-dic, pending-pjo, pending-hr-ho

### 4. Date Handling
- ✅ **Invalid Date Fixed** - `formatDate` function handle null/undefined dengan return "-"
- ✅ **Tanggal Keberangkatan** - Menambahkan kolom `tanggal_keberangkatan` di database

---

## 🚀 LANGKAH DEPLOYMENT WAJIB

### Step 1: Download dan Push ke GitHub

\`\`\`bash
# Download ZIP dari v0 preview chat
# Extract ke folder project Anda

cd v0-hc-app

# Add semua perubahan
git add .

# Commit dengan pesan yang jelas
git commit -m "Fix: Complete backend and frontend fixes for leave request system

- Fixed SQL syntax errors in neon-db.ts
- Added JOIN queries with users table
- Fixed data transformation and column names
- Updated detail dialog to use API
- Added tanggal_keberangkatan column migration
- Fixed date formatting and Invalid Date issues"

# Push ke GitHub (gunakan -f jika perlu overwrite)
git push -f origin main
\`\`\`

### Step 2: ⚠️ JALANKAN SQL MIGRATION (WAJIB!)

**SANGAT PENTING:** Jalankan script ini di Neon database Anda sebelum testing:

\`\`\`sql
-- Script: 06-add-tanggal-keberangkatan.sql
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS tanggal_keberangkatan DATE;

UPDATE leave_requests 
SET tanggal_keberangkatan = periode_awal 
WHERE tanggal_keberangkatan IS NULL;
\`\`\`

**Cara menjalankan di Neon:**
1. Login ke [Neon Console](https://console.neon.tech)
2. Pilih project database Anda
3. Klik "SQL Editor" di sidebar
4. Copy-paste script SQL di atas
5. Klik tombol "Run" atau tekan Ctrl+Enter
6. Pastikan muncul pesan sukses

**ATAU gunakan v0 untuk menjalankan:**
1. Buka file `scripts/06-add-tanggal-keberangkatan.sql` di v0
2. Klik tombol "Run Script" di interface v0
3. Tunggu hingga selesai

### Step 3: Vercel Auto-Deploy

Setelah push ke GitHub, Vercel akan otomatis deploy. Tunggu hingga deployment selesai (biasanya 2-3 menit).

---

## ✅ TESTING CHECKLIST

Setelah deployment selesai, test SEMUA role berikut:

### 1. Role: User
- [ ] Login berhasil
- [ ] Dapat melihat riwayat pengajuan sendiri
- [ ] Dapat klik detail tanpa error "Anda tidak memiliki akses"
- [ ] Semua tanggal tampil dengan format yang benar (tidak "Invalid Date")
- [ ] Tanggal keberangkatan tampil dengan benar

### 2. Role: HR Site
- [ ] Login berhasil
- [ ] Dapat melihat SEMUA pengajuan dari site dan departemen yang sama (bukan hanya yang di-submit sendiri)
- [ ] Dapat submit pengajuan baru
- [ ] Dapat klik detail pengajuan
- [ ] Tanggal keberangkatan tampil dan bisa diisi

### 3. Role: DIC
- [ ] Login berhasil
- [ ] Dapat melihat SEMUA pengajuan dari site dan departemen yang sama
- [ ] Tab "Menunggu Persetujuan" menampilkan pengajuan dengan status `pending_dic`
- [ ] Dapat approve pengajuan → status berubah menjadi `pending_pjo`
- [ ] Dapat reject pengajuan → status berubah menjadi `rejected`
- [ ] Approval history tersimpan dan tampil di detail
- [ ] Setelah approve/reject, data refresh otomatis

### 4. Role: PJO Site ⚠️ (Sebelumnya tidak muncul)
- [ ] Login berhasil
- [ ] **Dapat melihat riwayat dan detail pengajuan** (ini yang sebelumnya error)
- [ ] Dapat melihat SEMUA pengajuan dari site yang sama (semua departemen)
- [ ] Tab "Menunggu Persetujuan" menampilkan pengajuan dengan status `pending_pjo`
- [ ] Dapat approve pengajuan → status berubah menjadi `pending_hr_ho`
- [ ] Dapat reject pengajuan → status berubah menjadi `rejected`
- [ ] Approval history tersimpan dan tampil di detail

### 5. Role: HR HO ⚠️ (Sebelumnya tidak muncul)
- [ ] Login berhasil
- [ ] **Dapat melihat riwayat dan detail pengajuan** (ini yang sebelumnya error)
- [ ] Dapat melihat SEMUA pengajuan dari SEMUA site dan departemen
- [ ] Tab "Menunggu Persetujuan" menampilkan pengajuan dengan status `pending_hr_ho`
- [ ] Dapat approve pengajuan → status berubah menjadi `approved`
- [ ] Dapat reject pengajuan → status berubah menjadi `rejected`
- [ ] Approval history tersimpan dan tampil di detail

### 6. Role: HR Ticketing ⚠️ (Sebelumnya tidak muncul)
- [ ] Login berhasil
- [ ] **Dapat melihat riwayat dan detail pengajuan** (ini yang sebelumnya error)
- [ ] Dapat melihat SEMUA pengajuan dari SEMUA site dan departemen
- [ ] Dapat filter berdasarkan status (Semua, Menunggu, Disetujui, Ditolak)
- [ ] Dapat search berdasarkan NIK, nama, jabatan, departemen
- [ ] Dapat klik detail untuk melihat informasi lengkap
- [ ] Dapat menambahkan kode booking untuk pengajuan yang approved

---

## 🔍 TROUBLESHOOTING

### ❌ Masih muncul "Invalid Date"
**Penyebab:** SQL migration belum dijalankan atau data di database tidak valid

**Solusi:**
1. Pastikan script `06-add-tanggal-keberangkatan.sql` sudah dijalankan di Neon
2. Check data di database dengan query:
   \`\`\`sql
   SELECT id, nik, tanggal_keberangkatan, periode_awal 
   FROM leave_requests 
   LIMIT 10;
   \`\`\`
3. Jika `tanggal_keberangkatan` masih NULL, jalankan UPDATE:
   \`\`\`sql
   UPDATE leave_requests 
   SET tanggal_keberangkatan = periode_awal 
   WHERE tanggal_keberangkatan IS NULL;
   \`\`\`

### ❌ Data tidak muncul di dashboard PJO/HR HO/HR Ticketing
**Penyebab:** Backend masih menggunakan versi lama atau belum di-deploy

**Solusi:**
1. Check apakah push ke GitHub berhasil: `git log --oneline -5`
2. Check Vercel deployment status di dashboard Vercel
3. Buka browser console (F12) dan check Network tab untuk error API
4. Check response dari `/api/leave-requests` - harusnya return array dengan data lengkap
5. Jika masih error, check Vercel logs untuk error message

### ❌ Approval tidak berfungsi (klik tapi tidak berubah)
**Penyebab:** API error atau data tidak refresh

**Solusi:**
1. Buka browser console (F12) dan check error message
2. Check Network tab untuk melihat response dari `/api/leave-requests` (PUT) dan `/api/approvals` (POST)
3. Pastikan user memiliki role yang benar
4. Check approval_history table di database:
   \`\`\`sql
   SELECT * FROM approval_history ORDER BY created_at DESC LIMIT 10;
   \`\`\`
5. Check leave_requests status:
   \`\`\`sql
   SELECT id, nik, status, updated_at 
   FROM leave_requests 
   ORDER BY updated_at DESC 
   LIMIT 10;
   \`\`\`

### ❌ Error: "column does not exist"
**Penyebab:** Database schema tidak sesuai dengan kode

**Solusi:**
1. Jalankan semua migration scripts secara berurutan:
   - `01-create-tables.sql`
   - `04-add-user-fields.sql`
   - `05-add-leave-request-fields.sql`
   - `06-add-tanggal-keberangkatan.sql`
2. Verify schema dengan query:
   \`\`\`sql
   -- Check leave_requests columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'leave_requests';
   
   -- Check users columns
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users';
   \`\`\`

---

## 📊 STRUKTUR APPROVAL FLOW

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    APPROVAL WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

1. HR Site Submit Pengajuan
   └─> Status: pending_dic
       │
       ▼
2. DIC Approve (Level 1)
   └─> Status: pending_pjo
       │
       ▼
3. PJO Site Approve (Level 2)
   └─> Status: pending_hr_ho
       │
       ▼
4. HR HO Approve (Level 3 - Final)
   └─> Status: approved
       │
       ▼
5. HR Ticketing Process
   └─> Add Booking Code
       └─> Status: tetap approved (atau bisa ditambahkan status baru)

REJECTION: Setiap level bisa reject → Status: rejected
\`\`\`

---

## 🔐 VISIBILITY RULES (Hak Akses)

| Role | Dapat Melihat | Dapat Approve | Catatan |
|------|---------------|---------------|---------|
| **User** | Pengajuan sendiri saja | ❌ Tidak | Hanya bisa submit dan lihat status |
| **HR Site** | Semua dari site & dept yang sama | ❌ Tidak | Bisa submit untuk karyawan lain |
| **DIC** | Semua dari site & dept yang sama | ✅ Ya (Level 1) | Approve → pending_pjo |
| **PJO Site** | Semua dari site yang sama (all dept) | ✅ Ya (Level 2) | Approve → pending_hr_ho |
| **HR HO** | **SEMUA** site & dept | ✅ Ya (Level 3) | Final approval → approved |
| **HR Ticketing** | **SEMUA** site & dept | ❌ Tidak | Process booking code |

---

## 📝 PERUBAHAN TEKNIS DETAIL

### Database Schema Changes
\`\`\`sql
-- Kolom baru di leave_requests
ALTER TABLE leave_requests 
ADD COLUMN tanggal_keberangkatan DATE;
\`\`\`

### API Endpoints
\`\`\`
GET /api/leave-requests
  ?type=submitted-by&userId={nik}     → HR Site
  ?type=user&userId={nik}              → User
  ?type=site-dept&site={site}&departemen={dept} → HR Site, DIC
  ?type=site&site={site}               → PJO Site
  ?type=pending-dic&site={site}&departemen={dept} → DIC
  ?type=pending-pjo&site={site}        → PJO Site
  ?type=pending-hr-ho                  → HR HO
  (no params)                          → HR HO, HR Ticketing (all)

GET /api/approvals
  ?type=by-request&requestId={id}      → Get approval history

POST /api/approvals
  Body: { leaveRequestId, approverNik, approverName, approverRole, action, notes }
\`\`\`

### Key Functions in neon-db.ts
- `transformUserData()` - Convert DB snake_case to frontend camelCase
- `transformLeaveRequestData()` - Convert DB snake_case to frontend camelCase
- `getLeaveRequestsBySiteDept()` - NEW: Query by site and departemen
- `getPendingRequestsForPJO()` - Query pending_pjo by site
- `getPendingRequestsForHRHO()` - Query pending_hr_ho (all)

---

## 🎯 NEXT STEPS (Optional Improvements)

1. **Password Hashing** - Implement bcrypt untuk keamanan password
2. **Email Notifications** - Kirim email saat approval/rejection
3. **File Upload** - Upload dokumen pendukung untuk pengajuan
4. **Audit Logging** - Track semua perubahan data
5. **Monitoring** - Setup Sentry atau LogRocket untuk error tracking
6. **Performance** - Add caching untuk query yang sering diakses
7. **Mobile Responsive** - Optimize untuk mobile devices

---

## 📞 SUPPORT

Jika masih ada masalah setelah mengikuti panduan ini:

1. **Check Console Logs**
   - Browser console (F12 → Console tab)
   - Vercel logs (Vercel Dashboard → Logs)

2. **Check Database**
   - Verify schema di Neon SQL Editor
   - Check data dengan SELECT queries

3. **Environment Variables**
   - Pastikan `DATABASE_URL` sudah di-set di Vercel
   - Check di Vercel Dashboard → Settings → Environment Variables

4. **Contact Support**
   - Vercel Support: https://vercel.com/help
   - Neon Support: https://neon.tech/docs/introduction
