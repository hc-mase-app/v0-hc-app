import { type NextRequest, NextResponse } from "next/server"
import { updateUserWithCascade } from "@/lib/services/user-service"

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { userId, oldNik, updates } = data

    if (!userId || !oldNik) {
      return NextResponse.json({ error: "User ID dan NIK lama diperlukan" }, { status: 400 })
    }

    const result = await updateUserWithCascade(userId, oldNik, updates)

    if (!result.success) {
      return NextResponse.json({ error: result.message, details: result.details }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in update-full API:", error)
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
