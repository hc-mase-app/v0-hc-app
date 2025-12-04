/**
 * Assessment Service
 * Clean architecture service layer for employee assessments
 */

import { sql } from "@/lib/neon-db"

// Constants for assessment criteria names
const KEPRIBADIAN_NAMES: Record<string, string> = {
  A1: "Tanggung Jawab",
  A2: "Kerja Sama",
  A3: "Inisiatif",
  A4: "Disiplin",
}

const PRESTASI_NAMES: Record<string, string> = {
  B1: "Kualitas Kerja",
  B2: "Kuantitas Kerja",
  B3: "Pengetahuan Kerja",
  B4: "Keandalan",
  B5: "Kehadiran",
  B6: "Komunikasi",
  B7: "Pemecahan Masalah",
  B8: "Kepemimpinan",
  B9: "Pengembangan Diri",
  B10: "Loyalitas",
}

// Transform database row to assessment object
function transformAssessmentData(dbAssessment: any) {
  if (!dbAssessment) return null

  const kepribadian = []
  for (let i = 1; i <= 4; i++) {
    const id = `A${i}`
    const score = Number.parseFloat(dbAssessment[`kepribadian_${i}_score`]) || 0
    const nilai = Number.parseFloat(dbAssessment[`kepribadian_${i}_nilai`]) || 0
    kepribadian.push({
      id: id,
      name: KEPRIBADIAN_NAMES[id] || `Kriteria ${id}`,
      score: score,
      calculatedScore: nilai,
    })
  }

  const prestasi = []
  for (let i = 1; i <= 10; i++) {
    const id = `B${i}`
    const score = Number.parseFloat(dbAssessment[`prestasi_${i}_score`]) || 0
    const nilai = Number.parseFloat(dbAssessment[`prestasi_${i}_nilai`]) || 0
    prestasi.push({
      id: id,
      name: PRESTASI_NAMES[id] || `Kriteria ${id}`,
      score: score,
      calculatedScore: nilai,
    })
  }

  const kehadiran = {
    sakit: Number.parseInt(dbAssessment.kehadiran_sakit) || 0,
    izin: Number.parseInt(dbAssessment.kehadiran_izin) || 0,
    alpa: Number.parseInt(dbAssessment.kehadiran_alpa) || 0,
    score: Number.parseFloat(dbAssessment.kehadiran_nilai) || 0,
  }

  const indisipliner = {
    teguran: 0,
    sp1: Number.parseInt(dbAssessment.indisipliner_sp1) || 0,
    sp2: Number.parseInt(dbAssessment.indisipliner_sp2) || 0,
    sp3: Number.parseInt(dbAssessment.indisipliner_sp3) || 0,
    score: Number.parseFloat(dbAssessment.indisipliner_nilai) || 0,
  }

  const recommendations = []
  if (dbAssessment.rekomendasi_perpanjang_kontrak) {
    recommendations.push({
      type: "perpanjangan_kontrak",
      selected: true,
      months: dbAssessment.rekomendasi_perpanjang_bulan || 12,
    })
  }
  if (dbAssessment.rekomendasi_pengangkatan_tetap) {
    recommendations.push({ type: "pengangkatan_tetap", selected: true })
  }
  if (dbAssessment.rekomendasi_promosi_jabatan) {
    recommendations.push({ type: "promosi", selected: true })
  }
  if (dbAssessment.rekomendasi_perubahan_gaji) {
    recommendations.push({ type: "perubahan_gaji", selected: true })
  }
  if (dbAssessment.rekomendasi_end_kontrak) {
    recommendations.push({ type: "end_kontrak", selected: true })
  }

  return {
    id: dbAssessment.id,
    employeeNik: dbAssessment.employee_nik,
    employeeName: dbAssessment.employee_name,
    employeeJabatan: dbAssessment.employee_jabatan,
    employeeDepartemen: dbAssessment.employee_departemen,
    employeeSite: dbAssessment.employee_site,
    employeeTanggalMasuk: dbAssessment.employee_tanggal_masuk,
    employeeStatus: dbAssessment.employee_status,
    assessmentPeriod: dbAssessment.assessment_period,
    kepribadian,
    prestasi,
    kehadiran,
    indisipliner,
    subtotal: Number.parseFloat(dbAssessment.subtotal) || 0,
    totalScore: Number.parseFloat(dbAssessment.total_score) || 0,
    grade: dbAssessment.grade,
    penalties:
      typeof dbAssessment.penalties === "string" ? JSON.parse(dbAssessment.penalties) : dbAssessment.penalties || {},
    strengths: dbAssessment.kelebihan,
    weaknesses: dbAssessment.kekurangan,
    recommendations,
    status: dbAssessment.status,
    createdByNik: dbAssessment.created_by_nik,
    createdByName: dbAssessment.created_by_name,
    createdByRole: dbAssessment.created_by_role,
    createdAt: dbAssessment.created_at,
    updatedAt: dbAssessment.updated_at,
  }
}

function transformApprovalHistory(dbHistory: any) {
  if (!dbHistory) return null
  return {
    id: dbHistory.id,
    assessmentId: dbHistory.assessment_id,
    approverNik: dbHistory.approver_nik,
    approverName: dbHistory.approver_name,
    approverRole: dbHistory.approver_role,
    action: dbHistory.action,
    notes: dbHistory.notes,
    timestamp: dbHistory.created_at,
    createdAt: dbHistory.created_at,
  }
}

// ============ GET OPERATIONS ============

export async function getAllAssessments() {
  const result = await sql`
    SELECT 
      id, employee_nik, employee_name, employee_jabatan, employee_departemen,
      employee_site, employee_tanggal_masuk, employee_status,
      kepribadian_1_score, kepribadian_1_nilai, kepribadian_2_score, kepribadian_2_nilai,
      kepribadian_3_score, kepribadian_3_nilai, kepribadian_4_score, kepribadian_4_nilai,
      kepribadian_total,
      prestasi_1_score, prestasi_1_nilai, prestasi_2_score, prestasi_2_nilai,
      prestasi_3_score, prestasi_3_nilai, prestasi_4_score, prestasi_4_nilai,
      prestasi_5_score, prestasi_5_nilai, prestasi_6_score, prestasi_6_nilai,
      prestasi_7_score, prestasi_7_nilai, prestasi_8_score, prestasi_8_nilai,
      prestasi_9_score, prestasi_9_nilai, prestasi_10_score, prestasi_10_nilai,
      prestasi_total,
      kehadiran_sakit, kehadiran_izin, kehadiran_alpa, kehadiran_nilai,
      indisipliner_sp1, indisipliner_sp2, indisipliner_sp3, indisipliner_nilai,
      subtotal, total_score, grade, penalties,
      kelebihan, kekurangan,
      rekomendasi_perpanjang_kontrak, rekomendasi_perpanjang_bulan,
      rekomendasi_pengangkatan_tetap, rekomendasi_promosi_jabatan,
      rekomendasi_perubahan_gaji, rekomendasi_end_kontrak,
      status, created_by_nik, created_by_name, created_by_role,
      created_at, updated_at
    FROM employee_assessments 
    ORDER BY created_at DESC
  `
  return result.map(transformAssessmentData)
}

export async function getAssessmentById(id: string) {
  const result = await sql`
    SELECT 
      id, employee_nik, employee_name, employee_jabatan, employee_departemen,
      employee_site, employee_tanggal_masuk, employee_status,
      kepribadian_1_score, kepribadian_1_nilai, kepribadian_2_score, kepribadian_2_nilai,
      kepribadian_3_score, kepribadian_3_nilai, kepribadian_4_score, kepribadian_4_nilai,
      kepribadian_total,
      prestasi_1_score, prestasi_1_nilai, prestasi_2_score, prestasi_2_nilai,
      prestasi_3_score, prestasi_3_nilai, prestasi_4_score, prestasi_4_nilai,
      prestasi_5_score, prestasi_5_nilai, prestasi_6_score, prestasi_6_nilai,
      prestasi_7_score, prestasi_7_nilai, prestasi_8_score, prestasi_8_nilai,
      prestasi_9_score, prestasi_9_nilai, prestasi_10_score, prestasi_10_nilai,
      prestasi_total,
      kehadiran_sakit, kehadiran_izin, kehadiran_alpa, kehadiran_nilai,
      indisipliner_sp1, indisipliner_sp2, indisipliner_sp3, indisipliner_nilai,
      subtotal, total_score, grade, penalties,
      kelebihan, kekurangan,
      rekomendasi_perpanjang_kontrak, rekomendasi_perpanjang_bulan,
      rekomendasi_pengangkatan_tetap, rekomendasi_promosi_jabatan,
      rekomendasi_perubahan_gaji, rekomendasi_end_kontrak,
      status, created_by_nik, created_by_name, created_by_role,
      created_at, updated_at
    FROM employee_assessments 
    WHERE id = ${id}
  `
  return transformAssessmentData(result[0])
}

export async function getAssessmentsByStatus(status: string) {
  const result = await sql`
    SELECT * FROM employee_assessments 
    WHERE status = ${status} 
    ORDER BY created_at DESC
  `
  return result.map(transformAssessmentData)
}

export async function getAssessmentsByCreator(creatorNik: string) {
  const result = await sql`
    SELECT * FROM employee_assessments 
    WHERE created_by_nik = ${creatorNik} 
    ORDER BY created_at DESC
  `
  return result.map(transformAssessmentData)
}

export async function getAssessmentsBySite(site: string) {
  const result = await sql`
    SELECT * FROM employee_assessments 
    WHERE employee_site = ${site} 
    ORDER BY created_at DESC
  `
  return result.map(transformAssessmentData)
}

export async function getAssessmentsBySiteAndStatus(site: string, status: string) {
  const result = await sql`
    SELECT * FROM employee_assessments 
    WHERE employee_site = ${site} AND status = ${status}
    ORDER BY created_at DESC
  `
  return result.map(transformAssessmentData)
}

// ============ APPROVAL HISTORY OPERATIONS ============

export async function getAssessmentApprovals(assessmentId: string) {
  const result = await sql`
    SELECT * FROM assessment_approvals 
    WHERE assessment_id = ${assessmentId} 
    ORDER BY created_at ASC
  `
  return result.map(transformApprovalHistory)
}

export async function addAssessmentApproval(approval: {
  assessmentId: string
  approverNik: string
  approverName: string
  approverRole: string
  action: string
  notes: string
}) {
  const result = await sql`
    INSERT INTO assessment_approvals (
      assessment_id, approver_nik, approver_name, approver_role, action, notes
    ) VALUES (
      ${approval.assessmentId}, ${approval.approverNik}, ${approval.approverName},
      ${approval.approverRole}, ${approval.action}, ${approval.notes}
    )
    RETURNING *
  `
  return transformApprovalHistory(result[0])
}

// ============ CREATE/UPDATE OPERATIONS ============

export async function createAssessment(data: any) {
  // Transform input data to database format
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

  const result = await sql`
    INSERT INTO employee_assessments (
      employee_nik, employee_name, employee_jabatan, employee_departemen,
      employee_site, employee_tanggal_masuk, employee_status,
      kepribadian_1_score, kepribadian_1_nilai, kepribadian_2_score, kepribadian_2_nilai,
      kepribadian_3_score, kepribadian_3_nilai, kepribadian_4_score, kepribadian_4_nilai,
      kepribadian_total,
      prestasi_1_score, prestasi_1_nilai, prestasi_2_score, prestasi_2_nilai,
      prestasi_3_score, prestasi_3_nilai, prestasi_4_score, prestasi_4_nilai,
      prestasi_5_score, prestasi_5_nilai, prestasi_6_score, prestasi_6_nilai,
      prestasi_7_score, prestasi_7_nilai, prestasi_8_score, prestasi_8_nilai,
      prestasi_9_score, prestasi_9_nilai, prestasi_10_score, prestasi_10_nilai,
      prestasi_total,
      kehadiran_sakit, kehadiran_izin, kehadiran_alpa, kehadiran_nilai,
      indisipliner_sp1, indisipliner_sp2, indisipliner_sp3, indisipliner_nilai,
      subtotal, total_score, grade, penalties,
      kelebihan, kekurangan,
      rekomendasi_perpanjang_kontrak, rekomendasi_perpanjang_bulan,
      rekomendasi_pengangkatan_tetap, rekomendasi_promosi_jabatan,
      rekomendasi_perubahan_gaji, rekomendasi_end_kontrak,
      status, created_by_nik, created_by_name, created_by_role
    )
    VALUES (
      ${dbData.employeeNik}, ${dbData.employeeName}, 
      ${dbData.employeeJabatan || null}, ${dbData.employeeDepartemen || null},
      ${dbData.employeeSite || null}, ${dbData.employeeTanggalMasuk || null}, 
      ${dbData.employeeStatus || null},
      ${dbData.kepribadian1Score || 0}, ${dbData.kepribadian1Nilai || 0},
      ${dbData.kepribadian2Score || 0}, ${dbData.kepribadian2Nilai || 0},
      ${dbData.kepribadian3Score || 0}, ${dbData.kepribadian3Nilai || 0},
      ${dbData.kepribadian4Score || 0}, ${dbData.kepribadian4Nilai || 0},
      ${dbData.kepribadianTotal || 0},
      ${dbData.prestasi1Score || 0}, ${dbData.prestasi1Nilai || 0},
      ${dbData.prestasi2Score || 0}, ${dbData.prestasi2Nilai || 0},
      ${dbData.prestasi3Score || 0}, ${dbData.prestasi3Nilai || 0},
      ${dbData.prestasi4Score || 0}, ${dbData.prestasi4Nilai || 0},
      ${dbData.prestasi5Score || 0}, ${dbData.prestasi5Nilai || 0},
      ${dbData.prestasi6Score || 0}, ${dbData.prestasi6Nilai || 0},
      ${dbData.prestasi7Score || 0}, ${dbData.prestasi7Nilai || 0},
      ${dbData.prestasi8Score || 0}, ${dbData.prestasi8Nilai || 0},
      ${dbData.prestasi9Score || 0}, ${dbData.prestasi9Nilai || 0},
      ${dbData.prestasi10Score || 0}, ${dbData.prestasi10Nilai || 0},
      ${dbData.prestasiTotal || 0},
      ${dbData.kehadiranSakit || 0}, ${dbData.kehadiranIzin || 0},
      ${dbData.kehadiranAlpa || 0}, ${dbData.kehadiranNilai || 0},
      ${dbData.indisiplinerSp1 || 0}, ${dbData.indisiplinerSp2 || 0},
      ${dbData.indisiplinerSp3 || 0}, ${dbData.indisiplinerNilai || 0},
      ${dbData.subtotal || 0}, ${dbData.totalScore || 0},
      ${dbData.grade || null}, ${JSON.stringify(dbData.penalties || {})},
      ${dbData.kelebihan || null}, ${dbData.kekurangan || null},
      ${dbData.rekomendasiPerpanjangKontrak || false},
      ${dbData.rekomendasiPerpanjangBulan || null},
      ${dbData.rekomendasiPengangkatanTetap || false},
      ${dbData.rekomendasiPromosiJabatan || false},
      ${dbData.rekomendasiPerubahanGaji || false},
      ${dbData.rekomendasiEndKontrak || false},
      ${dbData.status || "pending_pjo"}, ${dbData.createdByNik},
      ${dbData.createdByName || null}, ${dbData.createdByRole || null}
    )
    RETURNING *
  `
  return transformAssessmentData(result[0])
}

export async function updateAssessment(id: string, updates: { status?: string }) {
  if (updates.status !== undefined) {
    const result = await sql`
      UPDATE employee_assessments 
      SET status = ${updates.status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number.parseInt(id)}
      RETURNING *
    `
    if (!result || result.length === 0) {
      throw new Error(`Assessment with id ${id} not found`)
    }
    return transformAssessmentData(result[0])
  }
  return await getAssessmentById(id)
}

export async function deleteAssessment(id: string) {
  await sql`DELETE FROM employee_assessments WHERE id = ${id}`
}

// ============ WORKFLOW OPERATIONS ============

export async function approveAssessment(
  id: string,
  approverUserId: string,
  approverName: string,
  approverRole: string,
  notes?: string,
) {
  const assessment = await getAssessmentById(id)
  if (!assessment) {
    throw new Error("Assessment tidak ditemukan")
  }

  // Determine next status based on current status and approver role
  let newStatus = assessment.status
  if (assessment.status === "pending_pjo" && approverRole === "pjo_site") {
    newStatus = "pending_hr_site"
  } else if (assessment.status === "pending_hr_site" && approverRole === "hr_site") {
    newStatus = "approved"
  } else {
    throw new Error("Role tidak sesuai untuk approval ini")
  }

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

  return { success: true, newStatus, message: "Assessment berhasil disetujui" }
}

export async function rejectAssessment(
  id: string,
  approverUserId: string,
  approverName: string,
  approverRole: string,
  notes?: string,
) {
  const assessment = await getAssessmentById(id)
  if (!assessment) {
    throw new Error("Assessment tidak ditemukan")
  }

  // Verify approver role matches current status
  if (
    (assessment.status === "pending_pjo" && approverRole !== "pjo_site") ||
    (assessment.status === "pending_hr_site" && approverRole !== "hr_site")
  ) {
    throw new Error("Role tidak sesuai untuk rejection ini")
  }

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

  return { success: true, message: "Assessment ditolak" }
}
