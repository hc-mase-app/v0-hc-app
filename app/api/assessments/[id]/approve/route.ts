import { type NextRequest, NextResponse } from "next/server"
import { getAssessmentById, updateAssessment, addAssessmentApproval } from "@/lib/neon-db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { approverUserId, approverName, approverRole, notes } = await request.json()

    console.log("[v0] Approve endpoint called with:", { id, approverRole, approverName })

    // Get current assessment
    const assessment = await getAssessmentById(id)

    if (!assessment) {
      return NextResponse.json({ error: "Assessment tidak ditemukan" }, { status: 404 })
    }

    console.log("[v0] Current assessment status:", assessment.status)

    // Determine next status based on current status and approver role
    let newStatus = assessment.status

    if (assessment.status === "pending_pjo" && approverRole === "pjo_site") {
      newStatus = "pending_hr_site"
    } else if (assessment.status === "pending_hr_site" && approverRole === "hr_site") {
      newStatus = "approved"
    } else {
      console.error("[v0] ❌ Invalid status/role combination:", {
        currentStatus: assessment.status,
        approverRole,
      })
      return NextResponse.json(
        {
          error: "Role tidak sesuai untuk approval ini",
        },
        { status: 403 },
      )
    }

    console.log("[v0] Updating assessment status from", assessment.status, "to", newStatus)

    // Update assessment status
    await updateAssessment(id, { status: newStatus })

    // Add approval history
    await addAssessmentApproval({
      assessmentId: id,
      approverNik: approverUserId,
      approverName,
      approverRole,
      action: "approved",
      notes: notes || "",
    })

    console.log("[v0] ✅ Assessment approved successfully")

    return NextResponse.json({
      success: true,
      newStatus,
      message: "Assessment berhasil disetujui",
    })
  } catch (error) {
    console.error("[v0] Error approving assessment:", error)
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat menyetujui assessment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
