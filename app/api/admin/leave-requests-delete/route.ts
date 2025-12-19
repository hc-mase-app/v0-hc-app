import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })
    }

    // Delete approval history first (foreign key constraint)
    await sql`
      DELETE FROM approval_history 
      WHERE leave_request_id = ${id}
    `

    // Delete leave request
    const result = await sql`
      DELETE FROM leave_requests 
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API Admin] Error deleting leave request:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
