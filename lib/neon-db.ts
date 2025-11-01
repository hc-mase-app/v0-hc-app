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

function transformLeaveRequestData(dbRequest: any) {
  if (!dbRequest) return null

  return {
    id: dbRequest.id,
    userNik: dbRequest.nik,
    userName: dbRequest.user_name || dbRequest.name || dbRequest.nik, // Get name from joined users table
    site: dbRequest.site, // From joined users table
    jabatan: dbRequest.jabatan, // From joined users table
    departemen: dbRequest.departemen, // From joined users table
    poh: dbRequest.poh, // From joined users table
    statusKaryawan: dbRequest.status_karyawan, // From joined users table
    noKtp: dbRequest.no_ktp, // From joined users table
    noTelp: dbRequest.no_telp, // From joined users table
    email: dbRequest.email, // From joined users table
    tanggalLahir: dbRequest.tanggal_lahir, // From joined users table
    jenisKelamin: dbRequest.jenis_kelamin, // From joined users table
    jenisPengajuanCuti: dbRequest.jenis_cuti,
    jenisCuti: dbRequest.jenis_cuti,
    tanggalPengajuan: dbRequest.tanggal_pengajuan,
    tanggalMulai: dbRequest.periode_awal,
    tanggalSelesai: dbRequest.periode_akhir,
    periodeAwal: dbRequest.periode_awal,
    periodeAkhir: dbRequest.periode_akhir,
    jumlahHari: dbRequest.jumlah_hari,
    berangkatDari: dbRequest.berangkat_dari,
    tujuan: dbRequest.tujuan,
    tanggalKeberangkatan: dbRequest.tanggal_keberangkatan,
    tanggalCutiPeriodikBerikutnya: dbRequest.cuti_periodik_berikutnya,
    cutiPeriodikBerikutnya: dbRequest.cuti_periodik_berikutnya,
    catatan: dbRequest.catatan,
    alasan: dbRequest.catatan,
    status: dbRequest.status,
    submittedBy: dbRequest.submitted_by,
    bookingCode: dbRequest.booking_code,
    createdAt: dbRequest.created_at,
    updatedAt: dbRequest.updated_at,
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
    return result.map(transformLeaveRequestData)
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
    return transformLeaveRequestData(result[0])
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
    return result.map(transformLeaveRequestData)
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
    return result.map(transformLeaveRequestData)
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
    return result.map(transformLeaveRequestData)
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
    return result.map(transformLeaveRequestData)
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
    return result.map(transformLeaveRequestData)
  } catch (error) {
    console.error("Error fetching pending requests for DIC by site/dept:", error)
    return []
  }
}

export async function getPendingRequestsForPJO(site: string) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'pending_pjo' AND u.site = ${site}
      ORDER BY lr.created_at DESC
    `
    return result.map(transformLeaveRequestData)
  } catch (error) {
    console.error("Error fetching pending requests for PJO:", error)
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
    return result.map(transformLeaveRequestData)
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
    return result.map(transformLeaveRequestData)
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
        cuti_periodik_berikutnya, catatan, status, submitted_by
      ) VALUES (
        ${request.userNik || request.nik}, 
        ${request.jenisCuti || request.jenisPengajuanCuti}, 
        ${request.tanggalPengajuan}, 
        ${request.periodeAwal || request.tanggalMulai}, 
        ${request.periodeAkhir || request.tanggalSelesai}, 
        ${request.jumlahHari}, 
        ${request.berangkatDari || null}, 
        ${request.tujuan || null},
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
    return result.map(transformLeaveRequestData)
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
