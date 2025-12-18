import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import JSZip from "jszip"

export const runtime = "nodejs"
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const userNik = request.headers.get("x-user-nik")
    if (!userNik) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    const evidence = await sql`
      SELECT 
        e.id,
        e.evidence_number,
        e.activity_date,
        e.gdrive_file_url,
        e.gdrive_file_name,
        e.gdrive_file_type,
        l.nama_karyawan as leader_name,
        s.nama_karyawan as subordinate_name,
        k.site,
        k.departemen
      FROM tms_leadership_evidence e
      JOIN users l ON e.leader_id::text = l.id::text
      JOIN users s ON e.subordinate_id::text = s.id::text
      LEFT JOIN karyawan k ON l.nik = k.nik
      ORDER BY k.site, k.departemen, e.activity_date
    `

    if (evidence.length === 0) {
      return NextResponse.json({ success: false, error: "No evidence found" }, { status: 404 })
    }

    const zip = new JSZip()

    // Add metadata CSV
    let csv = "Evidence Number,Date,Leader,Subordinate,Site,Department,File URL\n"
    for (const ev of evidence) {
      csv += `"${ev.evidence_number}","${ev.activity_date}","${ev.leader_name}","${ev.subordinate_name}","${ev.site || "N/A"}","${ev.departemen || "N/A"}","${ev.gdrive_file_url}"\n`
    }
    zip.file("metadata.csv", csv)

    // Download and add files to ZIP
    for (const ev of evidence) {
      try {
        const response = await fetch(ev.gdrive_file_url)
        if (response.ok) {
          const fileData = await response.arrayBuffer()
          const date = new Date(ev.activity_date)
          const monthFolder = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          const folderPath = `${ev.site || "Unknown"}/${ev.departemen || "Unknown"}/${monthFolder}`
          zip.folder(folderPath)?.file(ev.gdrive_file_name || `${ev.evidence_number}.file`, fileData)
        }
      } catch (error) {
        console.error(`[v0] Failed to download file ${ev.evidence_number}:`, error)
      }
    }

    // Generate ZIP
    const zipData = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(zipData, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Evidence_All_${new Date().toISOString().split("T")[0]}.zip"`,
      },
    })
  } catch (error) {
    console.error("[v0] Download all error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
