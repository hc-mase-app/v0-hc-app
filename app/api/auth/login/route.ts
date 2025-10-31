import { type NextRequest, NextResponse } from "next/server"
import { getUserByNik } from "@/lib/neon-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nik, password } = body

    if (!nik || !password) {
      return NextResponse.json({ error: "NIK dan password diperlukan" }, { status: 400 })
    }

    const user = await getUserByNik(nik)

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "NIK atau password salah" }, { status: 401 })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat login" }, { status: 500 })
  }
}
