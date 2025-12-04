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
  tanggal_lahir: string
  jenis_kelamin: "Laki-laki" | "Perempuan"
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
    statusKaryawan: dbUser.status_karyawan,
    noKtp: dbUser.no_ktp,
    noTelp: dbUser.no_telp,
    tanggalBergabung: dbUser.created_at,
    tanggalLahir: dbUser.tanggal_lahir,
    jenisKelamin: dbUser.jenis_kelamin,
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
    const statusKaryawan = input.statusKaryawan || "Tetap"
    const site = input.site || "HO"
    const jabatan = input.jabatan || "Staff"
    const departemen = input.departemen || "General"
    const poh = input.poh || "Head Office"
    const noKtp = input.noKtp || "0000000000000000"
    const noTelp = input.noTelp || "08000000000"

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
    throw new Error("Gagal membuat pengguna baru")
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
