import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const result = await sql`
      SELECT 
        TO_CHAR(activity_month, 'YYYY-MM') as month,
        TO_CHAR(activity_month, 'Mon YYYY') as month_label,
        COUNT(*)::int as file_count,
        SUM(
          CASE 
            WHEN gdrive_file_type LIKE '%pdf%' THEN 4500000
            WHEN gdrive_file_type LIKE '%image%' OR gdrive_file_type LIKE '%jpg%' OR gdrive_file_type LIKE '%png%' THEN 3000000
            ELSE 2000000
          END
        )::bigint as total_size
      FROM tms_leadership_evidence
      WHERE gdrive_file_url IS NOT NULL
      GROUP BY TO_CHAR(activity_month, 'YYYY-MM'), TO_CHAR(activity_month, 'Mon YYYY'), activity_month
      ORDER BY activity_month ASC
    `

    const totalSize = result.reduce((sum: number, row: any) => sum + Number(row.total_size), 0)

    return NextResponse.json({
      success: true,
      data: {
        months: result.map((row: any) => ({
          month: row.month,
          monthLabel: row.month_label,
          fileCount: row.file_count,
          totalSize: Number(row.total_size),
        })),
        totalSize,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching monthly data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 })
  }
}
