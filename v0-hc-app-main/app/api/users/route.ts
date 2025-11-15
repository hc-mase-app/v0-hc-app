import { type NextRequest, NextResponse } from "next/server"
import { getUsers, getUserById, getUserByNik, getUsersByRole, addUser, updateUser, deleteUser } from "@/lib/neon-db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const id = searchParams.get("id")
    const role = searchParams.get("role")
    const nik = searchParams.get("nik")

    let result

    if (type === "by-id" && id) {
      result = await getUserById(id)
    } else if (type === "by-role" && role) {
      result = await getUsersByRole(role)
    } else if (nik) {
      const user = await getUserByNik(nik)
      result = user ? [user] : []
    } else {
      result = await getUsers()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log("[v0] Creating user with data:", {
      nik: data.nik,
      name: data.name,
      email: data.email,
      role: data.role,
      hasPassword: !!data.password,
      tanggal_lahir: data.tanggal_lahir,
      jenis_kelamin: data.jenis_kelamin,
      status_karyawan: data.status_karyawan,
    })
    const result = await addUser(data)
    console.log("[v0] User created successfully:", result.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updates } = data

    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })
    }

    const result = await updateUser(id, updates)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })
    }

    await deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
