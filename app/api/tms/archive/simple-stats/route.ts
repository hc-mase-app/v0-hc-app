import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const result = await sql`
      SELECT 
        COUNT(*)::int as total_count,
        COALESCE(SUM(
          CASE 
            WHEN gdrive_file_name LIKE '%.pdf' THEN 500000
            WHEN gdrive_file_name LIKE '%.jpg' OR gdrive_file_name LIKE '%.jpeg' THEN 300000
            WHEN gdrive_file_name LIKE '%.png' THEN 400000
            ELSE 200000
          END
        ), 0)::bigint as total_size,
        COUNT(CASE WHEN activity_date < ${threeMonthsAgo.toISOString().split("T")[0]} THEN 1 END)::int as old_count,
        COALESCE(SUM(
          CASE 
            WHEN activity_date < ${threeMonthsAgo.toISOString().split("T")[0]} THEN
              CASE 
                WHEN gdrive_file_name LIKE '%.pdf' THEN 500000
                WHEN gdrive_file_name LIKE '%.jpg' OR gdrive_file_name LIKE '%.jpeg' THEN 300000
                WHEN gdrive_file_name LIKE '%.png' THEN 400000
                ELSE 200000
              END
            ELSE 0
          END
        ), 0)::bigint as old_size
      FROM tms_leadership_evidence
    `

    const stats = result[0]

    return NextResponse.json({
      success: true,
      data: {
        totalFiles: stats.total_count,
        totalSize: Number.parseInt(stats.total_size.toString()),
        oldFiles: stats.old_count,
        oldSize: Number.parseInt(stats.old_size.toString()),
      },
    })
  } catch (error) {
    console.error("[v0] Simple stats error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
