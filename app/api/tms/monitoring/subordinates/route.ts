import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leaderId = searchParams.get("leaderId")
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7)

    if (!leaderId) {
      return NextResponse.json({ error: "Leader ID required" }, { status: 400 })
    }

    const effectiveMonth = `${month}-01`

    // Get all subordinates of this leader
    const subordinates = await sql`
      SELECT 
        k.id,
        k.nrp,
        k.nama_karyawan,
        k.departemen,
        k.level,
        CASE 
          WHEN e.id IS NOT NULL THEN true
          ELSE false
        END as has_evidence,
        COUNT(e.id) as evidence_count
      FROM karyawan k
      LEFT JOIN tms_leadership_evidence e ON k.id = e.subordinate_id 
        AND e.leader_id = ${leaderId}
        AND e.activity_month = ${effectiveMonth}
        AND e.status = 'ACTIVE'
      WHERE k.manager_id = ${leaderId}
      GROUP BY k.id, k.nrp, k.nama_karyawan, k.departemen, k.level, e.id
      ORDER BY k.nama_karyawan
    `

    console.log("[v0] Subordinates for leader:", leaderId, "count:", subordinates.length)

    return NextResponse.json({
      subordinates,
    })
  } catch (error) {
    console.error("[v0] GET subordinates error:", error)
    return NextResponse.json({ error: "Gagal mengambil data bawahan" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { subordinateId, leaderId, userRole } = body

    // Validate super admin role
    if (userRole !== "super_admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya super admin yang dapat menghapus bawahan." },
        { status: 403 },
      )
    }

    if (!subordinateId || !leaderId) {
      return NextResponse.json({ error: "Subordinate ID dan Leader ID diperlukan" }, { status: 400 })
    }

    // Remove hierarchy relationship by setting manager_id to null
    await sql`
      UPDATE karyawan
      SET manager_id = NULL
      WHERE id = ${subordinateId}
      AND manager_id = ${leaderId}
    `

    console.log("[v0] Deleted subordinate relationship:", { subordinateId, leaderId })

    return NextResponse.json({
      success: true,
      message: "Bawahan berhasil dihapus dari hierarki",
    })
  } catch (error) {
    console.error("[v0] DELETE subordinate error:", error)
    return NextResponse.json({ error: "Gagal menghapus bawahan dari hierarki" }, { status: 500 })
  }
}
