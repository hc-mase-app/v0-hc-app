import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    const result = await sql`
      UPDATE leave_requests 
      SET 
        tanggal_mulai = ${data.tanggalMulai},
        tanggal_selesai = ${data.tanggalSelesai},
        status = ${data.status},
        booking_code = ${data.bookingCode || null},
        catatan = ${data.catatan || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${data.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error("[API Admin] Error updating leave request:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
