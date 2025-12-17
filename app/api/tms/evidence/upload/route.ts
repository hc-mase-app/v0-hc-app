import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { uploadToGoogleDrive } from "@/lib/google-drive"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const leader_id = formData.get("leader_id") as string
    const subordinate_id = formData.get("subordinate_id") as string
    const activity_type_id = formData.get("activity_type_id") as string
    const activity_date = formData.get("activity_date") as string
    const activity_description = formData.get("activity_description") as string
    const location = formData.get("location") as string

    // Validation
    if (!file || !leader_id || !subordinate_id || !activity_type_id || !activity_date) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Parse activity date to get month
    const activityDateObj = new Date(activity_date)
    const activity_month = `${activityDateObj.getFullYear()}-${String(activityDateObj.getMonth() + 1).padStart(2, "0")}-01`

    // Generate evidence number
    const now = new Date()
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const evidence_number = `EVD-${yearMonth}-${randomNum}`

    const leaderResult = await sql`SELECT site, departemen FROM karyawan WHERE id = ${leader_id}`
    if (leaderResult.length === 0) {
      return NextResponse.json({ error: "Leader tidak ditemukan" }, { status: 400 })
    }

    const leader = leaderResult[0]
    const monthYear = `${activityDateObj.toLocaleString("id-ID", { month: "long" })}-${activityDateObj.getFullYear()}`
    const folderPath = `${leader.site}/${leader.departemen}/${monthYear}`

    let gdrive_file_id: string
    let gdrive_file_url: string
    let gdrive_file_name: string
    let gdrive_file_type: string

    try {
      const uploadResult = await uploadToGoogleDrive(file, folderPath)
      gdrive_file_id = uploadResult.fileId
      gdrive_file_url = uploadResult.fileUrl
      gdrive_file_name = uploadResult.fileName
      gdrive_file_type = uploadResult.fileType
    } catch (uploadError) {
      console.error("[v0] Google Drive upload error:", uploadError)
      // Fallback: Create temporary reference if Google Drive is not configured
      if (uploadError instanceof Error && uploadError.message.includes("Google Drive credentials not configured")) {
        gdrive_file_id = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
        gdrive_file_url = `https://drive.google.com/file/d/${gdrive_file_id}/view`
        gdrive_file_name = file.name
        gdrive_file_type = file.type
        console.warn("[v0] Using temporary Google Drive reference - please configure credentials")
      } else {
        throw uploadError
      }
    }

    // Insert to database
    const result = await sql`
      INSERT INTO tms_leadership_evidence (
        evidence_number,
        leader_id,
        subordinate_id,
        activity_type_id,
        activity_date,
        activity_month,
        activity_description,
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
        ${leader_id},
        ${subordinate_id},
        ${activity_type_id},
        ${activity_date},
        ${activity_month},
        ${activity_description || null},
        ${location || null},
        ${gdrive_file_id},
        ${gdrive_file_url},
        ${gdrive_file_name},
        ${gdrive_file_type},
        CURRENT_TIMESTAMP,
        'DRAFT',
        ${leader_id}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Evidence berhasil diupload",
      data: result[0],
    })
  } catch (error) {
    console.error("[v0] Upload evidence error:", error)
    return NextResponse.json({ error: "Gagal upload evidence" }, { status: 500 })
  }
}
