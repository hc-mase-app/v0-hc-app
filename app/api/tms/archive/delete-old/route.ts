import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { deleteFromBlob } from "@/lib/vercel-blob-storage"

export const runtime = "nodejs"
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const userNik = request.headers.get("x-user-nik")
    if (!userNik) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Verify user is super admin
    const user = await sql`
      SELECT role FROM users WHERE nik = ${userNik}
    `

    if (!user[0] || user[0].role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Access denied. Super admin only." }, { status: 403 })
    }

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const oldEvidence = await sql`
      SELECT 
        id,
        evidence_number,
        gdrive_file_url
      FROM tms_leadership_evidence
      WHERE activity_date < ${threeMonthsAgo.toISOString().split("T")[0]}
    `

    if (oldEvidence.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada evidence lama yang perlu dihapus",
        data: { deletedCount: 0 },
      })
    }

    let deletedCount = 0

    for (const ev of oldEvidence) {
      try {
        // Delete from Blob storage
        await deleteFromBlob(ev.gdrive_file_url)

        // Hard delete from database
        await sql`
          DELETE FROM tms_leadership_evidence
          WHERE id = ${ev.id}
        `

        deletedCount++
      } catch (error) {
        console.error(`[v0] Failed to delete evidence ${ev.evidence_number}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deletedCount} evidence lama dari storage`,
      data: { deletedCount },
    })
  } catch (error) {
    console.error("[v0] Delete old error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
