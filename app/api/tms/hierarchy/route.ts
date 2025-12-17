import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7)

    const result = await sql`
      SELECT 
        k.id,
        k.nrp as nik,
        k.nama_karyawan as name,
        k.jabatan,
        k.level,
        k.departemen,
        k.site,
        k.manager_id,
        m.nama_karyawan as manager_name,
        m.nrp as manager_nik,
        k.direct_reports_count
      FROM karyawan k
      LEFT JOIN karyawan m ON k.manager_id = m.id
      ORDER BY k.site, k.departemen, k.nama_karyawan
    `

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] GET hierarchy error:", error)
    return NextResponse.json({ error: "Gagal mengambil data hierarki" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, manager_id } = body

    console.log("[v0] PUT hierarchy - user_id:", user_id, "manager_id:", manager_id)

    // Validate
    if (!user_id) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    // Prevent self-referencing
    if (user_id === manager_id) {
      return NextResponse.json({ error: "Karyawan tidak bisa menjadi atasan dirinya sendiri" }, { status: 400 })
    }

    let validManagerId = manager_id
    if (!manager_id || manager_id === "0" || manager_id === "" || manager_id === "null") {
      validManagerId = null
    }

    await sql`
      UPDATE karyawan
      SET manager_id = ${validManagerId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user_id}
    `

    // The trigger will automatically update direct_reports_count

    return NextResponse.json({ success: true, message: "Hierarki berhasil diperbarui" })
  } catch (error) {
    console.error("[v0] PUT hierarchy error:", error)
    return NextResponse.json({ error: "Gagal menyimpan hierarki" }, { status: 500 })
  }
}
