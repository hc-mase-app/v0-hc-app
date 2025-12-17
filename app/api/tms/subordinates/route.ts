import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leader_id = searchParams.get("leader_id")

    if (!leader_id) {
      return NextResponse.json({ error: "leader_id diperlukan" }, { status: 400 })
    }

    const result = await sql`
      SELECT 
        id,
        nrp as nik,
        nama_karyawan as name,
        jabatan,
        departemen,
        site
      FROM karyawan
      WHERE manager_id = ${leader_id}
      ORDER BY nama_karyawan
    `

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] GET subordinates error:", error)
    return NextResponse.json({ error: "Gagal mengambil data bawahan" }, { status: 500 })
  }
}
