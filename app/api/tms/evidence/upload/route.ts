import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { uploadFile } from "@/lib/storage-factory"

const sql = neon(process.env.DATABASE_URL!)

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload evidence request received")

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (parseError) {
      console.error("[v0] FormData parse error:", parseError)
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }

    const file = formData.get("file") as File
    const subordinate_id = formData.get("subordinate_id") as string
    const activity_type_id = formData.get("activity_type_id") as string
    const activity_date = formData.get("activity_date") as string
    const location = formData.get("location") as string

    const currentUserNik = request.headers.get("x-user-nik")

    if (!currentUserNik) {
      console.log("[v0] Unauthorized: No user NIK in headers")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validation
    if (!file || !subordinate_id || !activity_type_id || !activity_date) {
      console.log("[v0] Validation failed: Missing required fields")
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      console.log("[v0] Invalid file type:", file.type)
      return NextResponse.json(
        { error: "Tipe file tidak valid. Hanya PDF, JPG, atau PNG yang diizinkan" },
        { status: 400 },
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      console.log("[v0] File too large:", file.size)
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 })
    }

    // Get leader info
    const leaderResult = await sql`
      SELECT id, nrp, nama_karyawan, site, departemen FROM karyawan WHERE nrp = ${currentUserNik}
    `

    if (leaderResult.length === 0) {
      console.log("[v0] Leader not found:", currentUserNik)
      return NextResponse.json({ error: "Leader tidak ditemukan" }, { status: 404 })
    }

    const leader = leaderResult[0]

    // Get subordinate info
    const subordinateResult = await sql`
      SELECT id, nrp, nama_karyawan FROM karyawan WHERE id = ${subordinate_id}
    `

    if (subordinateResult.length === 0) {
      console.log("[v0] Subordinate not found:", subordinate_id)
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

    const folderPath = `${leader.site}/${leader.departemen}/${activityDateObj.getFullYear()}-${String(activityDateObj.getMonth() + 1).padStart(2, "0")}`
    const fileName = `${evidence_number}_${subordinate.nrp}_${file.name}`

    console.log("[v0] Uploading to storage:", {
      leader: leader.nama_karyawan,
      subordinate: subordinate.nama_karyawan,
      activity_date,
      file: file.name,
      folderPath,
      fileName,
    })

    let storageResult
    try {
      storageResult = await uploadFile(file, folderPath, fileName)
      console.log("[v0] Storage upload success:", storageResult.url, "Provider:", storageResult.provider)
    } catch (uploadError) {
      console.error("[v0] Storage upload failed:", uploadError)
      const errorMessage = uploadError instanceof Error ? uploadError.message : "Gagal upload file ke storage"
      return NextResponse.json(
        {
          error: errorMessage,
          hint: "Pastikan STORAGE_PROVIDER di environment variables diset ke 'vercel-blob' atau 'google-drive'",
        },
        { status: 500 },
      )
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
        ${storageResult.key},
        ${storageResult.url},
        ${fileName},
        ${storageResult.contentType},
        CURRENT_TIMESTAMP,
        'ACTIVE',
        ${leader.id}
      )
      RETURNING *
    `

    console.log("[v0] Database insert success:", result[0].id)

    return NextResponse.json({
      success: true,
      message: "Evidence berhasil diupload",
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
