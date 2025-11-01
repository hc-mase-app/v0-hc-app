import { type NextRequest, NextResponse } from "next/server"
import { getUsers, getUserById, getUsersByRole, addUser, updateUser } from "@/lib/neon-db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const id = searchParams.get("id")
    const role = searchParams.get("role")

    let result

    if (type === "by-id" && id) {
      result = await getUserById(id)
    } else if (type === "by-role" && role) {
      result = await getUsersByRole(role)
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
    const result = await addUser(data)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
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
