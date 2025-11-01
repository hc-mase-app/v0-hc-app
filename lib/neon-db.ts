import { neon } from "@neondatabase/serverless";

const getSql = () => {
  const connectionString = process.env.DATABASE_URL!;
  return neon(connectionString);
};

// ===========================================================
// GET DATA
// ===========================================================
export async function getUsers() {
  const sql = getSql();
  try {
    const result = await sql`SELECT * FROM users ORDER BY id ASC`;
    return result;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function getUserById(id: string | number) {
  const sql = getSql();
  try {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

export async function getUserByNik(nik: string) {
  const sql = getSql();
  try {
    const result = await sql`SELECT * FROM users WHERE nik = ${nik}`;
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching user by NIK:", error);
    throw error;
  }
}

export async function getUsersByRole(role: string) {
  const sql = getSql();
  try {
    const result = await sql`SELECT * FROM users WHERE role = ${role} ORDER BY nama`;
    return result;
  } catch (error) {
    console.error("Error fetching users by role:", error);
    throw error;
  }
}

// ===========================================================
// INSERT DATA
// ===========================================================
export async function addUser(data: any) {
  const sql = getSql();
  try {
    const {
      nik,
      nama,
      email_prefix,
      password,
      role,
      site,
      jabatan,
      departemen,
      poh,
      status_karyawan,
      no_ktp,
      no_telp,
      tanggal_lahir,
      jenis_kelamin
    } = data;

    const result = await sql`
      INSERT INTO users (
        nik, nama, email_prefix, password, role, site, jabatan, departemen, poh, 
        status_karyawan, no_ktp, no_telp, tanggal_lahir, jenis_kelamin
      )
      VALUES (
        ${nik}, ${nama}, ${email_prefix}, ${password}, ${role}, ${site}, ${jabatan}, 
        ${departemen}, ${poh}, ${status_karyawan}, ${no_ktp}, ${no_telp}, 
        ${tanggal_lahir}, ${jenis_kelamin}
      )
      RETURNING *
    `;

    return result[0];
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
}

// ===========================================================
// UPDATE DATA
// ===========================================================
export async function updateUser(id: string | number, updates: any) {
  const sql = getSql();
  try {
    const fields = Object.entries(updates)
      .map(([key, value]) => sql`${sql(key)} = ${value}`);

    if (fields.length === 0) {
      throw new Error("Tidak ada field yang diupdate");
    }

    const result = await sql`
      UPDATE users
      SET ${sql.join(fields, sql`, `)}
      WHERE id = ${id}
      RETURNING *
    `;

    return result[0];
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// ===========================================================
// DELETE DATA
// ===========================================================
export async function deleteUser(id: string | number) {
  const sql = getSql();
  try {
    await sql`DELETE FROM users WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// ===========================================================
// LOGIN (untuk autentikasi sederhana tanpa hash)
// ===========================================================
export async function loginUser(nik: string, password: string) {
  const sql = getSql();
  try {
    const result = await sql`
      SELECT * FROM users
      WHERE nik = ${nik} AND password = ${password}
      LIMIT 1
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error login:", error);
    throw error;
  }
}
