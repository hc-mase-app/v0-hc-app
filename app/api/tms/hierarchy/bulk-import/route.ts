import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const effective_month = formData.get("effective_month") as string

    if (!file || !effective_month) {
      return NextResponse.json(
        {
          success: false,
          message: "File dan periode bulan harus diisi",
        },
        { status: 400 },
      )
    }

    // Read CSV file
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    // Skip header
    const dataLines = lines.slice(1)

    const errors: string[] = []
    let imported = 0

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim()
      if (!line) continue

      const [nik, name, manager_nik] = line.split(",").map((s) => s.trim())

      try {
        const userResult = await sql`SELECT id FROM karyawan WHERE nrp = ${nik}`
        if (userResult.length === 0) {
          errors.push(`Baris ${i + 2}: NIK ${nik} tidak ditemukan`)
          continue
        }
        const user_id = userResult[0].id

        // Find manager by NIK (if provided)
        let manager_id = null
        if (manager_nik) {
          const managerResult = await sql`SELECT id FROM karyawan WHERE nrp = ${manager_nik}`
          if (managerResult.length === 0) {
            errors.push(`Baris ${i + 2}: NIK Atasan ${manager_nik} tidak ditemukan`)
            continue
          }
          manager_id = managerResult[0].id
        }

        await sql`
          UPDATE karyawan
          SET manager_id = ${manager_id}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${user_id}
        `

        imported++
      } catch (err) {
        errors.push(`Baris ${i + 2}: ${err}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Import selesai",
      imported,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] Bulk import error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat import",
        error: String(error),
      },
      { status: 500 },
    )
  }
}
