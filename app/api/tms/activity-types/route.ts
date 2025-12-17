import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT id, activity_code, activity_name, description
      FROM tms_activity_types
      WHERE is_active = true
      ORDER BY activity_name
    `

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] GET activity types error:", error)
    return NextResponse.json({ error: "Gagal mengambil data tipe aktivitas" }, { status: 500 })
  }
}
