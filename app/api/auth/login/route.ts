import { type NextRequest, NextResponse } from "next/server"
import { getUserByNik } from "@/lib/neon-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nik, password } = body

    console.log("[v0] Login attempt for NIK:", nik)

    if (!nik || !password) {
      console.log("[v0] Login failed: Missing NIK or password")
      return NextResponse.json({ error: "NIK dan password diperlukan" }, { status: 400 })
    }

    const user = await getUserByNik(nik)

    console.log("[v0] User lookup result:", user ? "Found" : "Not found")

    if (!user) {
      console.log("[v0] Login failed: User not found")
      return NextResponse.json({ error: "NIK atau password salah" }, { status: 401 })
    }

    console.log("[v0] Comparing passwords - Input:", password, "Stored:", user.password)

    if (user.password !== password) {
      console.log("[v0] Login failed: Password mismatch")
      return NextResponse.json({ error: "NIK atau password salah" }, { status: 401 })
    }

    console.log("[v0] Login successful for user:", user.name)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat login" }, { status: 500 })
  }
}
