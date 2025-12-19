import { type NextRequest, NextResponse } from "next/server"
import * as userService from "@/lib/services/user-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const id = searchParams.get("id")
    const role = searchParams.get("role")
    const nik = searchParams.get("nik")

    const page = searchParams.get("page")
    const limit = searchParams.get("limit")
    const site = searchParams.get("site")
    const search = searchParams.get("search")

    let result

    if (type === "by-id" && id) {
      result = await userService.getUserById(id)
    } else if (type === "by-role" && role) {
      result = await userService.getUsersByRole(role as any)
    } else if (nik) {
      const user = await userService.getUserByNik(nik)
      result = user ? [user] : []
    } else if (page && limit) {
      result = await userService.getUsersPaginated(
        Number.parseInt(page, 10),
        Number.parseInt(limit, 10),
        site || undefined,
        search || undefined,
      )
      return NextResponse.json(result)
    } else {
      result = await userService.getAllUsers()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching users:", error)
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await userService.createUser(data)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating user:", error)
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

    const result = await userService.updateUser(id, updates)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating user:", error)
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })
    }

    await userService.deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
