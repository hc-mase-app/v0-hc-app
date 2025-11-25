import { type NextRequest, NextResponse } from "next/server"
import { getLeaveRequestsByUser } from "@/lib/neon-db"

// GET /api/leave-requests/previous?nik=XXX
// Get the most recent approved periodic leave for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const nik = searchParams.get("nik")

    if (!nik) {
      return NextResponse.json({ error: "NIK parameter is required" }, { status: 400 })
    }

    // Get all leave requests for this user
    const allLeaveRequests = await getLeaveRequestsByUser(nik)

    // Filter for periodic leave (Cuti Periodik) that is approved
    const periodicLeaves = allLeaveRequests.filter(
      (leave) =>
        leave.jenisCuti === "Cuti Periodik" && (leave.status === "approved" || leave.status === "tiket_issued"),
    )

    // Sort by end date (periodeAkhir) descending to get the most recent
    periodicLeaves.sort((a, b) => {
      return new Date(b.periodeAkhir).getTime() - new Date(a.periodeAkhir).getTime()
    })

    // Return the most recent one
    const mostRecent = periodicLeaves[0] || null

    return NextResponse.json({
      success: true,
      data: mostRecent,
    })
  } catch (error) {
    console.error("Error fetching previous leave:", error)
    return NextResponse.json({ error: "Failed to fetch previous leave data" }, { status: 500 })
  }
}
