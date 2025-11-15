import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function ensureLeaveRequestsSchema() {
  try {
    // Check if site column exists
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leave_requests' 
      AND column_name = 'site'
    `

    if (checkColumn.length === 0) {
      console.log("[v0] Running auto-migration: Adding site and departemen columns...")

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

      console.log("[v0] Auto-migration completed successfully")
    }

    const checkNewFields = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leave_requests' 
      AND column_name IN ('lama_onsite', 'nama_pesawat', 'jam_keberangkatan')
    `

    if (checkNewFields.length < 3) {
      console.log("[v0] Running auto-migration: Adding lama_onsite, nama_pesawat, jam_keberangkatan columns...")

      await sql`
        ALTER TABLE leave_requests 
        ADD COLUMN IF NOT EXISTS lama_onsite INTEGER,
        ADD COLUMN IF NOT EXISTS nama_pesawat VARCHAR(255),
        ADD COLUMN IF NOT EXISTS jam_keberangkatan TIME
      `

      console.log("[v0] New fields migration completed successfully")
    }

    return { success: true, migrated: true }
  } catch (error) {
    console.error("[v0] Auto-migration error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
