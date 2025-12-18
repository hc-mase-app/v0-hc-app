import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { del } from "@vercel/blob"

const sql = neon(process.env.DATABASE_URL!)

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const currentUserNik = request.headers.get("x-user-nik")
    if (!currentUserNik) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { evidenceIds, confirmed } = body

    if (!confirmed) {
      return NextResponse.json({ error: "Confirmation required" }, { status: 400 })
    }

    console.log("[v0] Archive delete request:", { evidenceIds, confirmed })

    // Get user info
    const userResult = await sql`SELECT id, nrp, nama_karyawan, role FROM karyawan WHERE nrp = ${currentUserNik}`
    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const user = userResult[0]

    // Only super_admin can delete
    if (user.role !== "super_admin") {
      return NextResponse.json({ error: "Only super admin can delete evidence" }, { status: 403 })
    }

    // Get evidence files
    const evidences = await sql`
      SELECT * FROM tms_leadership_evidence
      WHERE id = ANY(${evidenceIds})
      AND archived_status = 'ACTIVE'
    `

    if (evidences.length === 0) {
      return NextResponse.json({ error: "No evidence files found" }, { status: 404 })
    }

    // Delete files from Blob storage
    let deletedCount = 0
    for (const evidence of evidences) {
      try {
        await del(evidence.gdrive_file_url)
        deletedCount++
        console.log(`[v0] Deleted file from blob: ${evidence.gdrive_file_name}`)
      } catch (error) {
        console.error(`[v0] Failed to delete file: ${evidence.gdrive_file_name}`, error)
      }
    }

    // Update database - mark as ARCHIVED (soft delete)
    await sql`
      UPDATE tms_leadership_evidence
      SET 
        archived_status = 'ARCHIVED',
        archived_at = CURRENT_TIMESTAMP,
        archived_by = ${user.id}
      WHERE id = ANY(${evidenceIds})
    `

    // Generate archive number
    const now = new Date()
    const archiveNumber = `ARC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`

    // Log archive operation
    await sql`
      INSERT INTO tms_archive_logs (
        archive_number,
        archived_by,
        archived_by_nik,
        archived_by_name,
        action_type,
        total_files,
        evidence_ids,
        notes
      ) VALUES (
        ${archiveNumber},
        ${user.id},
        ${user.nrp},
        ${user.nama_karyawan},
        'DELETE',
        ${evidences.length},
        ${JSON.stringify(evidenceIds)},
        'Archived and deleted evidence files from storage'
      )
    `

    console.log("[v0] Archive delete successful:", archiveNumber, "Files deleted:", deletedCount)

    return NextResponse.json({
      success: true,
      message: `Successfully archived ${evidences.length} evidence files and deleted ${deletedCount} from storage`,
      archiveNumber,
    })
  } catch (error) {
    console.error("[v0] Archive delete error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to archive and delete",
      },
      { status: 500 },
    )
  }
}
