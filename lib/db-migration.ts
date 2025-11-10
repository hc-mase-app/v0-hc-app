import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

let migrationPromise: Promise<{ success: boolean; migrated: boolean; error?: string }> | null = null

export async function ensureLeaveRequestsSchema() {
  if (migrationPromise) {
    console.log("[v0] Migration already in progress, waiting for completion...")
    return migrationPromise
  }

  migrationPromise = runMigration()

  try {
    const result = await migrationPromise
    return result
  } finally {
    // Keep the promise cached so subsequent calls return immediately
    // Don't reset to null after completion
  }
}

async function runMigration(): Promise<{ success: boolean; migrated: boolean; error?: string }> {
  try {
    console.log("[v0] Starting database migration check...")

    // PostgreSQL advisory locks are session-level and automatically released
    const lockId = 123456789 // Unique ID for this migration

    // Try to acquire lock (non-blocking)
    const lockResult = await sql`SELECT pg_try_advisory_lock(${lockId}) as acquired`

    if (!lockResult[0].acquired) {
      console.log("[v0] Another process is running migration, waiting...")
      // Wait for lock to be released
      await sql`SELECT pg_advisory_lock(${lockId})`
      // Release immediately after acquiring
      await sql`SELECT pg_advisory_unlock(${lockId})`
      console.log("[v0] Migration completed by another process")
      return { success: true, migrated: false }
    }

    try {
      let migrated = false

      // Check if site column exists
      const checkColumn = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name = 'site'
      `

      if (checkColumn.length === 0) {
        console.log("[v0] Running auto-migration: Adding site and departemen columns...")
        migrated = true

        await sql`BEGIN`

        try {
          // Add site and departemen columns
          await sql`
            ALTER TABLE leave_requests 
            ADD COLUMN IF NOT EXISTS site VARCHAR(100),
            ADD COLUMN IF NOT EXISTS departemen VARCHAR(100)
          `

          // Create indexes for better query performance
          await sql`
            CREATE INDEX IF NOT EXISTS idx_leave_requests_site 
            ON leave_requests(site)
          `

          await sql`
            CREATE INDEX IF NOT EXISTS idx_leave_requests_departemen 
            ON leave_requests(departemen)
          `

          // Update existing records with site/dept from users table
          await sql`
            UPDATE leave_requests lr
            SET 
              site = u.site,
              departemen = u.departemen
            FROM users u
            WHERE lr.nik = u.nik
            AND lr.site IS NULL
          `

          await sql`COMMIT`
          console.log("[v0] Auto-migration completed successfully")
        } catch (error) {
          await sql`ROLLBACK`
          throw error
        }
      }

      const checkNewFields = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name IN ('lama_onsite', 'nama_pesawat', 'jam_keberangkatan')
      `

      if (checkNewFields.length < 3) {
        console.log("[v0] Running auto-migration: Adding lama_onsite, nama_pesawat, jam_keberangkatan columns...")
        migrated = true

        await sql`BEGIN`

        try {
          await sql`
            ALTER TABLE leave_requests 
            ADD COLUMN IF NOT EXISTS lama_onsite INTEGER,
            ADD COLUMN IF NOT EXISTS nama_pesawat VARCHAR(255),
            ADD COLUMN IF NOT EXISTS jam_keberangkatan TIME
          `

          await sql`COMMIT`
          console.log("[v0] New fields migration completed successfully")
        } catch (error) {
          await sql`ROLLBACK`
          throw error
        }
      }

      return { success: true, migrated }
    } finally {
      await sql`SELECT pg_advisory_unlock(${lockId})`
    }
  } catch (error) {
    console.error("[v0] Auto-migration error:", error)
    return { success: false, migrated: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
