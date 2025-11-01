import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Ambil user berdasarkan NIK
export async function getUserByNik(nik: string) {
  try {
    const result = await sql`
      SELECT * FROM users WHERE nik = ${nik} LIMIT 1;
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching user by NIK:", error);
    throw error;
  }
}

// Ambil semua user
export async function getUsers() {
  try {
    const result = await sql`SELECT * FROM users;`;
    return result;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

// Tambah user baru
export async function addUser(user: any) {
  try {
    const result = await sql`
      INSERT INTO users (
        nik, name, email, password, role, jabatan, departemen, poh, site,
        status_karyawan, no_ktp, no_telp, tanggal_lahir, jenis_kelamin
      ) VALUES (
        ${user.nik}, ${user.name}, ${user.email}, ${user.password}, ${user.role},
        ${user.jabatan}, ${user.departemen}, ${user.poh}, ${user.site},
        ${user.status_karyawan}, ${user.no_ktp}, ${user.no_telp},
        ${user.tanggal_lahir}, ${user.jenis_kelamin}
      )
      RETURNING *;
    `;
    return result[0];
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
}

// Update user berdasarkan ID
export async function updateUser(id: number, updates: any) {
  try {
    const result = await sql`
      UPDATE users
      SET
        name = ${updates.name},
        email = ${updates.email},
        role = ${updates.role},
        jabatan = ${updates.jabatan},
        departemen = ${updates.departemen},
        poh = ${updates.poh},
        site = ${updates.site},
        status_karyawan = ${updates.status_karyawan},
        no_ktp = ${updates.no_ktp},
        no_telp = ${updates.no_telp},
        tanggal_lahir = ${updates.tanggal_lahir},
        jenis_kelamin = ${updates.jenis_kelamin}
      WHERE id = ${id}
      RETURNING *;
    `;
    return result[0];
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}
