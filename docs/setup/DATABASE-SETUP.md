# Database Setup Guide

## Neon PostgreSQL

### 1. Create Database
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string

### 2. Run Migrations
Migrations are stored in `migrations/` folder and tracked via `schema_migrations` table.

### 3. Verify Connection
\`\`\`typescript
import { sql } from "@/lib/neon-db"
const result = await sql`SELECT NOW()`
\`\`\`

## Tables Overview

- `users` - User accounts
- `leave_requests` - Leave request data
- `employee_assessments` - Assessment records
- `assessment_approvals` - Approval history
- `karyawan` - NRP employee data
- `nrp_counters` - NRP sequence counters
- `admin_documents` - HCGA IMS documents
\`\`\`

\`\`\`md file="CARA_JALANKAN_MIGRATION.md" isDeleted="true"
...deleted...
