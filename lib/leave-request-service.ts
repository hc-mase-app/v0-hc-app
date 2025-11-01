import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function getPendingRequestsForDIC(site: string, departemen: string) {
  try {
    return await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'pending_dic' AND u.site = ${site} AND u.departemen = ${departemen}
      ORDER BY lr.created_at DESC
    `
  } catch (error) {
    console.error("[LeaveRequest] Error fetching DIC pending:", error)
    return []
  }
}

export async function getPendingRequestsForPJO(site: string) {
  try {
    return await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'pending_pjo' AND u.site = ${site}
      ORDER BY lr.created_at DESC
    `
  } catch (error) {
    console.error("[LeaveRequest] Error fetching PJO pending:", error)
    return []
  }
}

export async function getPendingRequestsForHRHO() {
  try {
    return await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'pending_hr_ho'
      ORDER BY lr.created_at DESC
    `
  } catch (error) {
    console.error("[LeaveRequest] Error fetching HR HO pending:", error)
    return []
  }
}

export async function getRequestsForHRTicketing() {
  try {
    return await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.status = 'di_proses'
      ORDER BY lr.created_at DESC
    `
  } catch (error) {
    console.error("[LeaveRequest] Error fetching HR Ticketing requests:", error)
    return []
  }
}

export async function getUserLeaveRequests(nik: string) {
  try {
    return await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.nik = ${nik}
      ORDER BY lr.created_at DESC
    `
  } catch (error) {
    console.error("[LeaveRequest] Error fetching user requests:", error)
    return []
  }
}

export async function getRequestById(requestId: string) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name, u.site, u.jabatan, u.departemen, u.poh, u.status_karyawan,
        u.no_ktp, u.no_telp, u.email, u.tanggal_lahir, u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      WHERE lr.id = ${requestId}
    `
    return result[0] || null
  } catch (error) {
    console.error("[LeaveRequest] Error fetching request by ID:", error)
    return null
  }
}

export async function createLeaveRequest(data: any) {
  try {
    const result = await sql`
      INSERT INTO leave_requests (
        nik, jenis_cuti, tanggal_pengajuan, periode_awal, periode_akhir, 
        jumlah_hari, berangkat_dari, tujuan, tanggal_keberangkatan, 
        cuti_periodik_berikutnya, catatan, status, submitted_by
      ) VALUES (
        ${data.nik}, ${data.jenisCuti}, ${data.tanggalPengajuan}, ${data.periodeAwal}, 
        ${data.periodeAkhir}, ${data.jumlahHari}, ${data.berangkatDari || null}, 
        ${data.tujuan || null}, ${data.tanggalKeberangkatan || null}, 
        ${data.cutiPeriodikBerikutnya || null}, ${data.catatan || null}, 
        'pending_dic', ${data.submittedBy || null}
      )
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("[LeaveRequest] Error creating request:", error)
    throw error
  }
}

export async function updateBookingCode(requestId: string, bookingCode: string) {
  try {
    const result = await sql`
      UPDATE leave_requests 
      SET booking_code = ${bookingCode}, status = 'tiket_issued', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId}
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("[LeaveRequest] Error updating booking code:", error)
    throw error
  }
}

export async function getApprovalHistory(requestId: string) {
  try {
    return await sql`
      SELECT * FROM approval_history 
      WHERE leave_request_id = ${requestId}
      ORDER BY created_at DESC
    `
  } catch (error) {
    console.error("[LeaveRequest] Error fetching approval history:", error)
    return []
  }
}
