/**
 * Approval Service Layer
 * Centralized business logic for approval history management
 */

import { sql } from "@/lib/neon-db"

// ============================================
// Types
// ============================================

export interface ApprovalHistory {
  id: string
  leaveRequestId: string
  approverNik: string
  approverName: string
  approverRole: string
  action: string
  notes: string | null
  createdAt: string
}

interface ApprovalHistoryInput {
  leaveRequestId: string
  approverNik: string
  approverName: string
  approverRole: string
  action: string
  notes?: string | null
}

// ============================================
// Transform Functions
// ============================================

function transformApprovalHistory(row: any): ApprovalHistory {
  return {
    id: row.id,
    leaveRequestId: row.leave_request_id,
    approverNik: row.approver_nik,
    approverName: row.approver_name,
    approverRole: row.approver_role,
    action: row.action,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

// ============================================
// Approval History Operations
// ============================================

export async function getAllApprovalHistory(): Promise<ApprovalHistory[]> {
  try {
    const result = await sql`SELECT * FROM approval_history ORDER BY created_at DESC`
    return result.map(transformApprovalHistory)
  } catch (error) {
    console.error("[ApprovalService] Error fetching all history:", error)
    return []
  }
}

export async function getApprovalHistoryByRequestId(requestId: string): Promise<ApprovalHistory[]> {
  try {
    const result = await sql`
      SELECT * FROM approval_history 
      WHERE leave_request_id = ${requestId} 
      ORDER BY created_at ASC
    `
    return result.map(transformApprovalHistory)
  } catch (error) {
    console.error("[ApprovalService] Error fetching history by request:", error)
    return []
  }
}

export async function addApprovalHistory(history: ApprovalHistoryInput): Promise<ApprovalHistory | null> {
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
    return transformApprovalHistory(result[0])
  } catch (error) {
    console.error("[ApprovalService] Error adding history:", error)
    throw error
  }
}
