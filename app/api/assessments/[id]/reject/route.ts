import { type NextRequest, NextResponse } from "next/server"
import { rejectAssessment } from "@/lib/services/assessment-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { approverUserId, approverName, approverRole, notes } = await request.json()

    const result = await rejectAssessment(id, approverUserId, approverName, approverRole, notes)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error rejecting assessment:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Terjadi kesalahan saat menolak assessment",
      },
      { status: error instanceof Error && error.message.includes("tidak sesuai") ? 403 : 500 },
    )
  }
}
