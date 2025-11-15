# Contributing Guide

## Development Setup

1. Clone repository dan install dependencies:
   \`\`\`bash
   git clone <repo-url>
   cd hc-app
   npm install
   \`\`\`

2. Setup environment variables (lihat SETUP.md)

3. Jalankan development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Code Style

- Gunakan TypeScript untuk semua file
- Follow ESLint rules
- Gunakan Prettier untuk formatting
- Gunakan kebab-case untuk file names

## Commit Messages

Format: `type(scope): description`

Contoh:
- `feat(auth): add login with email`
- `fix(dashboard): fix approval status display`
- `docs(setup): update installation guide`

## Pull Request Process

1. Create branch dari `main`: `git checkout -b feature/your-feature`
2. Commit changes dengan descriptive messages
3. Push ke repository
4. Create Pull Request dengan deskripsi yang jelas
5. Tunggu review dan approval

## Testing

Sebelum push, pastikan:
- Tidak ada console errors
- Semua API routes berfungsi
- Database queries bekerja dengan baik
