import { type NextRequest, NextResponse } from "next/server"
import {
  getPendingRequestsForRole,
  getAllRequestsForRole,
  getUserRequests,
  type UserRole,
} from "@/lib/approval-workflow"
import {
  getLeaveRequests,
  getLeaveRequestsByUserId,
  getLeaveRequestsSubmittedBy,
  getLeaveRequestsByStatus,
  getLeaveRequestsBySite,
  getLeaveRequestsBySiteDept,
  addLeaveRequest,
  updateLeaveRequest,
} from "@/lib/neon-db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const site = searchParams.get("site")
    const departemen = searchParams.get("departemen")
    const role = searchParams.get("role") as UserRole

    console.log("[v0] API GET - Full searchParams:", Object.fromEntries(searchParams))
    console.log("[v0] API GET - type:", type, "role:", role)

    let result

    if (type === "pending-dic" && role === "dic" && site && departemen) {
      console.log("[v0] Using workflow module for DIC pending requests")
      result = await getPendingRequestsForRole("dic", site, departemen)
    } else if (type === "pending-pjo" && role === "pjo_site" && site) {
      console.log("[v0] Using workflow module for PJO pending requests")
      result = await getPendingRequestsForRole("pjo_site", site)
    } else if (type === "pending-hr-ho" && role === "hr_ho") {
      console.log("[v0] Using workflow module for HR HO pending requests")
      result = await getPendingRequestsForRole("hr_ho", "HO")
    } else if (type === "all" && role && site) {
      console.log("[v0] Using workflow module for all requests by role")
      result = await getAllRequestsForRole(role, site, departemen || undefined)
    } else if (type === "user-requests" && userId) {
      console.log("[v0] Using workflow module for user requests")
      result = await getUserRequests(userId)
    } else if (type === "submitted-by" && userId) {
      result = await getLeaveRequestsSubmittedBy(userId)
    } else if (type === "user" && userId) {
      result = await getLeaveRequestsByUserId(userId)
    } else if (type === "status" && status) {
      result = await getLeaveRequestsByStatus(status)
    } else if (type === "site-dept" && site && departemen) {
      result = await getLeaveRequestsBySiteDept(site, departemen)
    } else if (type === "site" && site) {
      result = await getLeaveRequestsBySite(site)
    } else {
      result = await getLeaveRequests()
    }

    console.log("[v0] API GET - result count:", Array.isArray(result) ? result.length : "not array")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    if (!data.userNik && !data.nik) {
      return NextResponse.json({ error: "NIK karyawan diperlukan" }, { status: 400 })
    }
    if (!data.jenisCuti && !data.jenisPengajuanCuti) {
      return NextResponse.json({ error: "Jenis cuti diperlukan" }, { status: 400 })
    }
    if (!data.tanggalPengajuan) {
      return NextResponse.json({ error: "Tanggal pengajuan diperlukan" }, { status: 400 })
    }

    const result = await addLeaveRequest(data)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating leave request:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat membuat pengajuan cuti" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updates } = data

    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diupdate" }, { status: 400 })
    }

    const result = await updateLeaveRequest(id, updates)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error updating leave request:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat update pengajuan cuti" }, { status: 500 })
  }
}
