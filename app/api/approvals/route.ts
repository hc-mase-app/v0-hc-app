import { type NextRequest, NextResponse } from "next/server"
import { getApprovalHistory, getApprovalHistoryByRequestId, addApprovalHistory } from "@/lib/neon-db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const requestId = searchParams.get("requestId")

    let result

    if (type === "by-request" && requestId) {
      result = await getApprovalHistoryByRequestId(requestId)
    } else {
      result = await getApprovalHistory()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching approvals:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await addApprovalHistory(data)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating approval:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
