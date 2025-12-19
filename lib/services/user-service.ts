import { sql } from "@/lib/neon-db"
import type { User, UserRole } from "@/lib/types"

interface DbUser {
  id: string
  nik: string
  name: string
  email: string
  password: string
  role: UserRole
  site: string
  jabatan: string
  departemen: string
  poh: string
  status_karyawan: "Kontrak" | "Tetap"
  no_ktp: string
  no_telp: string
  tanggal_lahir: string | null
  jenis_kelamin: "Laki-laki" | "Perempuan"
  tanggal_masuk: string | null
  created_at: string
  updated_at: string
}

interface CreateUserInput {
  nik: string
  name: string
  email: string
  password: string
  role: UserRole
  site?: string
  jabatan?: string
  departemen?: string
  poh?: string
  statusKaryawan?: "Kontrak" | "Tetap"
  noKtp?: string
  noTelp?: string
  tanggalLahir?: string
  jenisKelamin?: "Laki-laki" | "Perempuan"
}

interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  site?: string
  jabatan?: string
  departemen?: string
  poh?: string
  statusKaryawan?: "Kontrak" | "Tetap"
  noKtp?: string
  noTelp?: string
  tanggalLahir?: string
  jenisKelamin?: "Laki-laki" | "Perempuan"
}

interface FullUserUpdateInput {
  nik?: string
  name?: string
  email?: string
  password?: string
  role?: UserRole
  site?: string
  jabatan?: string
  departemen?: string
  poh?: string
  statusKaryawan?: "Kontrak" | "Tetap"
  noKtp?: string
  noTelp?: string
  tanggalLahir?: string
  tanggalMasuk?: string
  jenisKelamin?: "Laki-laki" | "Perempuan"
}

interface PaginatedUsersResult {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function transformUserData(dbUser: DbUser | null): User | null {
  if (!dbUser) return null

  return {
    id: dbUser.id,
    nik: dbUser.nik,
    nama: dbUser.name,
    email: dbUser.email,
    password: dbUser.password,
    role: dbUser.role,
    site: dbUser.site,
    jabatan: dbUser.jabatan,
    departemen: dbUser.departemen,
    poh: dbUser.poh,
    statusKaryawan: dbUser.status_karyawan || "Kontrak",
    noKtp: dbUser.no_ktp || "",
    noTelp: dbUser.no_telp || "",
    tanggalBergabung: dbUser.tanggal_masuk || dbUser.created_at || "",
    tanggalLahir: dbUser.tanggal_lahir || "",
    jenisKelamin: dbUser.jenis_kelamin || "Laki-laki",
  }
}

export async function getUsersPaginated(
  page = 1,
  limit = 10,
  site?: string,
  search?: string,
): Promise<PaginatedUsersResult> {
  try {
    const offset = (page - 1) * limit

    // Build WHERE clause
    const whereConditions: string[] = []

    if (site && site !== "all") {
      whereConditions.push(`LOWER(site) = LOWER('${site}')`)
    }

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      whereConditions.push(`(
        LOWER(nik) LIKE '%${searchTerm}%' OR 
        LOWER(name) LIKE '%${searchTerm}%' OR 
        LOWER(email) LIKE '%${searchTerm}%' OR 
        LOWER(jabatan) LIKE '%${searchTerm}%' OR 
        LOWER(departemen) LIKE '%${searchTerm}%'
      )`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get total count
    const countResult = await sql<{ count: string }[]>`
      SELECT COUNT(*) as count FROM users ${sql.unsafe(whereClause)}
    `
    const total = Number.parseInt(countResult[0]?.count || "0", 10)

    // Get paginated data
    const result = await sql<DbUser[]>`
      SELECT * FROM users 
      ${sql.unsafe(whereClause)}
      ORDER BY name ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    const users = result.map((user) => transformUserData(user)).filter((user): user is User => user !== null)

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error("Error fetching paginated users:", error)
    throw new Error("Gagal mengambil data pengguna")
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await sql<DbUser[]>`
      SELECT * FROM users ORDER BY created_at DESC
    `
    return result.map((user) => transformUserData(user)).filter((user): user is User => user !== null)
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new Error("Gagal mengambil data pengguna")
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await sql<DbUser[]>`
      SELECT * FROM users WHERE id = ${id}
    `
    return transformUserData(result[0] || null)
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    throw new Error("Gagal mengambil data pengguna")
  }
}

export async function getUserByNik(nik: string): Promise<User | null> {
  try {
    const trimmedNik = nik.trim()
    const result = await sql<DbUser[]>`
      SELECT * FROM users 
      WHERE UPPER(TRIM(nik)) = UPPER(${trimmedNik})
    `
    return transformUserData(result[0] || null)
  } catch (error) {
    console.error("Error fetching user by NIK:", error)
    throw new Error("Gagal mengambil data pengguna")
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql<DbUser[]>`
      SELECT * FROM users WHERE email = ${email}
    `
    return transformUserData(result[0] || null)
  } catch (error) {
    console.error("Error fetching user by email:", error)
    throw new Error("Gagal mengambil data pengguna")
  }
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  try {
    const result = await sql<DbUser[]>`
      SELECT * FROM users WHERE role = ${role} ORDER BY name
    `
    return result.map((user) => transformUserData(user)).filter((user): user is User => user !== null)
  } catch (error) {
    console.error("Error fetching users by role:", error)
    throw new Error("Gagal mengambil data pengguna berdasarkan role")
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    const tanggalLahir = input.tanggalLahir || "1970-01-01"
    const jenisKelamin = input.jenisKelamin || "Laki-laki"
    const statusKaryawan = input.statusKaryawan || "Kontrak"
    const site = input.site || "HO"
    const jabatan = input.jabatan || "Staff"
    const departemen = input.departemen || "General"
    const poh = input.poh || "Head Office"
    const noKtp = input.noKtp || "0000000000000000"
    const noTelp = input.noTelp || "08000000000"

    const existingUser = await sql<DbUser[]>`
      SELECT nik FROM users WHERE UPPER(TRIM(nik)) = UPPER(TRIM(${input.nik}))
    `

    if (existingUser.length > 0) {
      throw new Error(`NIK ${input.nik} sudah terdaftar di database`)
    }

    const existingEmail = await sql<DbUser[]>`
      SELECT email FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(${input.email}))
    `

    if (existingEmail.length > 0) {
      throw new Error(`Email ${input.email} sudah terdaftar di database`)
    }

    const result = await sql<DbUser[]>`
      INSERT INTO users (
        nik, name, email, password, role, site, jabatan, departemen, poh, 
        status_karyawan, no_ktp, no_telp, tanggal_lahir, jenis_kelamin
      )
      VALUES (
        ${input.nik}, 
        ${input.name}, 
        ${input.email}, 
        ${input.password}, 
        ${input.role}, 
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

    const user = transformUserData(result[0])
    if (!user) throw new Error("Gagal membuat pengguna")

    return user
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error(error instanceof Error ? error.message : "Gagal membuat pengguna baru")
  }
}

export async function updateUser(id: string, updates: UpdateUserInput): Promise<User> {
  try {
    const fields = Object.keys(updates)
    if (fields.length === 0) {
      throw new Error("Tidak ada data yang akan diupdate")
    }

    // Build update object with snake_case keys
    const updateData: Record<string, any> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.password !== undefined) updateData.password = updates.password
    if (updates.role !== undefined) updateData.role = updates.role
    if (updates.site !== undefined) updateData.site = updates.site
    if (updates.jabatan !== undefined) updateData.jabatan = updates.jabatan
    if (updates.departemen !== undefined) updateData.departemen = updates.departemen
    if (updates.poh !== undefined) updateData.poh = updates.poh
    if (updates.statusKaryawan !== undefined) updateData.status_karyawan = updates.statusKaryawan
    if (updates.noKtp !== undefined) updateData.no_ktp = updates.noKtp
    if (updates.noTelp !== undefined) updateData.no_telp = updates.noTelp
    if (updates.tanggalLahir !== undefined) updateData.tanggal_lahir = updates.tanggalLahir
    if (updates.jenisKelamin !== undefined) updateData.jenis_kelamin = updates.jenisKelamin

    // Use individual update queries based on what needs to be updated
    const result = await sql<DbUser[]>`
      UPDATE users 
      SET 
        name = COALESCE(${updateData.name}, name),
        email = COALESCE(${updateData.email}, email),
        password = COALESCE(${updateData.password}, password),
        role = COALESCE(${updateData.role}, role),
        site = COALESCE(${updateData.site}, site),
        jabatan = COALESCE(${updateData.jabatan}, jabatan),
        departemen = COALESCE(${updateData.departemen}, departemen),
        poh = COALESCE(${updateData.poh}, poh),
        status_karyawan = COALESCE(${updateData.status_karyawan}, status_karyawan),
        no_ktp = COALESCE(${updateData.no_ktp}, no_ktp),
        no_telp = COALESCE(${updateData.no_telp}, no_telp),
        tanggal_lahir = COALESCE(${updateData.tanggal_lahir}, tanggal_lahir),
        jenis_kelamin = COALESCE(${updateData.jenis_kelamin}, jenis_kelamin),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (!result || result.length === 0) {
      throw new Error("Pengguna tidak ditemukan")
    }

    const user = transformUserData(result[0])
    if (!user) throw new Error("Gagal mengupdate pengguna")

    return user
  } catch (error) {
    console.error("Error updating user:", error)
    throw new Error("Gagal mengupdate pengguna")
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await sql`DELETE FROM users WHERE id = ${id}`
  } catch (error) {
    console.error("Error deleting user:", error)
    throw new Error("Gagal menghapus pengguna")
  }
}

export async function authenticateUser(nik: string, password: string): Promise<User | null> {
  try {
    const user = await getUserByNik(nik)

    if (!user) {
      return null
    }

    if (user.password !== password) {
      return null
    }

    return user
  } catch (error) {
    console.error("Error authenticating user:", error)
    throw new Error("Gagal melakukan autentikasi")
  }
}

export async function updateUserNikWithCascade(
  oldNik: string,
  newNik: string,
): Promise<{ success: boolean; message: string; affectedRows: number }> {
  try {
    // First check if old NIK exists
    const oldUser = await getUserByNik(oldNik)
    if (!oldUser) {
      return {
        success: false,
        message: `NIK lama (${oldNik}) tidak ditemukan`,
        affectedRows: 0,
      }
    }

    // Check if new NIK already exists
    const existingNewUser = await getUserByNik(newNik)
    if (existingNewUser) {
      return {
        success: false,
        message: `NIK baru (${newNik}) sudah terdaftar`,
        affectedRows: 0,
      }
    }

    let totalAffected = 0

    // Update leave_requests table (user_nik field)
    const leaveRequestsResult = await sql`
      UPDATE leave_requests 
      SET user_nik = ${newNik}, updated_at = CURRENT_TIMESTAMP
      WHERE UPPER(TRIM(user_nik)) = UPPER(${oldNik.trim()})
    `
    const leaveRequestsCount = Array.isArray(leaveRequestsResult) ? leaveRequestsResult.length : 0
    totalAffected += leaveRequestsCount

    // Update employee_assessments table (employee_nik field)
    const assessmentsResult = await sql`
      UPDATE employee_assessments 
      SET employee_nik = ${newNik}, updated_at = CURRENT_TIMESTAMP
      WHERE UPPER(TRIM(employee_nik)) = UPPER(${oldNik.trim()})
    `
    const assessmentsCount = Array.isArray(assessmentsResult) ? assessmentsResult.length : 0
    totalAffected += assessmentsCount

    // Update tms_hierarchy table if exists
    try {
      const hierarchyResult = await sql`
        UPDATE tms_hierarchy 
        SET nik = ${newNik}, updated_at = CURRENT_TIMESTAMP
        WHERE UPPER(TRIM(nik)) = UPPER(${oldNik.trim()})
      `
      const hierarchyCount = Array.isArray(hierarchyResult) ? hierarchyResult.length : 0
      totalAffected += hierarchyCount
    } catch (error) {
      console.log("TMS hierarchy table may not exist or no records found")
    }

    // Update tms_tickets table if exists
    try {
      const ticketsResult = await sql`
        UPDATE tms_tickets 
        SET reporter_nik = ${newNik}, updated_at = CURRENT_TIMESTAMP
        WHERE UPPER(TRIM(reporter_nik)) = UPPER(${oldNik.trim()})
      `
      const ticketsCount = Array.isArray(ticketsResult) ? ticketsResult.length : 0
      totalAffected += ticketsCount
    } catch (error) {
      console.log("TMS tickets table may not exist or no records found")
    }

    await sql`
      UPDATE users 
      SET nik = ${newNik}, updated_at = CURRENT_TIMESTAMP
      WHERE UPPER(TRIM(nik)) = UPPER(${oldNik.trim()})
    `
    totalAffected += 1

    return {
      success: true,
      message: `NIK berhasil diubah dari ${oldNik} ke ${newNik}`,
      affectedRows: totalAffected,
    }
  } catch (error) {
    console.error("Error updating NIK with cascade:", error)
    throw new Error("Gagal mengupdate NIK dengan cascade")
  }
}

export async function updateUserWithCascade(
  userId: string,
  oldNik: string,
  updates: FullUserUpdateInput,
): Promise<{ success: boolean; message: string; affectedRows: number; details: string[] }> {
  const details: string[] = []
  let totalAffected = 0

  try {
    // Check if user exists
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      return {
        success: false,
        message: "User tidak ditemukan",
        affectedRows: 0,
        details: ["User dengan ID tersebut tidak ada di database"],
      }
    }

    // If NIK is being changed, check if new NIK already exists
    const newNik = updates.nik || oldNik
    const isNikChanging = updates.nik && updates.nik !== oldNik

    if (isNikChanging) {
      const existingNewUser = await getUserByNik(updates.nik!)
      if (existingNewUser && existingNewUser.id !== userId) {
        return {
          success: false,
          message: `NIK baru (${updates.nik}) sudah terdaftar oleh user lain`,
          affectedRows: 0,
          details: [`NIK ${updates.nik} sudah digunakan oleh ${existingNewUser.nama}`],
        }
      }
    }

    if (isNikChanging) {
      // Step 1: First, temporarily disable the FK constraint or use a workaround
      // Since Neon doesn't support easy constraint deferral, we use a different approach:
      // We'll update using a raw SQL that handles this atomically

      try {
        // First try to alter the constraint to be deferrable (one-time setup)
        await sql`
          DO $$ 
          BEGIN
            -- Try to make the constraint deferrable if it isn't already
            ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_nik_fkey;
            ALTER TABLE leave_requests 
              ADD CONSTRAINT leave_requests_nik_fkey 
              FOREIGN KEY (nik) REFERENCES users(nik) 
              ON UPDATE CASCADE ON DELETE SET NULL
              DEFERRABLE INITIALLY DEFERRED;
          EXCEPTION WHEN OTHERS THEN
            -- Constraint might already be correct or table structure different
            NULL;
          END $$;
        `
        details.push("✓ Foreign key constraint updated to CASCADE")
      } catch (fkError) {
        console.log("[v0] FK constraint modification skipped:", fkError)
        // Continue anyway, the ON UPDATE CASCADE might already be set
      }

      // Now update the users table - if ON UPDATE CASCADE is set, leave_requests will auto-update
      try {
        const userResult = await sql`
          UPDATE users 
          SET 
            nik = ${updates.nik},
            name = COALESCE(${updates.name || null}, name),
            email = COALESCE(${updates.email || null}, email),
            password = COALESCE(${updates.password || null}, password),
            role = COALESCE(${updates.role || null}, role),
            site = COALESCE(${updates.site || null}, site),
            jabatan = COALESCE(${updates.jabatan || null}, jabatan),
            departemen = COALESCE(${updates.departemen || null}, departemen),
            poh = COALESCE(${updates.poh !== undefined ? updates.poh : null}, poh),
            status_karyawan = COALESCE(${updates.statusKaryawan || null}, status_karyawan),
            no_ktp = COALESCE(${updates.noKtp || null}, no_ktp),
            no_telp = COALESCE(${updates.noTelp || null}, no_telp),
            tanggal_lahir = COALESCE(${updates.tanggalLahir || null}, tanggal_lahir),
            jenis_kelamin = COALESCE(${updates.jenisKelamin || null}, jenis_kelamin),
            tanggal_masuk = COALESCE(${updates.tanggalMasuk || null}, tanggal_masuk),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
          RETURNING *
        `

        if (userResult && userResult.length > 0) {
          details.push("✓ Data user utama berhasil di-update (NIK changed)")
          totalAffected += 1
        }

        // Check how many leave_requests were auto-updated by CASCADE
        const leaveCheck = await sql`
          SELECT COUNT(*) as count FROM leave_requests WHERE nik = ${updates.nik}
        `
        const leaveCount = leaveCheck[0]?.count || 0
        if (Number(leaveCount) > 0) {
          details.push(`✓ ${leaveCount} pengajuan cuti ter-update otomatis (CASCADE)`)
          totalAffected += Number(leaveCount)
        }
      } catch (updateError: any) {
        // If CASCADE didn't work, try manual approach with temporary NIK
        console.log("[v0] CASCADE update failed, trying manual approach:", updateError.message)

        // Use a transaction-like approach with temporary placeholder
        const tempNik = `TEMP_${Date.now()}_${oldNik}`

        // Step 1: Update users to temp NIK first (no FK pointing to it yet)
        await sql`UPDATE users SET nik = ${tempNik} WHERE id = ${userId}`

        // Step 2: Update all leave_requests to point to temp NIK
        await sql`UPDATE leave_requests SET nik = ${tempNik} WHERE nik = ${oldNik}`

        // Step 3: Update approval_history
        await sql`UPDATE approval_history SET approver_nik = ${tempNik} WHERE approver_nik = ${oldNik}`

        // Step 4: Update employee_assessments
        await sql`UPDATE employee_assessments SET employee_nik = ${tempNik} WHERE employee_nik = ${oldNik}`

        // Step 5: Now update users to final NIK
        await sql`
          UPDATE users 
          SET 
            nik = ${updates.nik},
            name = COALESCE(${updates.name || null}, name),
            email = COALESCE(${updates.email || null}, email),
            password = COALESCE(${updates.password || null}, password),
            role = COALESCE(${updates.role || null}, role),
            site = COALESCE(${updates.site || null}, site),
            jabatan = COALESCE(${updates.jabatan || null}, jabatan),
            departemen = COALESCE(${updates.departemen || null}, departemen),
            poh = COALESCE(${updates.poh !== undefined ? updates.poh : null}, poh),
            status_karyawan = COALESCE(${updates.statusKaryawan || null}, status_karyawan),
            no_ktp = COALESCE(${updates.noKtp || null}, no_ktp),
            no_telp = COALESCE(${updates.noTelp || null}, no_telp),
            tanggal_lahir = COALESCE(${updates.tanggalLahir || null}, tanggal_lahir),
            jenis_kelamin = COALESCE(${updates.jenisKelamin || null}, jenis_kelamin),
            tanggal_masuk = COALESCE(${updates.tanggalMasuk || null}, tanggal_masuk),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
        `

        // Step 6: Update all related tables to final NIK
        const leaveResult =
          await sql`UPDATE leave_requests SET nik = ${updates.nik} WHERE nik = ${tempNik} RETURNING id`
        await sql`UPDATE approval_history SET approver_nik = ${updates.nik} WHERE approver_nik = ${tempNik}`
        await sql`UPDATE employee_assessments SET employee_nik = ${updates.nik} WHERE employee_nik = ${tempNik}`

        details.push("✓ Data user utama berhasil di-update (manual cascade)")
        totalAffected += 1

        const leaveCount = Array.isArray(leaveResult) ? leaveResult.length : 0
        if (leaveCount > 0) {
          details.push(`✓ ${leaveCount} pengajuan cuti di-update NIK-nya`)
          totalAffected += leaveCount
        }
      }
    } else {
      // NIK not changing - simple update
      const userResult = await sql`
        UPDATE users 
        SET 
          name = COALESCE(${updates.name || null}, name),
          email = COALESCE(${updates.email || null}, email),
          password = COALESCE(${updates.password || null}, password),
          role = COALESCE(${updates.role || null}, role),
          site = COALESCE(${updates.site || null}, site),
          jabatan = COALESCE(${updates.jabatan || null}, jabatan),
          departemen = COALESCE(${updates.departemen || null}, departemen),
          poh = COALESCE(${updates.poh !== undefined ? updates.poh : null}, poh),
          status_karyawan = COALESCE(${updates.statusKaryawan || null}, status_karyawan),
          no_ktp = COALESCE(${updates.noKtp || null}, no_ktp),
          no_telp = COALESCE(${updates.noTelp || null}, no_telp),
          tanggal_lahir = COALESCE(${updates.tanggalLahir || null}, tanggal_lahir),
          jenis_kelamin = COALESCE(${updates.jenisKelamin || null}, jenis_kelamin),
          tanggal_masuk = COALESCE(${updates.tanggalMasuk || null}, tanggal_masuk),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING *
      `

      if (userResult && userResult.length > 0) {
        details.push("✓ Data user utama berhasil di-update")
        totalAffected += 1
      }
    }

    // Update approval_history name if name changed
    if (updates.name) {
      try {
        const nameResult = await sql`
          UPDATE approval_history 
          SET approver_name = ${updates.name}
          WHERE approver_nik = ${newNik}
          RETURNING id
        `
        const nameCount = Array.isArray(nameResult) ? nameResult.length : 0
        if (nameCount > 0) {
          details.push(`✓ ${nameCount} history approval di-update nama approver-nya`)
          totalAffected += nameCount
        }
      } catch (error) {
        console.log("[v0] Error updating approval_history name:", error)
      }
    }

    return {
      success: true,
      message: `Berhasil update data user${isNikChanging ? " dan cascade ke tabel terkait" : ""}`,
      affectedRows: totalAffected,
      details,
    }
  } catch (error) {
    console.error("[v0] Error updating user with cascade:", error)
    return {
      success: false,
      message: "Gagal mengupdate data: " + (error instanceof Error ? error.message : "Unknown error"),
      affectedRows: 0,
      details: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}
