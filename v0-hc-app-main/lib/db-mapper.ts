import type { LeaveRequest } from "./types"

export function mapDbRowToLeaveRequest(row: any): LeaveRequest {
  if (!row) return {} as LeaveRequest

  return {
    id: row.id?.toString() || "",
    userId: row.user_id?.toString() || "",
    userName: row.name || "",
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
    jenisPengajuanCuti: row.jenis_cuti || "",
    tanggalPengajuan: row.tanggal_pengajuan || "",
    tanggalKeberangkatan: row.tanggal_keberangkatan || "",
    tanggalMulai: row.periode_awal || "",
    tanggalSelesai: row.periode_akhir || "",
    jumlahHari: row.jumlah_hari || 0,
    berangkatDari: row.berangkat_dari || "",
    tujuan: row.tujuan || "",
    sisaCutiTahunan: 0,
    tanggalCutiPeriodikBerikutnya: row.cuti_periodik_berikutnya || "",
    catatan: row.catatan || "",
    alasan: "",
    status: row.status || "pending_dic",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    bookingCode: row.booking_code || undefined,
    submittedBy: row.submitted_by || "",
    submittedByName: row.submitted_by_name || "",
    lamaOnsite: row.lama_onsite || undefined,
    namaPesawat: row.nama_pesawat || undefined,
    jamKeberangkatan: row.jam_keberangkatan || undefined,
    bookingCodeIssuedAt: row.booking_code_issued_at || undefined,
  }
}

export function mapDbRowsToLeaveRequests(rows: any[]): LeaveRequest[] {
  return rows.map(mapDbRowToLeaveRequest)
}
