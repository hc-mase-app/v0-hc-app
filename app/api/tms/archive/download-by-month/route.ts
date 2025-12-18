import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import JSZip from "jszip"

export const runtime = "nodejs"
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const { months } = await request.json()
    const userNik = request.headers.get("x-user-nik")

    if (!months || months.length === 0) {
      return NextResponse.json({ success: false, error: "No months selected" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    const evidenceList = await sql`
      SELECT 
        e.id,
        e.evidence_number,
        e.activity_date,
        e.activity_month,
        e.gdrive_file_url,
        e.gdrive_file_name,
        e.gdrive_file_type,
        k1.nama_karyawan as leader_name,
        k1.site as site,
        k1.departemen as department,
        k2.nama_karyawan as subordinate_name,
        at.activity_name
      FROM tms_leadership_evidence e
      LEFT JOIN karyawan k1 ON e.leader_id = k1.id
      LEFT JOIN karyawan k2 ON e.subordinate_id = k2.id
      LEFT JOIN tms_activity_types at ON e.activity_type_id = at.id
      WHERE TO_CHAR(e.activity_month, 'YYYY-MM') = ANY(${months})
        AND e.gdrive_file_url IS NOT NULL
      ORDER BY e.activity_month, e.activity_date
    `

    const zip = new JSZip()
    const metadata: any[] = []

    for (const evidence of evidenceList) {
      try {
        const response = await fetch(evidence.gdrive_file_url)
        if (!response.ok) continue

        const fileBlob = await response.blob()
        const buffer = await fileBlob.arrayBuffer()

        const monthFolder = new Date(evidence.activity_month).toISOString().slice(0, 7)
        const site = evidence.site || "Unknown_Site"
        const dept = evidence.department || "Unknown_Dept"
        const fileName = evidence.gdrive_file_name || `evidence_${evidence.id}.pdf`

        const filePath = `${site}/${dept}/${monthFolder}/${fileName}`
        zip.file(filePath, buffer)

        metadata.push({
          evidence_number: evidence.evidence_number,
          leader: evidence.leader_name,
          subordinate: evidence.subordinate_name,
          activity: evidence.activity_name,
          date: evidence.activity_date,
          site: evidence.site,
          department: evidence.department,
          file_name: fileName,
          file_path: filePath,
        })
      } catch (err) {
        console.error(`[v0] Error downloading file ${evidence.id}:`, err)
      }
    }

    const csvHeader = "Evidence Number,Leader,Subordinate,Activity,Date,Site,Department,File Name,File Path\n"
    const csvRows = metadata
      .map(
        (m) =>
          `${m.evidence_number},"${m.leader}","${m.subordinate}","${m.activity}",${m.date},"${m.site}","${m.department}","${m.file_name}","${m.file_path}"`,
      )
      .join("\n")
    zip.file("metadata.csv", csvHeader + csvRows)

    const zipBlob = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(zipBlob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Evidence_Archive_${months.join("_")}.zip"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating archive:", error)
    return NextResponse.json({ success: false, error: "Failed to create archive" }, { status: 500 })
  }
}
