import { type NextRequest, NextResponse } from "next/server"
import { updateUserNikWithCascade } from "@/lib/services/user-service"

export async function PUT(request: NextRequest) {
  try {
    const { oldNik, newNik } = await request.json()

    if (!oldNik || !newNik) {
      return NextResponse.json({ error: "NIK lama dan NIK baru harus diisi" }, { status: 400 })
    }

    if (oldNik.trim() === newNik.trim()) {
      return NextResponse.json({ error: "NIK lama dan NIK baru tidak boleh sama" }, { status: 400 })
    }

    const result = await updateUserNikWithCascade(oldNik.trim(), newNik.trim())

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      affectedRows: result.affectedRows,
    })
  } catch (error) {
    console.error("Error in update NIK API:", error)
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
