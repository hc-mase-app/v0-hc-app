// Centralized workflow logic with clear status transitions and role-based access

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

// ============ TYPE DEFINITIONS ============

export type UserRole = "hr_site" | "dic" | "pjo_site" | "hr_ho" | "hr_ticketing" | "user"

export type LeaveStatus =
  | "pending_dic"
  | "pending_pjo"
  | "pending_hr_ho"
  | "di_proses"
  | "tiket_issued"
  | "ditolak_dic"
  | "ditolak_pjo"
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
  hr_site: null, // Can only create, not approve
  dic: {
    role: "dic",
    canApprove: ["pending_dic"],
    approveTransition: "pending_pjo",
    rejectTransition: "ditolak_dic",
    accessFilter: (site, dept) => `lr.status = 'pending_dic' AND u.site = '${site}' AND u.departemen = '${dept}'`,
  },
  pjo_site: {
    role: "pjo_site",
    canApprove: ["pending_pjo"],
    approveTransition: "pending_hr_ho",
    rejectTransition: "ditolak_pjo",
    accessFilter: (site) => `lr.status = 'pending_pjo' AND u.site = '${site}'`,
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
  return `
    SELECT 
      lr.*,
      u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
      u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
    FROM leave_requests lr
    LEFT JOIN users u ON lr.nik = u.nik
    WHERE ${whereClause}
    ORDER BY lr.created_at DESC
  `
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
        // HR Ticketing sees di_proses requests
        const query = buildLeaveRequestQuery(`lr.status = 'di_proses'`)
        return await sql.unsafe(query)
      }
      return []
    }

    const whereClause = rule.accessFilter(userSite, userDepartemen)
    const query = buildLeaveRequestQuery(whereClause)
    return await sql.unsafe(query)
  } catch (error) {
    console.error(`[Workflow] Error fetching requests for ${role}:`, error)
    return []
  }
}

export async function getAllRequestsForRole(role: UserRole, userSite: string, userDepartemen?: string): Promise<any[]> {
  try {
    let whereClause = "1=1" // Default: all requests

    switch (role) {
      case "hr_site":
        whereClause = `u.site = '${userSite}'`
        break
      case "dic":
        // See all from their site and department
        whereClause = `u.site = '${userSite}' AND u.departemen = '${userDepartemen}'`
        break
      case "pjo_site":
        // See all from their site
        whereClause = `u.site = '${userSite}'`
        break
      case "hr_ho":
      case "hr_ticketing":
        // See all requests
        whereClause = "1=1"
        break
      case "user":
        // Users see nothing in "all" view (they use getUserRequests instead)
        return []
    }

    const query = buildLeaveRequestQuery(whereClause)
    return await sql.unsafe(query)
  } catch (error) {
    console.error(`[Workflow] Error fetching all requests for ${role}:`, error)
    return []
  }
}

export async function getUserRequests(nik: string): Promise<any[]> {
  try {
    const query = buildLeaveRequestQuery(`lr.nik = '${nik}'`)
    return await sql.unsafe(query)
  } catch (error) {
    console.error("[Workflow] Error fetching user requests:", error)
    return []
  }
}

export async function getRequestById(requestId: string): Promise<any | null> {
  try {
    const query = buildLeaveRequestQuery(`lr.id = '${requestId}'`)
    const result = await sql.unsafe(query)
    return result[0] || null
  } catch (error) {
    console.error("[Workflow] Error fetching request by ID:", error)
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
    // Get request and validate
    const request = await getRequestById(requestId)
    if (!request) {
      return { success: false, error: "Request not found" }
    }

    const rule = WORKFLOW_RULES[approverRole]
    if (!rule) {
      return { success: false, error: "Role cannot approve" }
    }

    if (!rule.canApprove.includes(request.status)) {
      return { success: false, error: `Cannot approve request with status ${request.status}` }
    }

    // Get approver info
    const approverResult = await sql`SELECT name, role FROM users WHERE nik = ${approverNik}`
    if (!approverResult || approverResult.length === 0) {
      return { success: false, error: "Approver not found" }
    }
    const approver = approverResult[0]

    // Update status
    const newStatus = rule.approveTransition
    await sql`
      UPDATE leave_requests 
      SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${requestId}
    `

    // Record approval history
    await sql`
      INSERT INTO approval_history (leave_request_id, approver_nik, approver_name, approver_role, action, notes)
      VALUES (${requestId}, ${approverNik}, ${approver.name}, ${approver.role}, 'approved', ${notes || null})
    `

    return { success: true }
  } catch (error) {
    console.error("[Workflow] Error approving request:", error)
    return { success: false, error: String(error) }
  }
}

export async function rejectRequest(
  requestId: string,
  approverNik: string,
  approverRole: UserRole,
  notes: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get request and validate
    const request = await getRequestById(requestId)
    if (!request) {
      return { success: false, error: "Request not found" }
    }

    const rule = WORKFLOW_RULES[approverRole]
    if (!rule) {
      return { success: false, error: "Role cannot reject" }
    }

    if (!rule.canApprove.includes(request.status)) {
      return { success: false, error: `Cannot reject request with status ${request.status}` }
    }

    if (!notes || notes.trim() === "") {
      return { success: false, error: "Rejection reason is required" }
    }

    // Get approver info
    const approverResult = await sql`SELECT name, role FROM users WHERE nik = ${approverNik}`
    if (!approverResult || approverResult.length === 0) {
      return { success: false, error: "Approver not found" }
    }
    const approver = approverResult[0]

    // Update status
    const newStatus = rule.rejectTransition
    await sql`
      UPDATE leave_requests 
      SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${requestId}
    `

    // Record rejection history
    await sql`
      INSERT INTO approval_history (leave_request_id, approver_nik, approver_name, approver_role, action, notes)
      VALUES (${requestId}, ${approverNik}, ${approver.name}, ${approver.role}, 'rejected', ${notes})
    `

    return { success: true }
  } catch (error) {
    console.error("[Workflow] Error rejecting request:", error)
    return { success: false, error: String(error) }
  }
}

// ============ LEAVE REQUEST CREATION ============

export async function createLeaveRequest(data: {
  nik: string
  jenisCuti: string
  tanggalPengajuan: string
  periodeAwal: string
  periodeAkhir: string
  jumlahHari: number
  berangkatDari?: string
  tujuan?: string
  tanggalKeberangkatan?: string
  cutiPeriodikBerikutnya?: string
  catatan?: string
  submittedBy: string
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const result = await sql`
      INSERT INTO leave_requests (
        nik, jenis_cuti, tanggal_pengajuan, periode_awal, periode_akhir,
        jumlah_hari, berangkat_dari, tujuan, tanggal_keberangkatan,
        cuti_periodik_berikutnya, catatan, status, submitted_by
      ) VALUES (
        ${data.nik},
        ${data.jenisCuti},
        ${data.tanggalPengajuan},
        ${data.periodeAwal},
        ${data.periodeAkhir},
        ${data.jumlahHari},
        ${data.berangkatDari || null},
        ${data.tujuan || null},
        ${data.tanggalKeberangkatan || null},
        ${data.cutiPeriodikBerikutnya || null},
        ${data.catatan || null},
        'pending_dic',
        ${data.submittedBy}
      )
      RETURNING *
    `

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[Workflow] Error creating leave request:", error)
    return { success: false, error: String(error) }
  }
}

// ============ HR TICKETING FUNCTIONS ============

export async function updateBookingCode(
  requestId: string,
  bookingCode: string,
  updatedBy: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate request is in di_proses status
    const request = await getRequestById(requestId)
    if (!request) {
      return { success: false, error: "Request not found" }
    }

    if (request.status !== "di_proses") {
      return { success: false, error: "Request must be in di_proses status" }
    }

    // Update booking code and status
    await sql`
      UPDATE leave_requests 
      SET booking_code = ${bookingCode}, status = 'tiket_issued', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${requestId}
    `

    // Record in history
    await sql`
      INSERT INTO approval_history (leave_request_id, approver_nik, approver_name, approver_role, action, notes)
      VALUES (${requestId}, ${updatedBy}, 'HR Ticketing', 'hr_ticketing', 'tiket_issued', ${`Booking code: ${bookingCode}`})
    `

    return { success: true }
  } catch (error) {
    console.error("[Workflow] Error updating booking code:", error)
    return { success: false, error: String(error) }
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
      approved: allRequests.filter((r) => r.status === "tiket_issued" || r.status === "di_proses").length,
      rejected: allRequests.filter((r) => r.status?.includes("ditolak")).length,
    }
  } catch (error) {
    console.error("[Workflow] Error calculating statistics:", error)
    return { total: 0, pending: 0, approved: 0, rejected: 0 }
  }
}
