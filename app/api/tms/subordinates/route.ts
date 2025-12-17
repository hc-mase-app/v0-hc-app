import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const currentUserNik = searchParams.get("managerNik")

    if (!currentUserNik) {
      return NextResponse.json({ error: "Manager NIK required" }, { status: 400 })
    }

    console.log("[v0] Fetching subordinates for manager NIK:", currentUserNik)

    const userResult = await sql`
      SELECT id FROM karyawan WHERE nrp = ${currentUserNik}
    `

    if (userResult.length === 0) {
      console.log("[v0] Manager not found in karyawan table")
      return NextResponse.json({ subordinates: [] })
    }

    const userId = userResult[0].id

    const result = await sql`
      SELECT 
        id,
        nrp,
        nama_karyawan as name,
        jabatan,
        departemen,
        site,
        level
      FROM karyawan
      WHERE manager_id = ${userId}
      ORDER BY nama_karyawan
    `

    console.log("[v0] Found subordinates:", result.length)

    return NextResponse.json({ subordinates: result })
  } catch (error) {
    console.error("[v0] GET subordinates error:", error)
    return NextResponse.json({ error: "Gagal mengambil data bawahan" }, { status: 500 })
  }
}
