import { neon } from "@neondatabase/serverless"
import { mapDbRowToLeaveRequest, mapDbRowsToLeaveRequests } from "./db-mapper"

const sql = neon(process.env.DATABASE_URL || "")

const KEPRIBADIAN_NAMES: Record<string, string> = {
  A1: "Inisiatif & Kreativitas",
  A2: "Kedisiplinan & Kerajinan",
  A3: "Komunikasi & Etika Kerja",
  A4: "Tanggung Jawab & Motivasi",
}

const PRESTASI_NAMES: Record<string, string> = {
  B1: "Pengetahuan & Kemampuan",
  B2: "Efisiensi & Efektivitas Kerja",
  B3: "Kecepatan & Ketelitian Kerja",
  B4: "Kualitas & Kerjasama Tim",
  B5: "Hasil & Pencapaian Target Kerja",
  B6: "Penguasaan Sistem & Administrasi",
  B7: "Pencatatan, Penyimpanan, dan Pengarsipan Kebutuhan Kerja",
  B8: "Pemahaman & Pengoperasian Unit",
  B9: "Perawatan Unit & Alat Kerja",
  B10: "Kebersihan & Kepedulian K3",
}

function transformUserData(dbUser: any) {
  if (!dbUser) return null

  return {
    id: dbUser.id,
    nik: dbUser.nik,
    nama: dbUser.name, // database column is 'name', frontend expects 'nama'
    email: dbUser.email,
    password: dbUser.password,
    role: dbUser.role,
    site: dbUser.site,
    jabatan: dbUser.jabatan,
    departemen: dbUser.departemen,
    poh: dbUser.poh,
    statusKaryawan: dbUser.status_karyawan,
    noKtp: dbUser.no_ktp,
    noTelp: dbUser.no_telp,
    tanggalLahir: dbUser.tanggal_lahir,
    jenisKelamin: dbUser.jenis_kelamin,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  }
}

function transformApprovalHistory(dbHistory: any) {
  if (!dbHistory) return null

  return {
    id: dbHistory.id,
    leaveRequestId: dbHistory.leave_request_id,
    approverNik: dbHistory.approver_nik,
    approverName: dbHistory.approver_name,
    approverRole: dbHistory.approver_role,
    action: dbHistory.action,
    notes: dbHistory.notes,
    timestamp: dbHistory.created_at,
    createdAt: dbHistory.created_at,
  }
}

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

  // Reconstruct kehadiran object
  const kehadiran = {
    sakit: Number.parseInt(dbAssessment.kehadiran_sakit) || 0,
    izin: Number.parseInt(dbAssessment.kehadiran_izin) || 0,
    alpa: Number.parseInt(dbAssessment.kehadiran_alpa) || 0,
    score: Number.parseFloat(dbAssessment.kehadiran_nilai) || 0,
  }

  // Reconstruct indisipliner object
  const indisipliner = {
    teguran: 0,
    sp1: Number.parseInt(dbAssessment.indisipliner_sp1) || 0,
    sp2: Number.parseInt(dbAssessment.indisipliner_sp2) || 0,
    sp3: Number.parseInt(dbAssessment.indisipliner_sp3) || 0,
    score: Number.parseFloat(dbAssessment.indisipliner_nilai) || 0,
  }

  // Reconstruct recommendations array
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

  const transformed = {
    id: dbAssessment.id,
    employeeNik: dbAssessment.employee_nik,
    employeeName: dbAssessment.employee_name,
    employeeJabatan: dbAssessment.employee_jabatan,
    employeeDepartemen: dbAssessment.employee_departemen,
    employeeSite: dbAssessment.employee_site,
    employeeTanggalMasuk: dbAssessment.employee_tanggal_masuk,
    employeeStatus: dbAssessment.employee_status,
    assessmentPeriod: dbAssessment.assessment_period,

    // Converted arrays/objects
    kepribadian: kepribadian,
    prestasi: prestasi,
    kehadiran: kehadiran,
    indisipliner: indisipliner,

    // Scoring
    subtotal: Number.parseFloat(dbAssessment.subtotal) || 0,
    totalScore: Number.parseFloat(dbAssessment.total_score) || 0,
    grade: dbAssessment.grade,
    penalties:
      typeof dbAssessment.penalties === "string" ? JSON.parse(dbAssessment.penalties) : dbAssessment.penalties || {},

    // Kelebihan & Kekurangan
    strengths: dbAssessment.kelebihan,
    weaknesses: dbAssessment.kekurangan,

    // Recommendations
    recommendations: recommendations,

    // Workflow
    status: dbAssessment.status,
    createdByNik: dbAssessment.created_by_nik,
    createdByName: dbAssessment.created_by_name,
    createdByRole: dbAssessment.created_by_role,
    createdAt: dbAssessment.created_at,
    updatedAt: dbAssessment.updated_at,
  }

  console.log("[v0] Transformed assessment data:", {
    id: transformed.id,
    kepribadianCount: transformed.kepribadian.length,
    prestasiCount: transformed.prestasi.length,
    kepribadianSample: transformed.kepribadian[0],
    prestasiSample: transformed.prestasi[0],
  })

  return transformed
}

function transformAssessmentApprovalHistory(dbHistory: any) {
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

// ============ USER OPERATIONS ============

export async function getUsers() {
  try {
    const result = await sql`SELECT * FROM users ORDER BY created_at DESC`
    return result.map(transformUserData)
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function getUserById(id: string) {
  try {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`
    return transformUserData(result[0])
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function getUserByNik(nik: string) {
  try {
    console.log("[v0] getUserByNik called with NIK:", nik)
    const trimmedNik = nik.trim()
    const result = await sql`SELECT * FROM users WHERE UPPER(TRIM(nik)) = UPPER(${trimmedNik})`
    console.log("[v0] getUserByNik result:", result.length > 0 ? "User found" : "User not found")
    if (result.length > 0) {
      console.log("[v0] User data:", { nik: result[0].nik, email: result[0].email, role: result[0].role })
    }
    return transformUserData(result[0])
  } catch (error) {
    console.error("[v0] Error fetching user by NIK:", error)
    return null
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`
    return transformUserData(result[0])
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

export async function getUsersByRole(role: string) {
  try {
    const result = await sql`SELECT * FROM users WHERE role = ${role} ORDER BY name`
    return result.map(transformUserData)
  } catch (error) {
    console.error("Error fetching users by role:", error)
    return []
  }
}

export async function getUsersBySite(site: string) {
  try {
    const result = await sql`SELECT * FROM users WHERE site = ${site} ORDER BY name`
    return result.map(transformUserData)
  } catch (error) {
    console.error("Error fetching users by site:", error)
    return []
  }
}

export async function addUser(user: any) {
  try {
    console.log("[v0] addUser called with data:", {
      nik: user.nik,
      name: user.name,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
    })

    const tanggalLahir = user.tanggalLahir || user.tanggal_lahir || "1970-01-01"
    const jenisKelamin = user.jenisKelamin || user.jenis_kelamin || "Laki-laki"
    const statusKaryawan = user.statusKaryawan || user.status_karyawan || "Tetap"
    const site = user.site || "HO"
    const jabatan = user.jabatan || "Staff"
    const departemen = user.departemen || "General"
    const poh = user.poh || "Head Office"
    const noKtp = user.noKtp || user.no_ktp || "0000000000000000"
    const noTelp = user.noTelp || user.no_telp || "08000000000"

    const result = await sql`
      INSERT INTO users (
        nik, name, email, password, role, site, jabatan, departemen, poh, 
        status_karyawan, no_ktp, no_telp, tanggal_lahir, jenis_kelamin
      )
      VALUES (
        ${user.nik}, 
        ${user.name}, 
        ${user.email}, 
        ${user.password}, 
        ${user.role}, 
        ${site}, 
        ${jabatan}, 
        ${departemen}, 
        ${poh},
        ${statusKaryawan}, 
        ${noKtp}, 
        ${noTelp}, 
        ${tanggalLahir}, 
        ${jenisKelamin}
      )
      RETURNING *
    `
    console.log("[v0] User created successfully with ID:", result[0].id)
    return transformUserData(result[0])
  } catch (error) {
    console.error("[v0] Error adding user:", error)
    throw error
  }
}

export async function updateUser(id: string, updates: any) {
  try {
    const fields = Object.keys(updates)
    const values = Object.values(updates)

    // Convert camelCase to snake_case for database columns
    const dbFields = fields.map((key) => key.replace(/([A-Z])/g, "_$1").toLowerCase())

    // Build SET clause parts
    const setClauses = dbFields.map((field, index) => `${field} = $${index + 1}`).join(", ")

    // Use sql.query for dynamic queries with placeholders
    const queryText = `
      UPDATE users 
      SET ${setClauses}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${values.length + 1}
      RETURNING *
    `

    const result = await sql.query(queryText, [...values, id])
    return transformUserData(result.rows[0])
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(id: string) {
  try {
    await sql`DELETE FROM users WHERE id = ${id}`
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

// ============ LEAVE REQUEST OPERATIONS ============

export async function getLeaveRequests() {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      ORDER BY lr.created_at DESC
    `
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("Error fetching leave requests:", error)
    return []
  }
}

export async function getLeaveRequestById(id: string) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.id = ${id}
    `
    return result[0] ? mapDbRowToLeaveRequest(result[0]) : null
  } catch (error) {
    console.error("Error fetching leave request:", error)
    return null
  }
}

export async function getLeaveRequestsByUserId(userId: string) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.nik = ${userId}
      ORDER BY lr.created_at DESC
    `
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("Error fetching leave requests by user:", error)
    return []
  }
}

export async function getLeaveRequestsBySite(site: string) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE u.site = ${site}
      ORDER BY lr.created_at DESC
    `
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("Error fetching leave requests by site:", error)
    return []
  }
}

export async function getLeaveRequestsByStatus(status: string) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = ${status}
      ORDER BY lr.created_at DESC
    `
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("Error fetching leave requests by status:", error)
    return []
  }
}

export async function getPendingRequestsForDIC(site: string) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'pending_dic' AND u.site = ${site}
      ORDER BY lr.created_at DESC
    `
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("Error fetching pending requests for DIC:", error)
    return []
  }
}

export async function getPendingRequestsForDICBySiteDept(site: string, departemen: string) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'pending_dic' AND u.site = ${site} AND u.departemen = ${departemen}
      ORDER BY lr.created_at DESC
    `
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("Error fetching pending requests for DIC by site/dept:", error)
    return []
  }
}

export async function getPendingRequestsForPJO(site: string) {
  try {
    console.log("\n========== getPendingRequestsForPJO DEBUG START ==========")
    console.log("[v0] Input site parameter:", site)
    console.log("[v0] Input site type:", typeof site)
    console.log("[v0] Input site length:", site?.length)
    console.log("[v0] Input site JSON:", JSON.stringify(site))

    if (!site || site.trim() === "") {
      console.error("[v0] ❌ EMPTY SITE PARAMETER!")
      console.log("========== getPendingRequestsForPJO DEBUG END (EMPTY) ==========\n")
      return []
    }

    const trimmedSite = site.trim().toUpperCase()
    console.log("[v0] Trimmed & uppercase site:", trimmedSite)

    const query = `
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'pending_pjo' AND UPPER(u.site) = '${trimmedSite}'
      ORDER BY lr.created_at DESC
    `
    console.log("[v0] SQL Query:", query)

    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'pending_pjo' AND UPPER(u.site) = ${trimmedSite}
      ORDER BY lr.created_at DESC
    `

    console.log("[v0] ✅ Query executed successfully")
    console.log("[v0] Result count:", result.length)

    if (result.length > 0) {
      console.log("[v0] First 3 records:")
      result.slice(0, 3).forEach((r, i) => {
        console.log(`  [${i}]`, {
          id: r.id,
          nik: r.nik,
          status: r.status,
          site: r.site,
          name: r.name,
        })
      })
    }

    const transformed = mapDbRowsToLeaveRequests(result)
    console.log("[v0] Transformed count:", transformed.length)
    console.log("========== getPendingRequestsForPJO DEBUG END (SUCCESS) ==========\n")
    return transformed
  } catch (error) {
    console.error("========== getPendingRequestsForPJO ERROR ==========")
    console.error("[v0] ❌ Error:", String(error))
    console.error("[v0] Error type:", error?.constructor?.name)
    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack?.split("\n").slice(0, 5).join("\n"))
    }
    console.error("==========================================================\n")
    return []
  }
}

export async function getPendingRequestsForHRHO() {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'pending_hr_ho'
      ORDER BY lr.created_at DESC
    `
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("Error fetching pending requests for HR HO:", error)
    return []
  }
}

export async function getApprovedRequests() {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'approved'
      ORDER BY lr.created_at DESC
    `
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("Error fetching approved requests:", error)
    return []
  }
}

export async function addLeaveRequest(request: any) {
  try {
    console.log("[v0] addLeaveRequest called with data:", request)

    // Only inserting columns that exist in the database schema
    const result = await sql`
      INSERT INTO leave_requests (
        nik, jenis_cuti, tanggal_pengajuan, periode_awal,
        periode_akhir, jumlah_hari, berangkat_dari, tujuan,
        tanggal_keberangkatan, cuti_periodik_berikutnya, catatan, status, submitted_by
      ) VALUES (
        ${request.userNik || request.nik}, 
        ${request.jenisCuti || request.jenisPengajuanCuti}, 
        ${request.tanggalPengajuan}, 
        ${request.periodeAwal || request.tanggalMulai}, 
        ${request.periodeAkhir || request.tanggalSelesai}, 
        ${request.jumlahHari}, 
        ${request.berangkatDari || null}, 
        ${request.tujuan || null},
        ${request.tanggalKeberangkatan || request.periodeAwal || request.tanggalMulai || null}, 
        ${request.cutiPeriodikBerikutnya || request.tanggalCutiPeriodikBerikutnya || null}, 
        ${request.catatan || null}, 
        ${request.status || "pending_dic"}, 
        ${request.submittedBy || null}
      )
      RETURNING *
    `
    console.log("[v0] Leave request created successfully with ID:", result[0].id)
    return result[0]
  } catch (error) {
    console.error("[v0] Error adding leave request:", error)
    throw error
  }
}

export async function updateLeaveRequest(id: string, updates: any) {
  try {
    console.log("[v0] updateLeaveRequest called with id:", id, "updates:", updates)

    const fields = Object.keys(updates)
    const values = Object.values(updates)

    // Convert camelCase to snake_case for database columns
    const dbFields = fields.map((key) => key.replace(/([A-Z])/g, "_$1").toLowerCase())

    // Build SET clause parts
    const setClauses = dbFields.map((field, index) => `${field} = $${index + 1}`).join(", ")

    // Use sql.query for dynamic queries with placeholders
    const queryText = `
      UPDATE leave_requests 
      SET ${setClauses}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${values.length + 1}
      RETURNING *
    `

    console.log("[v0] Executing query:", queryText, "with values:", [...values, id])
    const result = await sql.query(queryText, [...values, id])
    console.log("[v0] Update successful, result:", result.rows[0])
    return result.rows[0]
  } catch (error) {
    console.error("[v0] Error updating leave request:", error)
    throw error
  }
}

export async function deleteLeaveRequest(id: string) {
  try {
    await sql`DELETE FROM leave_requests WHERE id = ${id}`
  } catch (error) {
    console.error("Error deleting leave request:", error)
    throw error
  }
}

export async function getLeaveRequestsSubmittedBy(userId: string) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.submitted_by = ${userId}
      ORDER BY lr.created_at DESC
    `
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("Error fetching leave requests submitted by user:", error)
    return []
  }
}

export async function getLeaveRequestsBySiteDept(site: string, departemen: string) {
  try {
    console.log("[v0] getLeaveRequestsBySiteDept called with site:", site, "departemen:", departemen)
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE u.site = ${site} AND u.departemen = ${departemen}
      ORDER BY lr.created_at DESC
    `
    console.log("[v0] getLeaveRequestsBySiteDept found", result.length, "requests")
    return mapDbRowsToLeaveRequests(result)
  } catch (error) {
    console.error("[v0] Error fetching leave requests by site/dept:", error)
    return []
  }
}

// ============ APPROVAL HISTORY OPERATIONS ============

export async function getApprovalHistory() {
  try {
    const result = await sql`SELECT * FROM approval_history ORDER BY created_at DESC`
    return result.map(transformApprovalHistory)
  } catch (error) {
    console.error("Error fetching approval history:", error)
    return []
  }
}

export async function getApprovalHistoryByRequestId(requestId: string) {
  try {
    const result = await sql`
      SELECT * FROM approval_history 
      WHERE leave_request_id = ${requestId} 
      ORDER BY created_at ASC
    `
    return result.map(transformApprovalHistory)
  } catch (error) {
    console.error("Error fetching approval history by request:", error)
    return []
  }
}

export async function addApprovalHistory(history: any) {
  try {
    const result = await sql`
      INSERT INTO approval_history (
        leave_request_id, approver_nik, approver_name, approver_role, action, notes
      )
      VALUES (
        ${history.leaveRequestId}, ${history.approverNik}, ${history.approverName}, 
        ${history.approverRole}, ${history.action}, ${history.notes || null}
      )
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error adding approval history:", error)
    throw error
  }
}

// ============ ASSESSMENT OPERATIONS ============

export async function getAssessments() {
  try {
    const result = await sql`SELECT * FROM employee_assessments ORDER BY created_at DESC`
    return result.map(transformAssessmentData)
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return []
  }
}

export async function getAssessmentById(id: string) {
  try {
    const result = await sql`SELECT * FROM employee_assessments WHERE id = ${id}`
    return transformAssessmentData(result[0])
  } catch (error) {
    console.error("Error fetching assessment:", error)
    return null
  }
}

export async function getAssessmentsByStatus(status: string) {
  try {
    const result = await sql`
      SELECT * FROM employee_assessments 
      WHERE status = ${status} 
      ORDER BY created_at DESC
    `
    return result.map(transformAssessmentData)
  } catch (error) {
    console.error("Error fetching assessments by status:", error)
    return []
  }
}

export async function getAssessmentsByCreator(creatorNik: string) {
  try {
    const result = await sql`
      SELECT * FROM employee_assessments 
      WHERE created_by_nik = ${creatorNik} 
      ORDER BY created_at DESC
    `
    return result.map(transformAssessmentData)
  } catch (error) {
    console.error("Error fetching assessments by creator:", error)
    return []
  }
}

export async function getAssessmentsBySite(site: string) {
  try {
    const result = await sql`
      SELECT * FROM employee_assessments 
      WHERE employee_site = ${site} 
      ORDER BY created_at DESC
    `
    return result.map(transformAssessmentData)
  } catch (error) {
    console.error("Error fetching assessments by site:", error)
    return []
  }
}

export async function getAssessmentsBySiteAndStatus(site: string, status: string) {
  try {
    console.log("[v0] getAssessmentsBySiteAndStatus called with site:", site, "status:", status)
    const result = await sql`
      SELECT * FROM employee_assessments 
      WHERE employee_site = ${site} AND status = ${status}
      ORDER BY created_at DESC
    `
    console.log("[v0] Found", result.length, "assessments")
    return result.map(transformAssessmentData)
  } catch (error) {
    console.error("Error fetching assessments by site and status:", error)
    return []
  }
}

export async function createAssessment(assessment: any) {
  try {
    console.log("[v0] createAssessment called with data:", {
      employeeNik: assessment.employeeNik,
      employeeName: assessment.employeeName,
      status: assessment.status,
    })

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
        ${assessment.employeeNik}, ${assessment.employeeName}, 
        ${assessment.employeeJabatan || null}, ${assessment.employeeDepartemen || null},
        ${assessment.employeeSite || null}, ${assessment.employeeTanggalMasuk || null}, 
        ${assessment.employeeStatus || null},
        ${assessment.kepribadian1Score || 0}, ${assessment.kepribadian1Nilai || 0},
        ${assessment.kepribadian2Score || 0}, ${assessment.kepribadian2Nilai || 0},
        ${assessment.kepribadian3Score || 0}, ${assessment.kepribadian3Nilai || 0},
        ${assessment.kepribadian4Score || 0}, ${assessment.kepribadian4Nilai || 0},
        ${assessment.kepribadianTotal || 0},
        ${assessment.prestasi1Score || 0}, ${assessment.prestasi1Nilai || 0},
        ${assessment.prestasi2Score || 0}, ${assessment.prestasi2Nilai || 0},
        ${assessment.prestasi3Score || 0}, ${assessment.prestasi3Nilai || 0},
        ${assessment.prestasi4Score || 0}, ${assessment.prestasi4Nilai || 0},
        ${assessment.prestasi5Score || 0}, ${assessment.prestasi5Nilai || 0},
        ${assessment.prestasi6Score || 0}, ${assessment.prestasi6Nilai || 0},
        ${assessment.prestasi7Score || 0}, ${assessment.prestasi7Nilai || 0},
        ${assessment.prestasi8Score || 0}, ${assessment.prestasi8Nilai || 0},
        ${assessment.prestasi9Score || 0}, ${assessment.prestasi9Nilai || 0},
        ${assessment.prestasi10Score || 0}, ${assessment.prestasi10Nilai || 0},
        ${assessment.prestasiTotal || 0},
        ${assessment.kehadiranSakit || 0}, ${assessment.kehadiranIzin || 0},
        ${assessment.kehadiranAlpa || 0}, ${assessment.kehadiranNilai || 0},
        ${assessment.indisiplinerSp1 || 0}, ${assessment.indisiplinerSp2 || 0},
        ${assessment.indisiplinerSp3 || 0}, ${assessment.indisiplinerNilai || 0},
        ${assessment.subtotal || 0}, ${assessment.totalScore || 0},
        ${assessment.grade || null}, ${JSON.stringify(assessment.penalties || {})},
        ${assessment.kelebihan || null}, ${assessment.kekurangan || null},
        ${assessment.rekomendasiPerpanjangKontrak || false},
        ${assessment.rekomendasiPerpanjangBulan || null},
        ${assessment.rekomendasiPengangkatanTetap || false},
        ${assessment.rekomendasiPromosiJabatan || false},
        ${assessment.rekomendasiPerubahanGaji || false},
        ${assessment.rekomendasiEndKontrak || false},
        ${assessment.status || "pending_pjo"}, ${assessment.createdByNik},
        ${assessment.createdByName || null}, ${assessment.createdByRole || null}
      )
      RETURNING *
    `

    console.log("[v0] Assessment created successfully with ID:", result[0].id)
    return transformAssessmentData(result[0])
  } catch (error) {
    console.error("[v0] Error creating assessment:", error)
    throw error
  }
}

export async function updateAssessment(id: string, updates: any) {
  try {
    console.log("[v0] updateAssessment called with id:", id, "updates:", updates)

    if (updates.status !== undefined) {
      const result = await sql`
        UPDATE employee_assessments 
        SET status = ${updates.status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${Number.parseInt(id)}
        RETURNING *
      `

      console.log("[v0] Update successful, returned rows:", result.length)

      if (!result || result.length === 0) {
        console.error("[v0] No rows returned from update - Assessment with id", id, "may not exist")
        throw new Error(`Update returned no rows for assessment id: ${id}`)
      }

      console.log("[v0] Assessment updated successfully, new status:", result[0].status)
      return transformAssessmentData(result[0])
    }

    // If other fields need updating, fetch current and update
    console.log("[v0] No status update, fetching current assessment")
    return await getAssessmentById(id)
  } catch (error) {
    console.error("[v0] Error updating assessment:", error)
    throw error
  }
}

export async function deleteAssessment(id: string) {
  try {
    await sql`DELETE FROM employee_assessments WHERE id = ${id}`
  } catch (error) {
    console.error("Error deleting assessment:", error)
    throw error
  }
}

// ============ ASSESSMENT APPROVAL HISTORY OPERATIONS ============

export async function getAssessmentApprovals(assessmentId: string) {
  try {
    const result = await sql`
      SELECT * FROM assessment_approvals 
      WHERE assessment_id = ${assessmentId} 
      ORDER BY created_at ASC
    `
    return result.map(transformAssessmentApprovalHistory)
  } catch (error) {
    console.error("Error fetching assessment approvals:", error)
    return []
  }
}

export async function addAssessmentApproval(approval: any) {
  try {
    console.log("[v0] addAssessmentApproval called with data:", approval)

    const result = await sql`
      INSERT INTO assessment_approvals (
        assessment_id, approver_nik, approver_name, approver_role, action, notes
      )
      VALUES (
        ${approval.assessmentId}, ${approval.approverNik}, ${approval.approverName},
        ${approval.approverRole}, ${approval.action}, ${approval.notes || null}
      )
      RETURNING *
    `

    console.log("[v0] Assessment approval added successfully with ID:", result[0].id)
    return transformAssessmentApprovalHistory(result[0])
  } catch (error) {
    console.error("[v0] Error adding assessment approval:", error)
    throw error
  }
}
