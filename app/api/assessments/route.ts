import type { NextRequest } from "next/server"
import {
  getAllAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  getAssessmentsByStatus,
  getAssessmentsByCreator,
  getAssessmentsBySite,
  getAssessmentsBySiteAndStatus,
  getAssessmentApprovals,
} from "@/lib/services/assessment-service"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const status = searchParams.get("status")
    const createdBy = searchParams.get("createdBy")
    const createdByNik = searchParams.get("createdByNik")
    const site = searchParams.get("site")

    let result

    if (id) {
      result = await getAssessmentById(id)
      if (result) {
        const approvalHistory = await getAssessmentApprovals(id)
        result.approvalHistory = approvalHistory
      }
      return successResponse(result)
    }

    if (site && status) {
      result = await getAssessmentsBySiteAndStatus(site, status)
    } else if (status) {
      result = await getAssessmentsByStatus(status)
    } else if (site) {
      result = await getAssessmentsBySite(site)
    } else if (createdBy || createdByNik) {
      const identifier = createdByNik || createdBy
      result = await getAssessmentsByCreator(identifier!)
    } else {
      result = await getAllAssessments()
    }

    // Batch fetch approval histories for list results
    if (Array.isArray(result)) {
      const resultsWithHistory = await Promise.all(
        result.map(async (assessment) => {
          const approvalHistory = await getAssessmentApprovals(assessment.id.toString())
          return { ...assessment, approvalHistory: approvalHistory || [] }
        }),
      )
      return successResponse(resultsWithHistory)
    }

    return successResponse(result)
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return errorResponse(error instanceof Error ? error : new Error("Terjadi kesalahan saat mengambil data assessment"))
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createAssessment(data)
    return successResponse(result)
  } catch (error) {
    console.error("Error creating assessment:", error)
    return errorResponse(error instanceof Error ? error : new Error("Terjadi kesalahan saat membuat assessment"))
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return errorResponse("ID assessment diperlukan", 400)
    }

    const result = await updateAssessment(id, updateData)
    return successResponse(result)
  } catch (error) {
    console.error("Error updating assessment:", error)
    return errorResponse(error instanceof Error ? error : new Error("Terjadi kesalahan saat mengupdate assessment"))
  }
}
