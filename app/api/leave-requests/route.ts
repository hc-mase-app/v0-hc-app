import { type NextRequest, NextResponse } from "next/server"
import {
  getPendingRequestsForDIC,
  getPendingRequestsForPJO,
  getPendingRequestsForHRHO,
  getRequestsForHRTicketing,
  getUserLeaveRequests,
  getRequestById,
  createLeaveRequest,
  updateBookingCode,
  getApprovalHistory,
  updateLeaveRequest, // Import new update function
} from "@/lib/leave-request-service"
import { processApproval } from "@/lib/workflow-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")
    const userRole = searchParams.get("userRole")
    const userSite = searchParams.get("userSite")
    const userDepartemen = searchParams.get("userDepartemen")
    const userNik = searchParams.get("userNik")
    const requestId = searchParams.get("requestId")

    let result

    switch (action) {
      case "pending-dic":
        if (!userSite || !userDepartemen) {
          return NextResponse.json({ error: "Site dan Departemen diperlukan" }, { status: 400 })
        }
        result = await getPendingRequestsForDIC(userSite, userDepartemen)
        break

      case "pending-pjo":
        if (!userSite) {
          return NextResponse.json({ error: "Site diperlukan" }, { status: 400 })
        }
        result = await getPendingRequestsForPJO(userSite)
        break

      case "pending-hr-ho":
        result = await getPendingRequestsForHRHO()
        break

      case "pending-ticketing":
        result = await getRequestsForHRTicketing()
        break

      case "user-requests":
        if (!userNik) {
          return NextResponse.json({ error: "NIK diperlukan" }, { status: 400 })
        }
        result = await getUserLeaveRequests(userNik)
        break

      case "detail":
        if (!requestId) {
          return NextResponse.json({ error: "Request ID diperlukan" }, { status: 400 })
        }
        result = await getRequestById(requestId)
        break

      case "history":
        if (!requestId) {
          return NextResponse.json({ error: "Request ID diperlukan" }, { status: 400 })
        }
        result = await getApprovalHistory(requestId)
        break

      default:
        return NextResponse.json({ error: "Action tidak valid" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { action } = data

    switch (action) {
      case "create":
        const result = await createLeaveRequest(data.payload)
        return NextResponse.json(result)

      case "approve":
      case "reject":
        const { requestId, approverNik, notes, level } = data
        const approval = await processApproval(
          requestId,
          approverNik,
          action === "approve" ? "approved" : "rejected",
          notes,
          level,
        )
        return approval.success
          ? NextResponse.json({ success: true })
          : NextResponse.json({ error: approval.error }, { status: 400 })

      case "update-booking":
        const { bookingCode } = data
        const updated = await updateBookingCode(data.requestId, bookingCode)
        return NextResponse.json(updated)

      default:
        return NextResponse.json({ error: "Action tidak valid" }, { status: 400 })
    }
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: "ID pengajuan diperlukan" }, { status: 400 })
    }

    const result = await updateLeaveRequest(id, updateData)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] Error in PUT:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
