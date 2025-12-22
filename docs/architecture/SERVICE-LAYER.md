# Service Layer Architecture

## Overview

Aplikasi HCGA menggunakan Clean Architecture dengan pemisahan layer yang jelas:

\`\`\`
┌──────────────────────────────────────┐
│   API ROUTES (HTTP Layer)            │
│   app/api/**/route.ts                │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│   SERVICE LAYER (Business Logic)     │
│   lib/services/*                     │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│   DATABASE LAYER                     │
│   lib/neon-db.ts (sql export)        │
└──────────────────────────────────────┘
\`\`\`

## Service Files

| Service | File | Description |
|---------|------|-------------|
| User | `lib/services/user-service.ts` | User management & authentication |
| Leave Request | `lib/leave-request-service.ts` | Leave request CRUD & workflow |
| Assessment | `lib/services/assessment-service.ts` | Employee assessment & approval |
| NRP | `lib/services/nrp-service.ts` | NRP generation & karyawan management |
| Approval | `lib/services/approval-service.ts` | Approval history tracking |

## Usage Pattern

### API Route (Thin Layer)
\`\`\`typescript
// app/api/users/route.ts
import { getAllUsers, createUser } from "@/lib/services/user-service"

export async function GET() {
  const users = await getAllUsers()
  return NextResponse.json({ success: true, data: users })
}
\`\`\`

### Service Layer (Business Logic)
\`\`\`typescript
// lib/services/user-service.ts
import { sql } from "@/lib/neon-db"

export async function getAllUsers() {
  const result = await sql`SELECT * FROM users ORDER BY name`
  return result
}
\`\`\`

## Benefits

1. **Separation of Concerns** - Clear responsibility per layer
2. **Testability** - Easy to mock services for testing
3. **Reusability** - Services can be used in multiple routes
4. **Maintainability** - Changes isolated to specific layers
