import type { LeaveRequest } from "./types"

/**
 * Centralized mapper to transform database rows to LeaveRequest objects
 * Handles both snake_case DB columns and camelCase application fields
 * Provides consistent mapping across all modules
 */
export function mapDbRowToLeaveRequest(row: any): LeaveRequest {
  if (!row) return {} as LeaveRequest

  return {
    // Core identifiers
    id: row.id?.toString() || "",
    userId: row.user_id?.toString() || row.nik?.toString() || "",

    // User information (from joined users table or leave_requests table)
    userName: row.user_name || row.name || "",
    userNik: row.nik || "",
    site: row.site || "",
    jabatan: row.jabatan || "",
    departemen: row.departemen || "",
    poh: row.poh || "",
    statusKaryawan: row.status_karyawan || "",
    noKtp: row.no_ktp || "",
    noTelp: row.no_telp || "",
    email: row.email || "",
    tanggalLahir: row.tanggal_lahir || "",
    jenisKelamin: row.jenis_kelamin || "",

    // Leave request details - support both naming conventions
    jenisPengajuanCuti: row.jenis_cuti || row.jenis_pengajuan_cuti || "",
    jenisCuti: row.jenis_cuti || row.jenis_pengajuan_cuti || "", // Alias
    tanggalPengajuan: row.tanggal_pengajuan || "",
    tanggalKeberangkatan: row.tanggal_keberangkatan || "",

    // Date ranges - support both naming conventions
    tanggalMulai: row.periode_awal || row.tanggal_mulai || "",
    tanggalSelesai: row.periode_akhir || row.tanggal_selesai || "",
    periodeAwal: row.periode_awal || row.tanggal_mulai || "", // Alias
    periodeAkhir: row.periode_akhir || row.tanggal_selesai || "", // Alias

    // Travel details
    jumlahHari: Number(row.jumlah_hari) || 0,
    berangkatDari: row.berangkat_dari || "",
    tujuan: row.tujuan || "",
    lamaOnsite: row.lama_onsite ? Number(row.lama_onsite) : undefined,

    // Additional fields
    sisaCutiTahunan: 0, // Calculated field, not from DB
    tanggalCutiPeriodikBerikutnya: row.cuti_periodik_berikutnya || row.tanggal_cuti_periodik_berikutnya || "",
    cutiPeriodikBerikutnya: row.cuti_periodik_berikutnya || row.tanggal_cuti_periodik_berikutnya || "", // Alias
    catatan: row.catatan || "",
    alasan: row.catatan || row.alasan || "", // Alias for catatan

    // Workflow status
    status: row.status || "pending_dic",

    // Timestamps
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",

    // Booking information (HR Ticketing)
    bookingCode: row.booking_code || undefined,
    namaPesawat: row.nama_pesawat || undefined,
    jamKeberangkatan: row.jam_keberangkatan || undefined,
    bookingCodeIssuedAt: row.booking_code_issued_at || undefined,

    // Submission tracking
    submittedBy: row.submitted_by || "",
    submittedByName: row.submitted_by_name || "",
  }
}

/**
 * Map array of database rows to LeaveRequest objects
 */
export function mapDbRowsToLeaveRequests(rows: any[]): LeaveRequest[] {
  if (!Array.isArray(rows)) {
    console.warn("[v0] mapDbRowsToLeaveRequests: input is not an array", typeof rows)
    return []
  }
  return rows.map(mapDbRowToLeaveRequest)
}

/**
 * Map LeaveRequest object to database columns for INSERT/UPDATE operations
 * Converts camelCase to snake_case for database compatibility
 */
export function mapLeaveRequestToDbRow(request: Partial<LeaveRequest>): Record<string, any> {
  const dbRow: Record<string, any> = {}

  // Map all fields to snake_case
  if (request.userNik !== undefined) dbRow.nik = request.userNik
  if (request.jenisCuti !== undefined) dbRow.jenis_cuti = request.jenisCuti
  if (request.jenisPengajuanCuti !== undefined) dbRow.jenis_cuti = request.jenisPengajuanCuti
  if (request.tanggalPengajuan !== undefined) dbRow.tanggal_pengajuan = request.tanggalPengajuan
  if (request.tanggalMulai !== undefined) dbRow.periode_awal = request.tanggalMulai
  if (request.tanggalSelesai !== undefined) dbRow.periode_akhir = request.tanggalSelesai
  if (request.periodeAwal !== undefined) dbRow.periode_awal = request.periodeAwal
  if (request.periodeAkhir !== undefined) dbRow.periode_akhir = request.periodeAkhir
  if (request.jumlahHari !== undefined) dbRow.jumlah_hari = request.jumlahHari
  if (request.berangkatDari !== undefined) dbRow.berangkat_dari = request.berangkatDari
  if (request.tujuan !== undefined) dbRow.tujuan = request.tujuan
  if (request.tanggalKeberangkatan !== undefined) dbRow.tanggal_keberangkatan = request.tanggalKeberangkatan
  if (request.cutiPeriodikBerikutnya !== undefined) dbRow.cuti_periodik_berikutnya = request.cutiPeriodikBerikutnya
  if (request.tanggalCutiPeriodikBerikutnya !== undefined)
    dbRow.cuti_periodik_berikutnya = request.tanggalCutiPeriodikBerikutnya
  if (request.catatan !== undefined) dbRow.catatan = request.catatan
  if (request.alasan !== undefined) dbRow.catatan = request.alasan // Map alasan to catatan
  if (request.status !== undefined) dbRow.status = request.status
  if (request.submittedBy !== undefined) dbRow.submitted_by = request.submittedBy
  if (request.bookingCode !== undefined) dbRow.booking_code = request.bookingCode
  if (request.namaPesawat !== undefined) dbRow.nama_pesawat = request.namaPesawat
  if (request.jamKeberangkatan !== undefined) dbRow.jam_keberangkatan = request.jamKeberangkatan
  if (request.lamaOnsite !== undefined) dbRow.lama_onsite = request.lamaOnsite
  if (request.site !== undefined) dbRow.site = request.site
  if (request.departemen !== undefined) dbRow.departemen = request.departemen

  return dbRow
}
