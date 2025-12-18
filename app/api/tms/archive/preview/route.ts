import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const site = searchParams.get("site")
    const department = searchParams.get("department")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    console.log("[v0] Archive preview request:", { site, department, dateFrom, dateTo })

    // Build dynamic WHERE conditions
    const conditions: string[] = ["e.archived_status = 'ACTIVE'"]

    if (site && site !== "ALL") {
      conditions.push(`l.site = '${site.replace(/'/g, "''")}'`)
    }

    if (department && department !== "ALL") {
      conditions.push(`l.departemen = '${department.replace(/'/g, "''")}'`)
    }

    if (dateFrom) {
      conditions.push(`e.activity_date >= '${dateFrom}'`)
    }

    if (dateTo) {
      conditions.push(`e.activity_date <= '${dateTo}'`)
    }

    const whereClause = conditions.join(" AND ")

    // Execute query with tagged template
    const result = await sql`
      SELECT 
        e.id,
        e.evidence_number,
        e.activity_date,
        e.activity_month,
        e.gdrive_file_name,
        e.gdrive_file_url,
        e.gdrive_file_type,
        l.nama_karyawan as leader_name,
        l.site,
        l.departemen,
        s.nama_karyawan as subordinate_name,
        at.activity_name,
        LENGTH(e.gdrive_file_url) as estimated_size
      FROM tms_leadership_evidence e
      JOIN karyawan l ON e.leader_id = l.id
      JOIN karyawan s ON e.subordinate_id = s.id
      JOIN tms_activity_types at ON e.activity_type_id = at.id
      WHERE ${sql.unsafe(whereClause)}
      ORDER BY e.activity_date DESC, l.site, l.departemen
    `

    // Calculate totals
    const totalFiles = result.length
    const estimatedTotalSize = result.reduce((sum: number, row: any) => sum + (row.estimated_size || 0), 0)

    console.log("[v0] Archive preview result:", { totalFiles, estimatedTotalSize })

    return NextResponse.json({
      success: true,
      data: {
        files: result,
        summary: {
          totalFiles,
          estimatedTotalSize,
          filters: { site, department, dateFrom, dateTo },
        },
      },
    })
  } catch (error) {
    console.error("[v0] Archive preview error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to preview archive",
      },
      { status: 500 },
    )
  }
}
