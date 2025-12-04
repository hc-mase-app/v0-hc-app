import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/services/user-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nik, password } = body

    if (!nik || !password) {
      return NextResponse.json({ error: "NIK dan password diperlukan" }, { status: 400 })
    }

    const user = await authenticateUser(nik, password)

    if (!user) {
      return NextResponse.json({ error: "NIK atau password salah" }, { status: 401 })
    }

    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Login error:", error)
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat login"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
