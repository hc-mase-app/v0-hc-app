import { type NextRequest, NextResponse } from "next/server"
import { approveAssessment } from "@/lib/services/assessment-service"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { approverUserId, approverName, approverRole, notes } = await request.json()

    const result = await approveAssessment(id, approverUserId, approverName, approverRole, notes)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error approving assessment:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Terjadi kesalahan saat menyetujui assessment",
      },
      { status: error instanceof Error && error.message.includes("tidak sesuai") ? 403 : 500 },
    )
  }
}
