import type { NextRequest } from "next/server"
import {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  getAssessmentsByStatus,
  getAssessmentsByCreator,
  getAssessmentsBySite,
  getAssessmentsBySiteAndStatus,
  getAssessmentApprovals,
} from "@/lib/neon-db"
import { successResponse, errorResponse, withErrorHandling } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const status = searchParams.get("status")
    const createdBy = searchParams.get("createdBy")
    const createdByNik = searchParams.get("createdByNik")
    const site = searchParams.get("site")

    let result
    const error: Error | null = null

    if (id) {
      const [fetchedData, fetchError] = await withErrorHandling(() => getAssessmentById(id))
      if (fetchError) return errorResponse(fetchError)

      result = fetchedData
      if (result) {
        const [approvalHistory, approvalError] = await withErrorHandling(() => getAssessmentApprovals(id))
        if (!approvalError) {
          result.approvalHistory = approvalHistory
        }
      }
    } else if (site && status) {
      const [fetchedData, fetchError] = await withErrorHandling(() => getAssessmentsBySiteAndStatus(site, status))
      if (fetchError) return errorResponse(fetchError)
      result = fetchedData
    } else if (status) {
      const [fetchedData, fetchError] = await withErrorHandling(() => getAssessmentsByStatus(status))
      if (fetchError) return errorResponse(fetchError)
      result = fetchedData
    } else if (site) {
      const [fetchedData, fetchError] = await withErrorHandling(() => getAssessmentsBySite(site))
      if (fetchError) return errorResponse(fetchError)
      result = fetchedData
    } else if (createdBy || createdByNik) {
      const identifier = createdByNik || createdBy
      const [fetchedData, fetchError] = await withErrorHandling(() => getAssessmentsByCreator(identifier!))
      if (fetchError) return errorResponse(fetchError)
      result = fetchedData
    } else {
      const [fetchedData, fetchError] = await withErrorHandling(() => getAssessments())
      if (fetchError) return errorResponse(fetchError)
      result = fetchedData
    }

    if (Array.isArray(result)) {
      // Extract all assessment IDs
      const assessmentIds = result.map((assessment) => assessment.id)

      // Batch fetch all approval histories in one query
      const allApprovalHistories = await Promise.all(
        assessmentIds.map((id) => withErrorHandling(() => getAssessmentApprovals(id))),
      )

      // Map approval histories back to assessments
      const resultsWithHistory = result.map((assessment, index) => {
        const [approvalHistory] = allApprovalHistories[index]
        return { ...assessment, approvalHistory: approvalHistory || [] }
      })

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

    console.log("[v0] Received assessment data:", data)

    const kepribadianData: any = {}
    if (data.kepribadian && Array.isArray(data.kepribadian)) {
      data.kepribadian.forEach((item: any, index: number) => {
        const num = index + 1
        kepribadianData[`kepribadian${num}Score`] = item.score || 0
        kepribadianData[`kepribadian${num}Nilai`] = item.calculatedScore || item.score * item.weight || 0
      })
      kepribadianData.kepribadianTotal = data.kepribadian.reduce(
        (sum: number, item: any) => sum + (item.calculatedScore || item.score * item.weight || 0),
        0,
      )
    }

    const prestasiData: any = {}
    if (data.prestasi && Array.isArray(data.prestasi)) {
      data.prestasi.forEach((item: any, index: number) => {
        const num = index + 1
        prestasiData[`prestasi${num}Score`] = item.score || 0
        prestasiData[`prestasi${num}Nilai`] = item.calculatedScore || item.score * item.weight || 0
      })
      prestasiData.prestasiTotal = data.prestasi.reduce(
        (sum: number, item: any) => sum + (item.calculatedScore || item.score * item.weight || 0),
        0,
      )
    }

    const kehadiranData: any = {}
    if (data.kehadiran) {
      kehadiranData.kehadiranSakit = data.kehadiran.sakit || 0
      kehadiranData.kehadiranIzin = data.kehadiran.izin || 0
      kehadiranData.kehadiranAlpa = data.kehadiran.alpa || 0
      kehadiranData.kehadiranNilai = data.kehadiran.score || 0
    }

    const indisiplinerData: any = {}
    if (data.indisipliner) {
      indisiplinerData.indisiplinerSp1 = data.indisipliner.sp1 || 0
      indisiplinerData.indisiplinerSp2 = data.indisipliner.sp2 || 0
      indisiplinerData.indisiplinerSp3 = data.indisipliner.sp3 || 0
      indisiplinerData.indisiplinerNilai = data.indisipliner.score || 0
    }

    const subtotal =
      (kepribadianData.kepribadianTotal || 0) +
      (prestasiData.prestasiTotal || 0) +
      (kehadiranData.kehadiranNilai || 0) +
      (indisiplinerData.indisiplinerNilai || 0)

    const recommendationsData: any = {}
    if (data.recommendations && Array.isArray(data.recommendations)) {
      data.recommendations.forEach((rec: any) => {
        if (rec.type === "perpanjangan_kontrak") {
          recommendationsData.rekomendasiPerpanjangKontrak = rec.selected || false
          recommendationsData.rekomendasiPerpanjangBulan = rec.months || null
        } else if (rec.type === "pengangkatan_tetap") {
          recommendationsData.rekomendasiPengangkatanTetap = rec.selected || false
        } else if (rec.type === "promosi") {
          recommendationsData.rekomendasiPromosiJabatan = rec.selected || false
        } else if (rec.type === "perubahan_gaji") {
          recommendationsData.rekomendasiPerubahanGaji = rec.selected || false
        } else if (rec.type === "end_kontrak") {
          recommendationsData.rekomendasiEndKontrak = rec.selected || false
        }
      })
    }

    const dbData = {
      employeeNik: data.employeeNik,
      employeeName: data.employeeName,
      employeeJabatan: data.employeeJabatan,
      employeeDepartemen: data.employeeDepartemen,
      employeeSite: data.employeeSite,
      employeeTanggalMasuk: data.employeeTanggalMasuk,
      employeeStatus: data.employeeStatus,
      ...kepribadianData,
      ...prestasiData,
      ...kehadiranData,
      ...indisiplinerData,
      subtotal: subtotal,
      totalScore: data.totalScore || 0,
      grade: data.grade,
      penalties: data.penalties || {},
      kelebihan: data.strengths || null,
      kekurangan: data.weaknesses || null,
      ...recommendationsData,
      status: data.status || "pending_pjo",
      createdByNik: data.createdByNik || data.createdBy,
      createdByName: data.createdByName,
      createdByRole: data.createdByRole,
    }

    console.log("[v0] Converted to database format:", dbData)

    const [result, error] = await withErrorHandling(() => createAssessment(dbData))
    if (error) return errorResponse(error)

    return successResponse(result)
  } catch (error) {
    console.error("[v0] Error creating assessment:", error)
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

    const [result, error] = await withErrorHandling(() => updateAssessment(id, updateData))
    if (error) return errorResponse(error)

    return successResponse(result)
  } catch (error) {
    console.error("Error updating assessment:", error)
    return errorResponse(error instanceof Error ? error : new Error("Terjadi kesalahan saat mengupdate assessment"))
  }
}
