import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get("month") // Format: YYYY-MM
    const managerNrp = searchParams.get("managerNrp")

    if (!managerNrp) {
      return NextResponse.json({ error: "Manager NRP required" }, { status: 400 })
    }

    if (!month) {
      return NextResponse.json({ error: "Month parameter required" }, { status: 400 })
    }

    // Parse month to get first and last day
    const [year, monthNum] = month.split("-")
    const firstDay = `${year}-${monthNum}-01`
    const lastDay = new Date(Number.parseInt(year), Number.parseInt(monthNum), 0).getDate()
    const lastDayStr = `${year}-${monthNum}-${lastDay}`

    // Get subordinates with their activity counts
    const subordinates = await sql`
      SELECT 
        k.nrp,
        k.nama_karyawan as nama,
        k.site,
        k.departemen,
        COUNT(CASE WHEN le.activity_type = 'Coaching' THEN 1 END) as coaching_count,
        COUNT(CASE WHEN le.activity_type = 'Counseling' THEN 1 END) as counseling_count,
        COUNT(CASE WHEN le.activity_type = 'Mentoring' THEN 1 END) as mentoring_count,
        COUNT(CASE WHEN le.activity_type = 'Directing' THEN 1 END) as directing_count,
        COUNT(le.id) as total_activities
      FROM karyawan k
      LEFT JOIN tms_leadership_evidence le 
        ON k.nrp = le.subordinate_nrp 
        AND le.activity_date >= ${firstDay}::date
        AND le.activity_date <= ${lastDayStr}::date
      WHERE k.manager_id = (SELECT id FROM karyawan WHERE nrp = ${managerNrp})
      GROUP BY k.nrp, k.nama_karyawan, k.site, k.departemen
      ORDER BY k.nama_karyawan
    `

    // Calculate progress percentage (assuming 4 activities per subordinate per month as target)
    const TARGET_PER_SUBORDINATE = 4
    const subordinatesWithProgress = subordinates.map((sub: any) => ({
      ...sub,
      progress_percentage: (sub.total_activities / TARGET_PER_SUBORDINATE) * 100,
    }))

    return NextResponse.json({
      success: true,
      data: subordinatesWithProgress,
      month,
    })
  } catch (error) {
    console.error("Error fetching activity progress:", error)
    return NextResponse.json({ error: "Failed to fetch activity progress" }, { status: 500 })
  }
}
