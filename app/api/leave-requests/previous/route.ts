import { type NextRequest, NextResponse } from "next/server"
import { getUserLeaveRequests } from "@/lib/leave-request-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const nik = searchParams.get("nik")

    if (!nik) {
      return NextResponse.json({ error: "NIK parameter is required" }, { status: 400 })
    }

    const allLeaveRequests = await getUserLeaveRequests(nik)

    // Filter for periodic leave (Cuti Periodik) that is approved
    const periodicLeaves = allLeaveRequests.filter(
      (leave: any) =>
        leave.jenis_cuti === "Cuti Periodik" && (leave.status === "approved" || leave.status === "tiket_issued"),
    )

    // Sort by end date descending to get the most recent
    periodicLeaves.sort((a: any, b: any) => {
      return new Date(b.periode_akhir).getTime() - new Date(a.periode_akhir).getTime()
    })

    const mostRecent = periodicLeaves[0] || null

    return NextResponse.json({
      success: true,
      data: mostRecent,
    })
  } catch (error) {
    console.error("[API] Error fetching previous leave:", error)
    return NextResponse.json({ error: "Failed to fetch previous leave data" }, { status: 500 })
  }
}
