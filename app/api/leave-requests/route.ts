import { type NextRequest, NextResponse } from "next/server"
import {
  getLeaveRequests,
  getLeaveRequestsByUserId,
  getLeaveRequestsSubmittedBy,
  getLeaveRequestsByStatus,
  addLeaveRequest,
  updateLeaveRequest,
} from "@/lib/neon-db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    let result

    if (type === "submitted-by" && userId) {
      result = await getLeaveRequestsSubmittedBy(userId)
    } else if (type === "user" && userId) {
      result = await getLeaveRequestsByUserId(userId)
    } else if (type === "status" && status) {
      result = await getLeaveRequestsByStatus(status)
    } else {
      result = await getLeaveRequests()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching leave requests:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await addLeaveRequest(data)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating leave request:", error)
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

    const result = await updateLeaveRequest(id, updates)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating leave request:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
