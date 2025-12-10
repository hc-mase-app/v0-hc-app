import { type NextRequest, NextResponse } from "next/server"
import { getUserLeaveRequests } from "@/lib/leave-request-service"
import { mapDbRowToLeaveRequest } from "@/lib/db-mapper"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const nik = searchParams.get("nik")

    if (!nik) {
      return NextResponse.json({ error: "NIK parameter is required" }, { status: 400 })
    }

    const allLeaveRequests = await getUserLeaveRequests(nik)

    // Filter for periodic leave (Cuti Periodik) that is approved or has ticket issued
    const periodicLeaves = allLeaveRequests.filter(
      (leave: any) =>
        leave.jenis_cuti === "Cuti Periodik" &&
        (leave.status === "di_proses" || leave.status === "tiket_berangkat" || leave.status === "tiket_lengkap"),
    )

    // Sort by end date descending to get the most recent
    periodicLeaves.sort((a: any, b: any) => {
      const dateA = new Date(a.periode_akhir || a.tanggal_selesai)
      const dateB = new Date(b.periode_akhir || b.tanggal_selesai)
      return dateB.getTime() - dateA.getTime()
    })

    const mostRecent = periodicLeaves[0] || null
    const mappedData = mostRecent ? mapDbRowToLeaveRequest(mostRecent) : null

    return NextResponse.json({
      success: true,
      data: mappedData,
    })
  } catch (error) {
    console.error("[API] Error fetching previous leave:", error)
    return NextResponse.json({ error: "Failed to fetch previous leave data" }, { status: 500 })
  }
}
