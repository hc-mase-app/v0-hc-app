// Workflow Service: Core business logic for leave request approval workflow
// Handles status transitions, validations, and access control

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export type ApprovalLevel = "dic" | "pjo_site" | "hr_ho" | "hr_ticketing"
export type LeaveStatus =
  | "pending_dic"
  | "pending_pjo"
  | "pending_hr_ho"
  | "di_proses"
  | "tiket_issued"
  | "approved" // Added approved status for cuti lokal
  | "ditolak_dic"
  | "ditolak_pjo"
  | "ditolak_hr_ho"

export interface WorkflowTransition {
  currentStatus: LeaveStatus
  nextStatus: LeaveStatus
  level: ApprovalLevel
  requiresNotes: boolean
}

// Status progression workflow
const WORKFLOW_TRANSITIONS: Record<ApprovalLevel, { currentStatus: LeaveStatus; nextStatus: LeaveStatus }> = {
  dic: {
    currentStatus: "pending_dic",
    nextStatus: "pending_pjo",
  },
  pjo_site: {
    currentStatus: "pending_pjo",
    nextStatus: "pending_hr_ho",
  },
  hr_ho: {
    currentStatus: "pending_hr_ho",
    nextStatus: "di_proses",
  },
  hr_ticketing: {
    currentStatus: "di_proses",
    nextStatus: "tiket_issued",
  },
}

const REJECTION_STATUS: Record<ApprovalLevel, LeaveStatus> = {
  dic: "ditolak_dic",
  pjo_site: "ditolak_pjo",
  hr_ho: "ditolak_hr_ho",
  hr_ticketing: "di_proses",
}

export async function validateApprovalAccess(
  userRole: string,
  userSite: string,
  userDepartemen: string | undefined,
  requestId: string,
): Promise<{ valid: boolean; level?: ApprovalLevel }> {
  try {
    const [requests] = await Promise.all([sql`SELECT status, nik FROM leave_requests WHERE id = ${requestId}`])

    if (!requests || requests.length === 0) {
      return { valid: false }
    }

    const request = requests[0]

    // Determine approval level from user role
    let level: ApprovalLevel | null = null
    if (userRole === "dic") level = "dic"
    else if (userRole === "pjo_site") level = "pjo_site"
    else if (userRole === "hr_ho") level = "hr_ho"
    else if (userRole === "hr_ticketing") level = "hr_ticketing"
    else return { valid: false }

    // Check if request is in correct status for this level
    const transition = WORKFLOW_TRANSITIONS[level]
    if (request.status !== transition.currentStatus) {
      return { valid: false }
    }

    // Role-specific validation
    if (level === "dic" && !userDepartemen) {
      return { valid: false } // DIC must have department
    }

    return { valid: true, level }
  } catch (error) {
    console.error("[Workflow] Validation error:", error)
    return { valid: false }
  }
}

export async function processApproval(
  requestId: string,
  approverNik: string,
  action: "approved" | "rejected",
  notes: string,
  level: ApprovalLevel,
): Promise<{ success: boolean; error?: string }> {
  try {
    const [requests, approvers] = await Promise.all([
      sql`SELECT id FROM leave_requests WHERE id = ${requestId}`,
      sql`SELECT name, role FROM users WHERE nik = ${approverNik}`,
    ])

    if (!requests || requests.length === 0) {
      return { success: false, error: "Request not found" }
    }

    if (!approvers || approvers.length === 0) {
      return { success: false, error: "Approver not found" }
    }

    const approver = approvers[0]
    const transition = WORKFLOW_TRANSITIONS[level]
    const nextStatus = action === "approved" ? transition.nextStatus : REJECTION_STATUS[level]

    // Update status
    await sql`UPDATE leave_requests SET status = ${nextStatus}, updated_at = CURRENT_TIMESTAMP WHERE id = ${requestId}`

    // Record history
    const historyId = `ah_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await sql`
      INSERT INTO approval_history (id, leave_request_id, approver_nik, approver_name, approver_role, action, notes)
      VALUES (${historyId}, ${requestId}, ${approverNik}, ${approver.name}, ${approver.role}, ${action}, ${notes || null})
    `

    return { success: true }
  } catch (error) {
    console.error("[Workflow] Approval error:", error)
    return { success: false, error: String(error) }
  }
}

export async function getPendingRequestsForLevel(
  level: ApprovalLevel,
  userSite: string,
  userDepartemen?: string,
): Promise<any[]> {
  try {
    const transition = WORKFLOW_TRANSITIONS[level]

    let query
    switch (level) {
      case "dic":
        // DIC sees pending_dic requests from their site and department
        query = sql`
          SELECT 
            lr.*,
            u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE lr.status = ${transition.currentStatus} 
            AND u.site = ${userSite}
            AND u.departemen = ${userDepartemen}
          ORDER BY lr.created_at DESC
        `
        break

      case "pjo_site":
        // PJO Site sees pending_pjo requests from their site (all departments)
        query = sql`
          SELECT 
            lr.*,
            u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE lr.status = ${transition.currentStatus} 
            AND u.site = ${userSite}
          ORDER BY lr.created_at DESC
        `
        break

      case "hr_ho":
        // HR HO sees all pending_hr_ho requests (all sites, all departments)
        query = sql`
          SELECT 
            lr.*,
            u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE lr.status = ${transition.currentStatus}
          ORDER BY lr.created_at DESC
        `
        break

      case "hr_ticketing":
        // HR Ticketing sees di_proses requests (all sites, all departments)
        query = sql`
          SELECT 
            lr.*,
            u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
            u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
          FROM leave_requests lr
          LEFT JOIN users u ON lr.nik = u.nik
          WHERE lr.status = 'di_proses'
          ORDER BY lr.created_at DESC
        `
        break
    }

    return query
  } catch (error) {
    console.error(`[Workflow] Error fetching pending requests for level ${level}:`, error)
    return []
  }
}
