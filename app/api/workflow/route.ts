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
import { ensureLeaveRequestsSchema } from "@/lib/db-migration"

let migrationChecked = false

export async function GET(request: NextRequest) {
  try {
    if (!migrationChecked) {
      console.log("[v0] Checking database schema...")
      const migrationResult = await ensureLeaveRequestsSchema()
      migrationChecked = true
      if (migrationResult.migrated) {
        console.log("[v0] Database schema updated successfully")
      }
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")

    console.log(`[v0] Workflow API GET - action: ${action}`)

    switch (action) {
      case "pending": {
        const role = searchParams.get("role") as UserRole
        const site = searchParams.get("site")
        const departemen = searchParams.get("departemen")

        if (!role || !site) {
          return NextResponse.json({ error: "Role and site required" }, { status: 400 })
        }

        console.log(`[v0] Fetching pending requests for role: ${role}, site: ${site}, dept: ${departemen}`)
        const result = await getPendingRequestsForRole(role, site, departemen || undefined)
        console.log(`[v0] Pending requests result:`, result.length, "rows")
        return NextResponse.json(Array.isArray(result) ? result : [])
      }

      case "all": {
        const role = searchParams.get("role") as UserRole
        const site = searchParams.get("site")
        const departemen = searchParams.get("departemen")

        if (!role || !site) {
          return NextResponse.json({ error: "Role and site required" }, { status: 400 })
        }

        console.log(`[v0] Fetching all requests for role: ${role}, site: ${site}, dept: ${departemen}`)
        const result = await getAllRequestsForRole(role, site, departemen || undefined)
        console.log(`[v0] All requests result:`, result.length, "rows")
        return NextResponse.json(Array.isArray(result) ? result : [])
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
    if (!migrationChecked) {
      console.log("[v0] Checking database schema...")
      const migrationResult = await ensureLeaveRequestsSchema()
      migrationChecked = true
      if (migrationResult.migrated) {
        console.log("[v0] Database schema updated successfully")
      }
    }

    const data = await request.json()
    const { action } = data

    console.log("[v0] Workflow API POST received:", { action, data })

    switch (action) {
      case "create": {
        const {
          nik,
          jenisCuti,
          tanggalPengajuan,
          periodeAwal,
          periodeAkhir,
          jumlahHari,
          berangkatDari,
          tujuan,
          tanggalKeberangkatan,
          cutiPeriodikBerikutnya,
          catatan,
          lamaOnsite,
          submittedBy,
          site,
          departemen,
        } = data

        if (!site || !departemen) {
          return NextResponse.json({ success: false, error: "Site and departemen are required" }, { status: 400 })
        }

        const result = await createLeaveRequest({
          nik,
          jenisCuti,
          tanggalPengajuan,
          periodeAwal,
          periodeAkhir,
          jumlahHari,
          berangkatDari,
          tujuan,
          tanggalKeberangkatan,
          cutiPeriodikBerikutnya,
          catatan,
          lamaOnsite,
          submittedBy,
          site,
          departemen,
        })

        console.log("[v0] Leave request creation result:", result)
        return NextResponse.json(result)
      }

      case "approve": {
        const { requestId, approverNik, approverRole, notes } = data
        const result = await approveRequest(requestId, approverNik, approverRole, notes || "")
        console.log("[v0] Approval result:", result)
        return NextResponse.json(result)
      }

      case "reject": {
        const { requestId, approverNik, approverRole, notes } = data
        if (!notes || notes.trim() === "") {
          return NextResponse.json({ success: false, error: "Rejection reason required" }, { status: 400 })
        }
        const result = await rejectRequest(requestId, approverNik, approverRole, notes)
        console.log("[v0] Rejection result:", result)
        return NextResponse.json(result)
      }

      case "update-booking": {
        const { requestId, bookingCode, namaPesawat, jamKeberangkatan, updatedBy } = data
        if (!bookingCode || bookingCode.trim() === "") {
          return NextResponse.json({ success: false, error: "Booking code required" }, { status: 400 })
        }
        const result = await updateBookingCode(requestId, bookingCode, namaPesawat, jamKeberangkatan, updatedBy)
        console.log("[v0] Booking code update result:", result)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Workflow API POST error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
