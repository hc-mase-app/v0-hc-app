import { type NextRequest, NextResponse } from "next/server"
import {
  getPendingRequestsForRole,
  getAllRequestsForRole,
  getUserRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  createLeaveRequest,
  updateBookingCode,
  getApprovalHistory,
  getStatisticsForRole,
  type UserRole,
} from "@/lib/approval-workflow"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")

    switch (action) {
      case "pending": {
        const role = searchParams.get("role") as UserRole
        const site = searchParams.get("site")
        const departemen = searchParams.get("departemen")

        if (!role || !site) {
          return NextResponse.json({ error: "Role and site required" }, { status: 400 })
        }

        const result = await getPendingRequestsForRole(role, site, departemen || undefined)
        return NextResponse.json(result)
      }

      case "all": {
        const role = searchParams.get("role") as UserRole
        const site = searchParams.get("site")
        const departemen = searchParams.get("departemen")

        if (!role || !site) {
          return NextResponse.json({ error: "Role and site required" }, { status: 400 })
        }

        const result = await getAllRequestsForRole(role, site, departemen || undefined)
        return NextResponse.json(result)
      }

      case "user-requests": {
        const nik = searchParams.get("nik")
        if (!nik) {
          return NextResponse.json({ error: "NIK required" }, { status: 400 })
        }

        const result = await getUserRequests(nik)
        return NextResponse.json(result)
      }

      case "detail": {
        const id = searchParams.get("id")
        if (!id) {
          return NextResponse.json({ error: "ID required" }, { status: 400 })
        }

        const result = await getRequestById(id)
        return NextResponse.json(result)
      }

      case "history": {
        const id = searchParams.get("id")
        if (!id) {
          return NextResponse.json({ error: "ID required" }, { status: 400 })
        }

        const result = await getApprovalHistory(id)
        return NextResponse.json(result)
      }

      case "stats": {
        const role = searchParams.get("role") as UserRole
        const site = searchParams.get("site")
        const departemen = searchParams.get("departemen")

        if (!role || !site) {
          return NextResponse.json({ error: "Role and site required" }, { status: 400 })
        }

        const result = await getStatisticsForRole(role, site, departemen || undefined)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Workflow API] GET error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { action } = data

    switch (action) {
      case "create": {
        const result = await createLeaveRequest(data.payload)
        return NextResponse.json(result)
      }

      case "approve": {
        const { requestId, approverNik, approverRole, notes } = data
        const result = await approveRequest(requestId, approverNik, approverRole, notes || "")
        return NextResponse.json(result)
      }

      case "reject": {
        const { requestId, approverNik, approverRole, notes } = data
        if (!notes || notes.trim() === "") {
          return NextResponse.json({ success: false, error: "Rejection reason required" }, { status: 400 })
        }
        const result = await rejectRequest(requestId, approverNik, approverRole, notes)
        return NextResponse.json(result)
      }

      case "update-booking": {
        const { requestId, bookingCode, updatedBy } = data
        if (!bookingCode || bookingCode.trim() === "") {
          return NextResponse.json({ success: false, error: "Booking code required" }, { status: 400 })
        }
        const result = await updateBookingCode(requestId, bookingCode, updatedBy)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Workflow API] POST error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
