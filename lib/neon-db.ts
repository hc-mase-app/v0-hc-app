import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

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
    const setClause = Object.entries(updates)
      .map(([key, value]) => {
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()
        return `${dbKey} = '${value}'`
      })
      .join(", ")

    const result = await sql`
      UPDATE users 
      SET ${sql(setClause)}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id} 
      RETURNING *
    `
    return transformUserData(result[0])
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
    const result = await sql`SELECT * FROM leave_requests ORDER BY created_at DESC`
    return result
  } catch (error) {
    console.error("Error fetching leave requests:", error)
    return []
  }
}

export async function getLeaveRequestById(id: string) {
  try {
    const result = await sql`SELECT * FROM leave_requests WHERE id = ${id}`
    return result[0] || null
  } catch (error) {
    console.error("Error fetching leave request:", error)
    return null
  }
}

export async function getLeaveRequestsByUserId(userId: string) {
  try {
    const result = await sql`
      SELECT * FROM leave_requests 
      WHERE user_nik = ${userId} 
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error fetching leave requests by user:", error)
    return []
  }
}

export async function getLeaveRequestsBySite(site: string) {
  try {
    const result = await sql`
      SELECT * FROM leave_requests 
      WHERE site = ${site} 
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error fetching leave requests by site:", error)
    return []
  }
}

export async function getLeaveRequestsByStatus(status: string) {
  try {
    const result = await sql`
      SELECT * FROM leave_requests 
      WHERE status = ${status} 
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error fetching leave requests by status:", error)
    return []
  }
}

export async function getPendingRequestsForDIC(site: string) {
  try {
    const result = await sql`
      SELECT * FROM leave_requests 
      WHERE status = 'pending_dic' AND site = ${site} 
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error fetching pending requests for DIC:", error)
    return []
  }
}

export async function getPendingRequestsForPJO(site: string) {
  try {
    const result = await sql`
      SELECT * FROM leave_requests 
      WHERE status = 'pending_pjo' AND site = ${site} 
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error fetching pending requests for PJO:", error)
    return []
  }
}

export async function getPendingRequestsForHRHO() {
  try {
    const result = await sql`
      SELECT * FROM leave_requests 
      WHERE status = 'pending_hr_ho' 
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error fetching pending requests for HR HO:", error)
    return []
  }
}

export async function getApprovedRequests() {
  try {
    const result = await sql`
      SELECT * FROM leave_requests 
      WHERE status = 'approved' 
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error fetching approved requests:", error)
    return []
  }
}

export async function addLeaveRequest(request: any) {
  try {
    const result = await sql`
      INSERT INTO leave_requests (
        user_nik, user_name, site, jabatan, departemen, poh, status_karyawan,
        no_ktp, no_telp, email, jenis_cuti, tanggal_pengajuan, periode_awal,
        periode_akhir, jumlah_hari, berangkat_dari, tujuan, tanggal_keberangkatan,
        cuti_periodik_berikutnya, catatan, status, submitted_by,
        tanggal_lahir, jenis_kelamin, booking_code
      ) VALUES (
        ${request.userNik}, ${request.userName}, ${request.site}, 
        ${request.jabatan}, ${request.departemen}, ${request.poh}, 
        ${request.statusKaryawan}, ${request.noKtp}, ${request.noTelp}, 
        ${request.email}, ${request.jenisCuti}, ${request.tanggalPengajuan}, 
        ${request.periodeAwal}, ${request.periodeAkhir}, ${request.jumlahHari}, 
        ${request.berangkatDari}, ${request.tujuan}, ${request.tanggalKeberangkatan || null},
        ${request.cutiPeriodikBerikutnya || null}, ${request.catatan || null}, 
        ${request.status}, ${request.submittedBy || null},
        ${request.tanggalLahir || null}, ${request.jenisKelamin || null}, 
        ${request.bookingCode || null}
      )
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error adding leave request:", error)
    throw error
  }
}

export async function updateLeaveRequest(id: string, updates: any) {
  try {
    const setClause = Object.entries(updates)
      .map(([key, value]) => {
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()
        return `${dbKey} = '${value}'`
      })
      .join(", ")

    const result = await sql`
      UPDATE leave_requests 
      SET ${sql(setClause)}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id} 
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error updating leave request:", error)
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
      SELECT * FROM leave_requests 
      WHERE submitted_by = ${userId} 
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error fetching leave requests submitted by user:", error)
    return []
  }
}

// ============ APPROVAL HISTORY OPERATIONS ============

export async function getApprovalHistory() {
  try {
    const result = await sql`SELECT * FROM approval_history ORDER BY created_at DESC`
    return result
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
      ORDER BY created_at DESC
    `
    return result
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
