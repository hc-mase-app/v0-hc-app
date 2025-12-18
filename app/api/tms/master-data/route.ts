import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET() {
  try {
    const sitesResult = await sql`
      SELECT DISTINCT site 
      FROM karyawan 
      WHERE site IS NOT NULL 
      ORDER BY site
    `

    const departmentsResult = await sql`
      SELECT DISTINCT departemen 
      FROM karyawan 
      WHERE departemen IS NOT NULL 
      ORDER BY departemen
    `

    const sites = sitesResult.map((row: any) => row.site)
    const departments = departmentsResult.map((row: any) => row.departemen)

    return NextResponse.json({
      success: true,
      data: {
        sites,
        departments,
      },
    })
  } catch (error) {
    console.error("[v0] Master data API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load master data",
      },
      { status: 500 },
    )
  }
}
