import type { User, LeaveRequest, ApprovalHistory, LeaveStatus, UserRole } from "./types"

// Database operations using localStorage as mock database
export class Database {
  // User operations
  static getUsers(): User[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("users")
    return data ? JSON.parse(data) : []
  }

  static saveUsers(users: User[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem("users", JSON.stringify(users))
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id)
  }

  static getUsersByRole(role: UserRole): User[] {
    return this.getUsers().filter((u) => u.role === role)
  }

  static getUsersBySite(site: string): User[] {
    return this.getUsers().filter((u) => u.site === site)
  }

  static addUser(user: User): void {
    const users = this.getUsers()
    users.push(user)
    this.saveUsers(users)
  }

  static updateUser(id: string, updates: Partial<User>): void {
    const users = this.getUsers()
    const index = users.findIndex((u) => u.id === id)
    if (index !== -1) {
      users[index] = { ...users[index], ...updates }
      this.saveUsers(users)
    }
  }

  static deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.id !== id)
    this.saveUsers(users)
  }

  // Leave Request operations
  static getLeaveRequests(): LeaveRequest[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("leaveRequests")
    return data ? JSON.parse(data) : []
  }

  static saveLeaveRequests(requests: LeaveRequest[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem("leaveRequests", JSON.stringify(requests))
  }

  static getLeaveRequestById(id: string): LeaveRequest | undefined {
    return this.getLeaveRequests().find((r) => r.id === id)
  }

  static getLeaveRequestsByUserId(userId: string): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.userId === userId)
  }

  static getLeaveRequestsSubmittedBy(userId: string): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.submittedBy === userId)
  }

  static getLeaveRequestsBySite(site: string): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.site === site)
  }

  static getLeaveRequestsByStatus(status: LeaveStatus): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.status === status)
  }

  static getPendingRequestsForDIC(site: string): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.status === "pending_dic" && r.site === site)
  }

  static getPendingRequestsForDICBySiteDept(site: string, departemen: string): LeaveRequest[] {
    return this.getLeaveRequests().filter(
      (r) => r.status === "pending_dic" && r.site === site && r.departemen === departemen,
    )
  }

  static getPendingRequestsForPJO(site: string): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.status === "pending_pjo" && r.site === site)
  }

  static getPendingRequestsForPJOBySite(site: string): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.status === "pending_pjo" && r.site === site)
  }

  static getPendingRequestsForPJOBySiteDept(site: string, departemen: string): LeaveRequest[] {
    return this.getLeaveRequests().filter(
      (r) => r.status === "pending_pjo" && r.site === site && r.departemen === departemen,
    )
  }

  static getPendingRequestsForHRHO(): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.status === "pending_hr_ho")
  }

  static getApprovedRequests(): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.status === "approved")
  }

  static addLeaveRequest(request: LeaveRequest): void {
    const requests = this.getLeaveRequests()
    requests.push(request)
    this.saveLeaveRequests(requests)
  }

  static updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): void {
    const requests = this.getLeaveRequests()
    const index = requests.findIndex((r) => r.id === id)
    if (index !== -1) {
      requests[index] = {
        ...requests[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      this.saveLeaveRequests(requests)
    }
  }

  static deleteLeaveRequest(id: string): void {
    const requests = this.getLeaveRequests().filter((r) => r.id !== id)
    this.saveLeaveRequests(requests)
  }

  // Approval History operations
  static getApprovalHistory(): ApprovalHistory[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("approvalHistory")
    return data ? JSON.parse(data) : []
  }

  static saveApprovalHistory(history: ApprovalHistory[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem("approvalHistory", JSON.stringify(history))
  }

  static getApprovalHistoryByRequestId(requestId: string): ApprovalHistory[] {
    return this.getApprovalHistory().filter((h) => h.requestId === requestId)
  }

  static addApprovalHistory(history: ApprovalHistory): void {
    const allHistory = this.getApprovalHistory()
    allHistory.push(history)
    this.saveApprovalHistory(allHistory)
  }

  // Workflow operations
  static approveRequest(
    requestId: string,
    approverUserId: string,
    approverName: string,
    approverRole: UserRole,
    notes: string,
  ): void {
    const request = this.getLeaveRequestById(requestId)
    if (!request) return

    // Add to approval history
    const historyEntry: ApprovalHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId,
      approverUserId,
      approverName,
      approverRole,
      action: "approved",
      notes,
      timestamp: new Date().toISOString(),
    }
    this.addApprovalHistory(historyEntry)

    let newStatus: LeaveStatus = request.status

    if (request.status === "pending_dic") {
      newStatus = "pending_pjo"
    } else if (request.status === "pending_pjo") {
      newStatus = "pending_hr_ho"
    } else if (request.status === "pending_hr_ho") {
      newStatus = "approved"
    }

    this.updateLeaveRequest(requestId, { status: newStatus })
  }

  static rejectRequest(
    requestId: string,
    approverUserId: string,
    approverName: string,
    approverRole: UserRole,
    notes: string,
  ): void {
    // Add to approval history
    const historyEntry: ApprovalHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId,
      approverUserId,
      approverName,
      approverRole,
      action: "rejected",
      notes,
      timestamp: new Date().toISOString(),
    }
    this.addApprovalHistory(historyEntry)

    // Update request status to rejected
    this.updateLeaveRequest(requestId, { status: "rejected" })
  }

  static setBookingCode(requestId: string, bookingCode: string): void {
    this.updateLeaveRequest(requestId, { bookingCode })
  }

  // Statistics
  static getStatsByUser(userId: string) {
    const requests = this.getLeaveRequestsByUserId(userId)
    return {
      total: requests.length,
      pending: requests.filter(
        (r) => r.status === "pending_dic" || r.status === "pending_pjo" || r.status === "pending_hr_ho",
      ).length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }
  }

  static getStatsBySite(site: string) {
    const requests = this.getLeaveRequestsBySite(site)
    return {
      total: requests.length,
      pending: requests.filter(
        (r) => r.status === "pending_dic" || r.status === "pending_pjo" || r.status === "pending_hr_ho",
      ).length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }
  }

  static getAllStats() {
    const requests = this.getLeaveRequests()
    return {
      total: requests.length,
      pendingDIC: requests.filter((r) => r.status === "pending_dic").length,
      pendingPJO: requests.filter((r) => r.status === "pending_pjo").length,
      pendingHRHO: requests.filter((r) => r.status === "pending_hr_ho").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }
  }

  static getAllRequestsBySite(site: string): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.site === site)
  }

  static getRequestsByUserIdWithHistory(userId: string): Array<LeaveRequest & { history: ApprovalHistory[] }> {
    const requests = this.getLeaveRequestsByUserId(userId)
    return requests.map((r) => ({
      ...r,
      history: this.getApprovalHistoryByRequestId(r.id),
    }))
  }

  static getRequestsBySiteWithHistory(site: string): Array<LeaveRequest & { history: ApprovalHistory[] }> {
    const requests = this.getAllRequestsBySite(site)
    return requests.map((r) => ({
      ...r,
      history: this.getApprovalHistoryByRequestId(r.id),
    }))
  }

  static getApprovedRequestsBySite(site: string): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.site === site && r.status === "approved")
  }

  static getRejectedRequestsBySite(site: string): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.site === site && r.status === "rejected")
  }

  static getRequestsByUserIdAndStatus(userId: string, status: LeaveStatus): LeaveRequest[] {
    return this.getLeaveRequests().filter((r) => r.userId === userId && r.status === status)
  }
}
