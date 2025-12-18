import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { del } from "@vercel/blob"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { months } = await request.json()
    const userNik = request.headers.get("x-user-nik")

    if (!months || months.length === 0) {
      return NextResponse.json({ success: false, error: "No months selected" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    const evidenceToDelete = await sql`
      SELECT id, gdrive_file_url
      FROM tms_leadership_evidence
      WHERE TO_CHAR(activity_month, 'YYYY-MM') = ANY(${months})
        AND gdrive_file_url IS NOT NULL
    `

    let deletedFromBlob = 0

    for (const evidence of evidenceToDelete) {
      try {
        if (evidence.gdrive_file_url) {
          await del(evidence.gdrive_file_url)
          deletedFromBlob++
        }
      } catch (err) {
        console.error(`[v0] Error deleting blob ${evidence.id}:`, err)
      }
    }

    const deleteResult = await sql`
      DELETE FROM tms_leadership_evidence
      WHERE TO_CHAR(activity_month, 'YYYY-MM') = ANY(${months})
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleteResult.length,
        deletedFromBlob,
      },
    })
  } catch (error) {
    console.error("[v0] Error deleting evidence:", error)
    return NextResponse.json({ success: false, error: "Failed to delete evidence" }, { status: 500 })
  }
}
