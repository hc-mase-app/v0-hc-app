import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { uploadToGoogleDrive } from "@/lib/google-drive"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const subordinate_id = formData.get("subordinate_id") as string
    const activity_type_id = formData.get("activity_type_id") as string
    const activity_date = formData.get("activity_date") as string
    const location = formData.get("location") as string

    const currentUserNik = request.headers.get("x-user-nik")

    if (!currentUserNik) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validation
    if (!file || !subordinate_id || !activity_type_id || !activity_date) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Get leader info
    const leaderResult = await sql`
      SELECT id, nrp, nama_karyawan, site, departemen FROM karyawan WHERE nrp = ${currentUserNik}
    `

    if (leaderResult.length === 0) {
      return NextResponse.json({ error: "Leader tidak ditemukan" }, { status: 404 })
    }

    const leader = leaderResult[0]

    // Get subordinate info
    const subordinateResult = await sql`
      SELECT id, nrp, nama_karyawan FROM karyawan WHERE id = ${subordinate_id}
    `

    if (subordinateResult.length === 0) {
      return NextResponse.json({ error: "Bawahan tidak ditemukan" }, { status: 404 })
    }

    const subordinate = subordinateResult[0]

    // Parse activity date to get month (first day of month)
    const activityDateObj = new Date(activity_date)
    const activity_month = `${activityDateObj.getFullYear()}-${String(activityDateObj.getMonth() + 1).padStart(2, "0")}-01`

    // Generate evidence number
    const now = new Date()
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const evidence_number = `EVD-${yearMonth}-${randomNum}`

    const folderPath = `TMS-Evidence/${leader.site}/${leader.departemen}/${activityDateObj.getFullYear()}-${String(activityDateObj.getMonth() + 1).padStart(2, "0")}`

    console.log("[v0] Uploading to Google Drive:", {
      leader: leader.nama_karyawan,
      subordinate: subordinate.nama_karyawan,
      activity_date,
      file: file.name,
      folderPath,
    })

    const uploadResult = await uploadToGoogleDrive(file, folderPath)

    console.log("[v0] Google Drive upload success:", uploadResult)

    // Insert to database
    const result = await sql`
      INSERT INTO tms_leadership_evidence (
        evidence_number,
        leader_id,
        subordinate_id,
        activity_type_id,
        activity_date,
        activity_month,
        location,
        gdrive_file_id,
        gdrive_file_url,
        gdrive_file_name,
        gdrive_file_type,
        gdrive_uploaded_at,
        status,
        created_by
      ) VALUES (
        ${evidence_number},
        ${leader.id},
        ${subordinate_id},
        ${activity_type_id},
        ${activity_date},
        ${activity_month},
        ${location || null},
        ${uploadResult.fileId},
        ${uploadResult.fileUrl},
        ${uploadResult.fileName},
        ${uploadResult.fileType},
        CURRENT_TIMESTAMP,
        'ACTIVE',
        ${leader.id}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Evidence berhasil diupload ke Google Drive",
      data: result[0],
    })
  } catch (error) {
    console.error("[v0] Upload evidence error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal upload evidence",
      },
      { status: 500 },
    )
  }
}
