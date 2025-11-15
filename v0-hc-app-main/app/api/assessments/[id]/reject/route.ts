import { type NextRequest, NextResponse } from "next/server"
import { getAssessmentById, updateAssessment, addAssessmentApproval } from "@/lib/neon-db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { approverUserId, approverName, approverRole, notes } = await request.json()

    console.log("[v0] Reject endpoint called with:", { id, approverRole, approverName })

    // Get current assessment
    const assessment = await getAssessmentById(id)

    if (!assessment) {
      return NextResponse.json({ error: "Assessment tidak ditemukan" }, { status: 404 })
    }

    // Verify approver role matches current status
    if (
      (assessment.status === "pending_pjo" && approverRole !== "pjo_site") ||
      (assessment.status === "pending_hr_site" && approverRole !== "hr_site")
    ) {
      console.error("[v0] ❌ Invalid status/role combination for rejection:", {
        currentStatus: assessment.status,
        approverRole,
      })
      return NextResponse.json(
        {
          error: "Role tidak sesuai untuk rejection ini",
        },
        { status: 403 },
      )
    }

    console.log("[v0] Updating assessment status to rejected")

    // Update assessment status to rejected
    await updateAssessment(id, { status: "rejected" })

    // Add approval history
    await addAssessmentApproval({
      assessmentId: id,
      approverNik: approverUserId,
      approverName,
      approverRole,
      action: "rejected",
      notes: notes || "Ditolak",
    })

    console.log("[v0] ✅ Assessment rejected successfully")

    return NextResponse.json({
      success: true,
      message: "Assessment ditolak",
    })
  } catch (error) {
    console.error("[v0] Error rejecting assessment:", error)
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat menolak assessment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
