import { type NextRequest, NextResponse } from "next/server"
import {
  getLeaveRequests,
  getLeaveRequestsByUserId,
  getLeaveRequestsSubmittedBy,
  getLeaveRequestsByStatus,
  getLeaveRequestsBySite,
  getLeaveRequestsBySiteDept,
  getPendingRequestsForDIC,
  getPendingRequestsForDICBySiteDept,
  getPendingRequestsForPJO,
  getPendingRequestsForHRHO,
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

    console.log("[v0] API GET - Full searchParams:", Object.fromEntries(searchParams))
    console.log("[v0] API GET - type:", type)
    console.log("[v0] API GET - site:", site, "| type:", typeof site, "| length:", site?.length)

    let result

    if (type === "submitted-by" && userId) {
      result = await getLeaveRequestsSubmittedBy(userId)
    } else if (type === "user" && userId) {
      result = await getLeaveRequestsByUserId(userId)
    } else if (type === "status" && status) {
      result = await getLeaveRequestsByStatus(status)
    } else if (type === "site-dept" && site && departemen) {
      result = await getLeaveRequestsBySiteDept(site, departemen)
    } else if (type === "site" && site) {
      console.log("[v0] API GET - calling getLeaveRequestsBySite with site:", site)
      result = await getLeaveRequestsBySite(site)
    } else if (type === "pending-dic" && site && departemen) {
      result = await getPendingRequestsForDICBySiteDept(site, departemen)
    } else if (type === "pending-dic" && site) {
      result = await getPendingRequestsForDIC(site)
    } else if (type === "pending-pjo" && site) {
      console.log("[v0] API GET - calling getPendingRequestsForPJO with site:", site)
      result = await getPendingRequestsForPJO(site)
    } else if (type === "pending-hr-ho") {
      result = await getPendingRequestsForHRHO()
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
