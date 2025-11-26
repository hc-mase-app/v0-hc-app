// Centralized workflow logic with clear status transitions and role-based access

import { neon } from "@neondatabase/serverless"
import { ensureLeaveRequestsSchema } from "./db-migration"
import { mapDbRowToLeaveRequest, mapDbRowsToLeaveRequests } from "./db-mapper"
import { validateLeaveRequestCreate, validateBookingCode, sanitizeString } from "./validation"

const sql = neon(process.env.DATABASE_URL || "")

let migrationInitialized = false
async function initializeMigration() {
  if (!migrationInitialized) {
    migrationInitialized = true
    try {
      await ensureLeaveRequestsSchema()
    } catch (error) {
      console.error("[v0] Migration initialization error:", error)
    }
  }
}

// ============ TYPE DEFINITIONS ============

export type UserRole = "admin_site" | "hr_site" | "dic" | "pjo_site" | "manager_ho" | "hr_ho" | "hr_ticketing" | "user"

export type LeaveStatus =
  | "pending_dic"
  | "pending_pjo"
  | "pending_manager_ho"
  | "pending_hr_ho"
  | "di_proses"
  | "tiket_issued"
  | "approved"
  | "ditolak_dic"
  | "ditolak_pjo"
  | "ditolak_manager_ho"
  | "ditolak_hr_ho"

export interface WorkflowRule {
  role: UserRole
  canApprove: LeaveStatus[]
  approveTransition: LeaveStatus
  rejectTransition: LeaveStatus
  accessFilter: (userSite: string, userDept?: string) => string
}

// ============ WORKFLOW CONFIGURATION ============

const WORKFLOW_RULES: Record<UserRole, WorkflowRule | null> = {
  admin_site: null, // Can only create, not approve
  hr_site: null, // Only approves assessments, not leave requests
  dic: {
    role: "dic",
    canApprove: ["pending_dic"],
    approveTransition: "pending_pjo",
    rejectTransition: "ditolak_dic",
    accessFilter: (site, dept) => `lr.status = 'pending_dic' AND lr.site = '${site}' AND lr.departemen = '${dept}'`,
  },
  pjo_site: {
    role: "pjo_site",
    canApprove: ["pending_pjo"],
    approveTransition: "pending_hr_ho", // Default, will be overridden
    rejectTransition: "ditolak_pjo",
    accessFilter: (site) => `lr.status = 'pending_pjo' AND lr.site = '${site}'`,
  },
  manager_ho: {
    role: "manager_ho",
    canApprove: ["pending_manager_ho"],
    approveTransition: "pending_hr_ho",
    rejectTransition: "ditolak_manager_ho",
    accessFilter: () => `lr.status = 'pending_manager_ho'`,
  },
  hr_ho: {
    role: "hr_ho",
    canApprove: ["pending_hr_ho"],
    approveTransition: "di_proses",
    rejectTransition: "ditolak_hr_ho",
    accessFilter: () => `lr.status = 'pending_hr_ho'`,
  },
  hr_ticketing: null, // Special case - doesn't approve, just updates booking
  user: null, // Read-only access
}

// ============ QUERY BUILDER ============

function buildLeaveRequestQuery(whereClause: string) {
  // This is now used only for logging - actual queries will use template literals
  return `
    SELECT 
      lr.*,
      u.name, u.jabatan, u.poh, u.status_karyawan,
      u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
    FROM leave_requests lr
    LEFT JOIN users u ON lr.nik = u.nik
    WHERE ${whereClause}
    ORDER BY lr.created_at DESC
  `.trim()
}

// ============ DATA ACCESS FUNCTIONS ============

export async function getPendingRequestsForRole(
  role: UserRole,
  userSite: string,
  userDepartemen?: string,
): Promise<any[]> {
  try {
    const rule = WORKFLOW_RULES[role]

    if (!rule) {
      // Special cases
      if (role === "hr_ticketing") {
        const result = await sql`
          SELECT 
            lr.*,
            u.name, u.jabatan, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE lr.status = 'di_proses'
          AND (lr.jenis_pengajuan = 'dengan_tiket' OR lr.jenis_pengajuan IS NULL)
          ORDER BY lr.created_at DESC
        `
        console.log(`[v0] Workflow query executed for ${role}, rows:`, result.length)
        return mapDbRowsToLeaveRequests(Array.isArray(result) ? result : [])
      }
      return []
    }

    let result: any[] = []

    if (role === "dic") {
      result = await sql`
        SELECT 
          lr.*,
          u.name, u.jabatan, u.poh, u.status_karyawan,
          u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
        FROM leave_requests lr
        LEFT JOIN users u ON lr.nik = u.nik
        WHERE lr.status = 'pending_dic' AND lr.site = ${userSite} AND lr.departemen = ${userDepartemen}
        ORDER BY lr.created_at DESC
      `
    } else if (role === "pjo_site") {
      result = await sql`
        SELECT 
          lr.*,
          u.name, u.jabatan, u.poh, u.status_karyawan,
          u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
        FROM leave_requests lr
        LEFT JOIN users u ON lr.nik = u.nik
        WHERE lr.status = 'pending_pjo' AND lr.site = ${userSite}
        ORDER BY lr.created_at DESC
      `
    } else if (role === "manager_ho") {
      result = await sql`
        SELECT 
          lr.*,
          u.name, u.jabatan, u.poh, u.status_karyawan,
          u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
        FROM leave_requests lr
        LEFT JOIN users u ON lr.nik = u.nik
        WHERE lr.status = 'pending_manager_ho'
        AND (lr.jenis_pengajuan = 'dengan_tiket' OR lr.jenis_pengajuan IS NULL)
        ORDER BY lr.created_at DESC
      `
    } else if (role === "hr_ho") {
      result = await sql`
        SELECT 
          lr.*,
          u.name, u.jabatan, u.poh, u.status_karyawan,
          u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
        FROM leave_requests lr
        LEFT JOIN users u ON lr.nik = u.nik
        WHERE lr.status = 'pending_hr_ho' 
        AND (lr.jenis_pengajuan = 'dengan_tiket' OR lr.jenis_pengajuan IS NULL)
        ORDER BY lr.created_at DESC
      `
    }

    console.log(`[v0] Workflow query executed for ${role}, rows:`, result.length)
    return mapDbRowsToLeaveRequests(Array.isArray(result) ? result : [])
  } catch (error) {
    console.error(`[v0] Workflow Error fetching requests for ${role}:`, error)
    return []
  }
}

export async function getAllRequestsForRole(role: UserRole, userSite: string, userDepartemen?: string): Promise<any[]> {
  try {
    let result: any[] = []

    switch (role) {
      case "admin_site":
        result = await sql`
          SELECT 
            lr.*,
            u.name, u.jabatan, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE lr.site = ${userSite} AND lr.departemen = ${userDepartemen}
          ORDER BY lr.created_at DESC
        `
        break
      case "hr_site":
        result = []
        break
      case "dic":
        result = await sql`
          SELECT 
            lr.*,
            u.name, u.jabatan, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE lr.site = ${userSite} AND lr.departemen = ${userDepartemen}
          ORDER BY lr.created_at DESC
        `
        break
      case "pjo_site":
        result = await sql`
          SELECT 
            lr.*,
            u.name, u.jabatan, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE lr.site = ${userSite}
          ORDER BY lr.created_at DESC
        `
        break
      case "manager_ho":
        result = await sql`
          SELECT 
            lr.*,
            u.name, u.jabatan, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE (lr.jenis_pengajuan = 'dengan_tiket' OR lr.jenis_pengajuan IS NULL)
          AND u.role = 'pjo_site'
          ORDER BY lr.created_at DESC
        `
        break
      case "hr_ho":
      case "hr_ticketing":
        result = await sql`
          SELECT 
            lr.*,
            u.name, u.jabatan, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE (lr.jenis_pengajuan = 'dengan_tiket' OR lr.jenis_pengajuan IS NULL)
          ORDER BY lr.created_at DESC
        `
        break
      case "user":
        return []
    }

    console.log(`[v0] Query executed successfully for ${role}, rows:`, result.length)
    return mapDbRowsToLeaveRequests(Array.isArray(result) ? result : [])
  } catch (error) {
    console.error(`[v0] Workflow Error fetching all requests for ${role}:`, error)
    console.error(`[v0] Error details:`, error)
    return []
  }
}

export async function getUserRequests(nik: string): Promise<any[]> {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.jabatan, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.nik = ${nik}
      ORDER BY lr.created_at DESC
    `
    console.log(`[v0] User requests query executed, rows:`, result.length)
    return mapDbRowsToLeaveRequests(Array.isArray(result) ? result : [])
  } catch (error) {
    console.error("[v0] Workflow Error fetching user requests:", error)
    return []
  }
}

export async function getRequestById(requestId: string): Promise<any | null> {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.jabatan, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.id = ${requestId}
    `
    return Array.isArray(result) && result.length > 0 ? mapDbRowToLeaveRequest(result[0]) : null
  } catch (error) {
    console.error("[v0] Workflow Error fetching request by ID:", error)
    return null
  }
}

// ============ APPROVAL ACTIONS ============

export async function approveRequest(
  requestId: string,
  approverNik: string,
  approverRole: UserRole,
  notes = "",
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!requestId || requestId.trim() === "") {
      return { success: false, error: "Request ID diperlukan" }
    }

    if (!approverNik || approverNik.trim() === "") {
      return { success: false, error: "Approver NIK diperlukan" }
    }

    // Get request and validate
    const request = await getRequestById(requestId)
    if (!request) {
      return { success: false, error: "Request tidak ditemukan" }
    }

    console.log(`[v0] Approving request ${requestId}, jenisPengajuan:`, request.jenisPengajuan)

    const rule = WORKFLOW_RULES[approverRole]
    if (!rule) {
      return { success: false, error: "Role ini tidak memiliki hak untuk approve" }
    }

    if (!rule.canApprove.includes(request.status)) {
      return { success: false, error: `Tidak dapat approve request dengan status ${request.status}` }
    }

    // Get approver info
    const approverResult = await sql`SELECT name, role FROM users WHERE nik = ${approverNik}`
    if (!approverResult || approverResult.length === 0) {
      return { success: false, error: "Approver tidak ditemukan di database" }
    }
    const approver = approverResult[0]

    let newStatus: LeaveStatus = rule.approveTransition

    if (approverRole === "pjo_site") {
      const jenisPengajuan = request.jenisPengajuan || "dengan_tiket" // Default to dengan_tiket for old records
      console.log(`[v0] PJO Site approval - jenisPengajuan: ${jenisPengajuan}`)

      if (jenisPengajuan === "lokal") {
        // Cuti lokal stops at PJO Site
        newStatus = "approved"
        console.log(`[v0] Setting status to 'approved' for cuti lokal`)
      } else {
        // Dengan tiket continues to HR HO
        newStatus = "pending_hr_ho"
        console.log(`[v0] Setting status to 'pending_hr_ho' for dengan tiket`)
      }
    }

    if (approverRole === "manager_ho") {
      newStatus = "pending_hr_ho"
      console.log(`[v0] Manager HO approval - Setting status to 'pending_hr_ho'`)
    }

    const updateResult = await sql`
      UPDATE leave_requests 
      SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${requestId}
      RETURNING id
    `

    if (!updateResult || updateResult.length === 0) {
      return { success: false, error: "Gagal mengupdate status request" }
    }

    // Record approval history
    await sql`
      INSERT INTO approval_history (leave_request_id, approver_nik, approver_name, approver_role, action, notes)
      VALUES (${requestId}, ${approverNik}, ${approver.name}, ${approver.role}, 'approved', ${sanitizeString(notes) || null})
    `

    console.log(`[v0] Approval successful - new status: ${newStatus}`)
    return { success: true }
  } catch (error) {
    console.error("[Workflow] Error approving request:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: `Database error: ${errorMessage}` }
  }
}

export async function rejectRequest(
  requestId: string,
  approverNik: string,
  approverRole: UserRole,
  notes: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!requestId || requestId.trim() === "") {
      return { success: false, error: "Request ID diperlukan" }
    }

    if (!approverNik || approverNik.trim() === "") {
      return { success: false, error: "Approver NIK diperlukan" }
    }

    if (!notes || notes.trim() === "") {
      return { success: false, error: "Alasan penolakan wajib diisi" }
    }

    // Get request and validate
    const request = await getRequestById(requestId)
    if (!request) {
      return { success: false, error: "Request tidak ditemukan" }
    }

    const rule = WORKFLOW_RULES[approverRole]
    if (!rule) {
      return { success: false, error: "Role ini tidak memiliki hak untuk reject" }
    }

    if (!rule.canApprove.includes(request.status)) {
      return { success: false, error: `Tidak dapat reject request dengan status ${request.status}` }
    }

    // Get approver info
    const approverResult = await sql`SELECT name, role FROM users WHERE nik = ${approverNik}`
    if (!approverResult || approverResult.length === 0) {
      return { success: false, error: "Approver tidak ditemukan di database" }
    }
    const approver = approverResult[0]

    const newStatus = rule.rejectTransition
    const updateResult = await sql`
      UPDATE leave_requests 
      SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${requestId}
      RETURNING id
    `

    if (!updateResult || updateResult.length === 0) {
      return { success: false, error: "Gagal mengupdate status request" }
    }

    // Record rejection history
    await sql`
      INSERT INTO approval_history (leave_request_id, approver_nik, approver_name, approver_role, action, notes)
      VALUES (
        ${requestId}, 
        ${approverNik}, 
        ${approver.name}, 
        ${approver.role}, 
        'rejected', 
        ${sanitizeString(notes)}
      )
    `

    return { success: true }
  } catch (error) {
    console.error("[Workflow] Error rejecting request:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: `Database error: ${errorMessage}` }
  }
}

// ============ LEAVE REQUEST CREATION ============

export async function createLeaveRequest(data: {
  nik: string
  jenisCuti: string
  jenisPengajuan?: string
  tanggalPengajuan: string
  periodeAwal: string
  periodeAkhir: string
  jumlahHari: number
  berangkatDari?: string
  tujuan?: string
  tanggalKeberangkatan?: string
  cutiPeriodikBerikutnya?: string
  catatan?: string
  lamaOnsite?: number
  submittedBy: string
  site: string
  departemen: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log("[v0] createLeaveRequest called with data:", JSON.stringify(data, null, 2))
    console.log("[v0] jenisPengajuan received:", data.jenisPengajuan)

    console.log("[v0] Validating leave request data...")

    const validation = validateLeaveRequestCreate(data)
    if (!validation.valid) {
      console.log("[v0] Validation failed:", validation.errors)
      return {
        success: false,
        error: validation.errors.join("; "),
      }
    }

    console.log("[v0] Validation passed successfully")

    await initializeMigration()

    console.log(`[v0] Creating leave request with site: ${data.site}, dept: ${data.departemen}`)

    let initialStatus: LeaveStatus = "pending_dic"

    const userResult = await sql`SELECT role FROM users WHERE nik = ${data.nik}`
    if (userResult && userResult.length > 0) {
      const userRole = userResult[0].role
      console.log(`[v0] User role for NIK ${data.nik}: ${userRole}`)

      if (userRole === "pjo_site") {
        initialStatus = "pending_manager_ho"
        console.log(`[v0] PJO user detected - setting initial status to pending_manager_ho`)
      }
    }

    const sanitizedData = {
      ...data,
      jenisPengajuan: data.jenisPengajuan || "dengan_tiket",
      berangkatDari: sanitizeString(data.berangkatDari),
      tujuan: sanitizeString(data.tujuan),
      catatan: sanitizeString(data.catatan),
      cutiPeriodikBerikutnya: sanitizeString(data.cutiPeriodikBerikutnya),
    }

    console.log("[v0] Sanitized data jenisPengajuan:", sanitizedData.jenisPengajuan)

    const result = await sql`
      INSERT INTO leave_requests (
        nik, jenis_cuti, jenis_pengajuan, tanggal_pengajuan, periode_awal, periode_akhir,
        jumlah_hari, berangkat_dari, tujuan, tanggal_keberangkatan,
        cuti_periodik_berikutnya, catatan, lama_onsite, status, submitted_by,
        site, departemen
      ) VALUES (
        ${sanitizedData.nik},
        ${sanitizedData.jenisCuti},
        ${sanitizedData.jenisPengajuan},
        ${sanitizedData.tanggalPengajuan},
        ${sanitizedData.periodeAwal},
        ${sanitizedData.periodeAkhir},
        ${sanitizedData.jumlahHari},
        ${sanitizedData.berangkatDari || null},
        ${sanitizedData.tujuan || null},
        ${sanitizedData.tanggalKeberangkatan || null},
        ${sanitizedData.cutiPeriodikBerikutnya || null},
        ${sanitizedData.catatan || null},
        ${sanitizedData.lamaOnsite || null},
        ${initialStatus},
        ${sanitizedData.submittedBy},
        ${sanitizedData.site},
        ${sanitizedData.departemen}
      )
      RETURNING *
    `

    console.log(`[v0] Leave request created successfully with ID: ${result[0]?.id}, status: ${initialStatus}`)
    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Workflow Error creating leave request:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: `Database error: ${errorMessage}` }
  }
}

// ============ HR TICKETING FUNCTIONS ============

export async function updateBookingCode(
  requestId: string,
  bookingCode: string,
  namaPesawat: string,
  jamKeberangkatan: string,
  updatedBy: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const bookingCodeError = validateBookingCode(bookingCode)
    if (bookingCodeError) {
      return { success: false, error: bookingCodeError }
    }

    if (!requestId || requestId.trim() === "") {
      return { success: false, error: "Request ID diperlukan" }
    }

    if (!updatedBy || updatedBy.trim() === "") {
      return { success: false, error: "updatedBy diperlukan" }
    }

    // Validate request is in di_proses status
    const request = await getRequestById(requestId)
    if (!request) {
      return { success: false, error: "Request tidak ditemukan" }
    }

    if (request.status !== "di_proses") {
      return { success: false, error: `Request harus dalam status di_proses, saat ini: ${request.status}` }
    }

    const sanitizedBookingCode = sanitizeString(bookingCode)
    const sanitizedNamaPesawat = sanitizeString(namaPesawat)
    const sanitizedJamKeberangkatan = sanitizeString(jamKeberangkatan)

    // Update booking code, airline name, departure time and status
    const updateResult = await sql`
      UPDATE leave_requests 
      SET 
        booking_code = ${sanitizedBookingCode}, 
        nama_pesawat = ${sanitizedNamaPesawat || null},
        jam_keberangkatan = ${sanitizedJamKeberangkatan || null},
        status = 'tiket_issued', 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${requestId}
      RETURNING id
    `

    if (!updateResult || updateResult.length === 0) {
      return { success: false, error: "Gagal mengupdate booking code" }
    }

    // Record in history
    await sql`
      INSERT INTO approval_history (leave_request_id, approver_nik, approver_name, approver_role, action, notes)
      VALUES (
        ${requestId}, 
        ${updatedBy}, 
        'HR Ticketing', 
        'hr_ticketing', 
        'tiket_issued', 
        ${`Booking code: ${sanitizedBookingCode}, Airline: ${sanitizedNamaPesawat || "-"}, Departure time: ${sanitizedJamKeberangkatan || "-"}`}
      )
    `

    return { success: true }
  } catch (error) {
    console.error("[Workflow] Error updating booking code:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: `Database error: ${errorMessage}` }
  }
}

export async function updateBookingCodeSeparate(
  requestId: string,
  ticketData: {
    tiketBerangkat?: boolean
    tiketBalik?: boolean
    bookingCode?: string
    namaPesawat?: string
    jamKeberangkatan?: string
    bookingCodeBalik?: string
    namaPesawatBalik?: string
    jamKeberangkatanBalik?: string
    tanggalBerangkatBalik?: string
    berangkatDariBalik?: string
    tujuanBalik?: string
  },
  updatedBy: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] updateBookingCodeSeparate - requestId:", requestId)
    console.log("[v0] updateBookingCodeSeparate - ticketData:", JSON.stringify(ticketData, null, 2))

    console.log("[v0] DEBUG - tiketBalik value:", ticketData.tiketBalik)
    console.log("[v0] DEBUG - tiketBalik type:", typeof ticketData.tiketBalik)
    console.log("[v0] DEBUG - tiketBalik === true:", ticketData.tiketBalik === true)
    console.log("[v0] DEBUG - Boolean(tiketBalik):", Boolean(ticketData.tiketBalik))

    if (!requestId || requestId.trim() === "") {
      return { success: false, error: "Request ID diperlukan" }
    }

    if (!updatedBy || updatedBy.trim() === "") {
      return { success: false, error: "updatedBy diperlukan" }
    }

    const request = await getRequestById(requestId)
    if (!request) {
      return { success: false, error: "Request tidak ditemukan" }
    }

    if (request.status !== "di_proses" && request.status !== "tiket_issued") {
      return {
        success: false,
        error: `Request harus dalam status di_proses atau tiket_issued, saat ini: ${request.status}`,
      }
    }

    console.log("[v0] DEBUG - Checking tiketBerangkat:", ticketData.tiketBerangkat)

    if (ticketData.tiketBerangkat) {
      const sanitizedBookingCode = sanitizeString(ticketData.bookingCode || "")
      const sanitizedNamaPesawat = sanitizeString(ticketData.namaPesawat)
      const sanitizedJamKeberangkatan = sanitizeString(ticketData.jamKeberangkatan)

      console.log("[v0] Updating tiket berangkat...")
      const updateResult = await sql`
        UPDATE leave_requests 
        SET 
          booking_code = ${sanitizedBookingCode}, 
          nama_pesawat = ${sanitizedNamaPesawat || null},
          jam_keberangkatan = ${sanitizedJamKeberangkatan || null},
          status_tiket_berangkat = 'issued',
          tanggal_issue_tiket_berangkat = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${requestId}
        RETURNING id
      `
      console.log("[v0] Tiket berangkat updated, rows affected:", updateResult.length)

      await sql`
        INSERT INTO approval_history (leave_request_id, approver_nik, approver_name, approver_role, action, notes)
        VALUES (
          ${requestId}, 
          ${updatedBy}, 
          'HR Ticketing', 
          'hr_ticketing', 
          'tiket_berangkat_issued', 
          ${`Booking code: ${sanitizedBookingCode}, Airline: ${sanitizedNamaPesawat || "-"}, Departure time: ${sanitizedJamKeberangkatan || "-"}`}
        )
      `
      console.log("[v0] Tiket berangkat history inserted")
    }

    console.log("[v0] DEBUG - Checking tiketBalik condition...")
    console.log("[v0] DEBUG - Will enter if block?", !!ticketData.tiketBalik)

    if (ticketData.tiketBalik) {
      console.log("[v0] DEBUG - INSIDE tiketBalik if block!")

      const sanitizedBookingCodeBalik = sanitizeString(ticketData.bookingCodeBalik || "")
      const sanitizedNamaPesawatBalik = sanitizeString(ticketData.namaPesawatBalik)
      const sanitizedJamKeberangkatanBalik = sanitizeString(ticketData.jamKeberangkatanBalik)
      const sanitizedTanggalBerangkatBalik = sanitizeString(ticketData.tanggalBerangkatBalik)
      const sanitizedBerangkatDariBalik = sanitizeString(ticketData.berangkatDariBalik)
      const sanitizedTujuanBalik = sanitizeString(ticketData.tujuanBalik)

      console.log("[v0] Updating tiket balik with data:")
      console.log("[v0] - bookingCodeBalik:", sanitizedBookingCodeBalik)
      console.log("[v0] - namaPesawatBalik:", sanitizedNamaPesawatBalik)
      console.log("[v0] - jamKeberangkatanBalik:", sanitizedJamKeberangkatanBalik)
      console.log("[v0] - tanggalBerangkatBalik:", sanitizedTanggalBerangkatBalik)
      console.log("[v0] - berangkatDariBalik:", sanitizedBerangkatDariBalik)
      console.log("[v0] - tujuanBalik:", sanitizedTujuanBalik)

      const updateBalikResult = await sql`
        UPDATE leave_requests 
        SET 
          booking_code_balik = ${sanitizedBookingCodeBalik}, 
          nama_pesawat_balik = ${sanitizedNamaPesawatBalik || null},
          jam_keberangkatan_balik = ${sanitizedJamKeberangkatanBalik || null},
          tanggal_berangkat_balik = ${sanitizedTanggalBerangkatBalik || null},
          berangkat_dari_balik = ${sanitizedBerangkatDariBalik || null},
          tujuan_balik = ${sanitizedTujuanBalik || null},
          status_tiket_balik = 'issued',
          tanggal_issue_tiket_balik = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${requestId}
        RETURNING id, status_tiket_balik
      `
      console.log("[v0] Tiket balik updated, rows affected:", updateBalikResult.length)
      console.log("[v0] Tiket balik status after update:", updateBalikResult[0]?.status_tiket_balik)

      await sql`
        INSERT INTO approval_history (leave_request_id, approver_nik, approver_name, approver_role, action, notes)
        VALUES (
          ${requestId}, 
          ${updatedBy}, 
          'HR Ticketing', 
          'hr_ticketing', 
          'tiket_balik_issued', 
          ${`Booking code: ${sanitizedBookingCodeBalik}, Airline: ${sanitizedNamaPesawatBalik || "-"}, Departure time: ${sanitizedJamKeberangkatanBalik || "-"}`}
        )
      `
      console.log("[v0] Tiket balik history inserted")
    } else {
      console.log("[v0] DEBUG - tiketBalik condition NOT met, skipping tiket balik update")
    }

    const updatedRequest = await getRequestById(requestId)
    console.log("[v0] After update - statusTiketBerangkat:", updatedRequest?.statusTiketBerangkat)
    console.log("[v0] After update - statusTiketBalik:", updatedRequest?.statusTiketBalik)

    const bothIssued =
      updatedRequest?.statusTiketBerangkat === "issued" && updatedRequest?.statusTiketBalik === "issued"
    console.log("[v0] Both tickets issued?", bothIssued)

    if (bothIssued && request.status !== "tiket_issued") {
      await sql`
        UPDATE leave_requests 
        SET status = 'tiket_issued', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${requestId}
      `
      console.log("[v0] Overall status updated to tiket_issued")
    }

    return { success: true }
  } catch (error) {
    console.error("[Workflow] Error updating booking code separate:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: `Database error: ${errorMessage}` }
  }
}

// ============ APPROVAL HISTORY ============

export async function getApprovalHistory(requestId: string): Promise<any[]> {
  try {
    return await sql`
      SELECT * FROM approval_history 
      WHERE leave_request_id = ${requestId}
      ORDER BY created_at ASC
    `
  } catch (error) {
    console.error("[Workflow] Error fetching approval history:", error)
    return []
  }
}

// ============ STATISTICS ============

export async function getStatisticsForRole(
  role: UserRole,
  userSite: string,
  userDepartemen?: string,
): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
}> {
  try {
    const allRequests = await getAllRequestsForRole(role, userSite, userDepartemen)
    const pendingRequests = await getPendingRequestsForRole(role, userSite, userDepartemen)

    return {
      total: allRequests.length,
      pending: pendingRequests.length,
      approved: allRequests.filter((r) => r.status === "tiket_issued" || r.status === "approved").length,
      rejected: allRequests.filter((r) => r.status?.includes("ditolak")).length,
    }
  } catch (error) {
    console.error("[Workflow] Error calculating statistics:", error)
    return { total: 0, pending: 0, approved: 0, rejected: 0 }
  }
}
