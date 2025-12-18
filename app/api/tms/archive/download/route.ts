import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import JSZip from "jszip"

const sql = neon(process.env.DATABASE_URL!)

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes for large downloads

export async function POST(request: NextRequest) {
  try {
    const currentUserNik = request.headers.get("x-user-nik")
    if (!currentUserNik) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { site, department, dateFrom, dateTo, evidenceIds } = body

    console.log("[v0] Archive download request:", { site, department, dateFrom, dateTo, evidenceIds })

    // Get user info
    const userResult = await sql`SELECT id, nrp, nama_karyawan FROM karyawan WHERE nrp = ${currentUserNik}`
    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const user = userResult[0]

    // Get evidence files based on IDs
    const evidences = await sql`
      SELECT 
        e.*,
        l.nama_karyawan as leader_name,
        l.site,
        l.departemen,
        s.nama_karyawan as subordinate_name,
        at.activity_name
      FROM tms_leadership_evidence e
      JOIN karyawan l ON e.leader_id = l.id
      JOIN karyawan s ON e.subordinate_id = s.id
      JOIN tms_activity_types at ON e.activity_type_id = at.id
      WHERE e.id = ANY(${evidenceIds})
      AND e.archived_status = 'ACTIVE'
      ORDER BY e.activity_date DESC, l.site, l.departemen
    `

    if (evidences.length === 0) {
      return NextResponse.json({ error: "No evidence files found" }, { status: 404 })
    }

    console.log("[v0] Found evidence files:", evidences.length)

    // Create ZIP file
    const zip = new JSZip()

    // Create metadata CSV
    let csvContent =
      "Evidence Number,Leader,Subordinate,Activity Type,Activity Date,Site,Department,File Name,File URL\n"

    for (const evidence of evidences) {
      const folderPath = `${evidence.site}/${evidence.departemen}/${evidence.activity_month.substring(0, 7)}`

      try {
        // Download file from URL
        const response = await fetch(evidence.gdrive_file_url)
        if (!response.ok) {
          console.error(`[v0] Failed to download file: ${evidence.gdrive_file_name}`)
          continue
        }

        const fileBlob = await response.blob()
        const fileBuffer = await fileBlob.arrayBuffer()

        // Add to ZIP with folder structure
        zip.file(`${folderPath}/${evidence.gdrive_file_name}`, fileBuffer)

        // Add to CSV
        csvContent += `"${evidence.evidence_number}","${evidence.leader_name}","${evidence.subordinate_name}","${evidence.activity_name}","${evidence.activity_date}","${evidence.site}","${evidence.departemen}","${evidence.gdrive_file_name}","${evidence.gdrive_file_url}"\n`
      } catch (error) {
        console.error(`[v0] Error processing file ${evidence.gdrive_file_name}:`, error)
      }
    }

    // Add metadata CSV to ZIP
    zip.file("metadata.csv", csvContent)

    // Generate archive number
    const now = new Date()
    const archiveNumber = `ARC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Log archive operation
    await sql`
      INSERT INTO tms_archive_logs (
        archive_number,
        archived_by,
        archived_by_nik,
        archived_by_name,
        action_type,
        filter_site,
        filter_department,
        filter_date_from,
        filter_date_to,
        total_files,
        total_size_bytes,
        evidence_ids,
        notes
      ) VALUES (
        ${archiveNumber},
        ${user.id},
        ${user.nrp},
        ${user.nama_karyawan},
        'DOWNLOAD',
        ${site || null},
        ${department || null},
        ${dateFrom || null},
        ${dateTo || null},
        ${evidences.length},
        ${zipBuffer.length},
        ${JSON.stringify(evidenceIds)},
        'Downloaded evidence files as ZIP'
      )
    `

    console.log("[v0] Archive download successful:", archiveNumber)

    // Return ZIP file
    const fileName = `Evidence_Archive_${archiveNumber}.zip`

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Archive download error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to download archive",
      },
      { status: 500 },
    )
  }
}
