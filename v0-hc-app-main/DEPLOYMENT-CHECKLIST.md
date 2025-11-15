# Pre-Deployment Checklist

Pastikan semua item di bawah sudah selesai sebelum deploy ke production:

## Database Setup
- [ ] Neon account sudah dibuat
- [ ] Database project sudah dibuat di Neon
- [ ] Connection string sudah di-copy
- [ ] SQL schema sudah dijalankan (`scripts/01-create-schema.sql`)
- [ ] Seed data sudah dijalankan (`scripts/03-seed-data.sql`)
- [ ] Test user bisa login di local development

## Code Quality
- [ ] Tidak ada console.log() di production code
- [ ] Tidak ada hardcoded credentials
- [ ] TypeScript compilation berhasil: `npm run build`
- [ ] Linter tidak ada error: `npm run lint`
- [ ] Semua API routes tested locally

## Environment Variables
- [ ] `.env.local` ada di `.gitignore`
- [ ] `.env.example` sudah updated dengan semua variables
- [ ] DATABASE_URL sudah di-copy dari Neon
- [ ] NEXT_PUBLIC_APP_URL sudah di-set

## GitHub Repository
- [ ] Repository sudah di-push ke GitHub
- [ ] Branch `main` adalah production branch
- [ ] `.gitignore` sudah benar (exclude `.env.local`)
- [ ] README.md sudah updated
- [ ] SETUP.md sudah updated

## Vercel Setup
- [ ] Vercel account sudah dibuat
- [ ] GitHub repository sudah di-connect ke Vercel
- [ ] Environment variables sudah ditambahkan di Vercel
- [ ] Build command sudah benar: `npm run build`
- [ ] Output directory sudah benar: `.next`

## Security
- [ ] Tidak ada sensitive data di code
- [ ] Password hashing sudah implemented (TODO: add bcrypt)
- [ ] API routes sudah protected dengan authentication
- [ ] Database queries sudah protected dari SQL injection
- [ ] CORS sudah di-configure jika diperlukan

## Testing
- [ ] Login functionality tested
- [ ] Leave request creation tested
- [ ] Approval workflow tested
- [ ] History dan progress tracking tested
- [ ] All roles tested (HR Site, Atasan, PJO, HR HO)

## Monitoring
- [ ] Vercel monitoring sudah di-setup
- [ ] Neon monitoring sudah di-setup
- [ ] Error tracking sudah di-setup (optional: Sentry)
- [ ] Performance monitoring sudah di-setup

## Documentation
- [ ] SETUP.md sudah lengkap
- [ ] DEPLOYMENT.md sudah lengkap
- [ ] API documentation sudah lengkap
- [ ] Troubleshooting guide sudah lengkap

## Post-Deployment
- [ ] Test login di production URL
- [ ] Test semua workflows di production
- [ ] Monitor logs untuk errors
- [ ] Backup database strategy sudah di-setup
- [ ] Rollback plan sudah siap
\`\`\`
