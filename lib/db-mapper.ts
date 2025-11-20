import type { LeaveRequest } from "./types"

export function mapDbRowToLeaveRequest(row: any): LeaveRequest {
  if (!row) return {} as LeaveRequest

  return {
    id: row.id?.toString() || "",
    userId: row.user_id?.toString() || row.nik?.toString() || "",
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
    jenisPengajuanCuti: row.jenis_cuti || row.jenis_pengajuan_cuti || "",
    jenisCuti: row.jenis_cuti || row.jenis_pengajuan_cuti || "",
    jenisPengajuan: row.jenis_pengajuan || "dengan_tiket",
    tanggalPengajuan: row.tanggal_pengajuan || "",
    tanggalKeberangkatan: row.tanggal_keberangkatan || "",
    tanggalMulai: row.periode_awal || row.tanggal_mulai || "",
    tanggalSelesai: row.periode_akhir || row.tanggal_selesai || "",
    periodeAwal: row.periode_awal || row.tanggal_mulai || "",
    periodeAkhir: row.periode_akhir || row.tanggal_selesai || "",
    jumlahHari: Number(row.jumlah_hari) || 0,
    berangkatDari: row.berangkat_dari || "",
    tujuan: row.tujuan || "",
    lamaOnsite: row.lama_onsite ? Number(row.lama_onsite) : undefined,
    sisaCutiTahunan: 0,
    tanggalCutiPeriodikBerikutnya: row.cuti_periodik_berikutnya || row.tanggal_cuti_periodik_berikutnya || "",
    cutiPeriodikBerikutnya: row.cuti_periodik_berikutnya || row.tanggal_cuti_periodik_berikutnya || "",
    catatan: row.catatan || "",
    alasan: row.catatan || row.alasan || "",
    status: row.status || "pending_dic",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    bookingCode: row.booking_code || undefined,
    namaPesawat: row.nama_pesawat || undefined,
    jamKeberangkatan: row.jam_keberangkatan || undefined,
    bookingCodeIssuedAt: row.booking_code_issued_at || undefined,
    statusTiketBerangkat: row.status_tiket_berangkat || 'belum_issued',
    tanggalIssueTiketBerangkat: row.tanggal_issue_tiket_berangkat || undefined,
    statusTiketBalik: row.status_tiket_balik || 'belum_issued',
    tanggalIssueTiketBalik: row.tanggal_issue_tiket_balik || undefined,
    bookingCodeBalik: row.booking_code_balik || undefined,
    namaPesawatBalik: row.nama_pesawat_balik || undefined,
    jamKeberangkatanBalik: row.jam_keberangkatan_balik || undefined,
    tanggalBerangkatBalik: row.tanggal_berangkat_balik || undefined,
    berangkatDariBalik: row.berangkat_dari_balik || undefined,
    tujuanBalik: row.tujuan_balik || undefined,
    submittedBy: row.submitted_by || "",
    submittedByName: row.submitted_by_name || "",
  }
}

export function mapDbRowsToLeaveRequests(rows: any[]): LeaveRequest[] {
  if (!Array.isArray(rows)) {
    console.warn("[v0] mapDbRowsToLeaveRequests: input is not an array", typeof rows)
    return []
  }
  return rows.map(mapDbRowToLeaveRequest)
}

export function mapLeaveRequestToDbRow(request: Partial<LeaveRequest>): Record<string, any> {
  const dbRow: Record<string, any> = {}

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
  if (request.alasan !== undefined) dbRow.catatan = request.alasan
  if (request.status !== undefined) dbRow.status = request.status
  if (request.submittedBy !== undefined) dbRow.submitted_by = request.submittedBy
  if (request.bookingCode !== undefined) dbRow.booking_code = request.bookingCode
  if (request.namaPesawat !== undefined) dbRow.nama_pesawat = request.namaPesawat
  if (request.jamKeberangkatan !== undefined) dbRow.jam_keberangkatan = request.jamKeberangkatan
  if (request.lamaOnsite !== undefined) dbRow.lama_onsite = request.lamaOnsite
  if (request.site !== undefined) dbRow.site = request.site
  if (request.departemen !== undefined) dbRow.departemen = request.departemen
  if (request.jenisPengajuan !== undefined) dbRow.jenis_pengajuan = request.jenisPengajuan
  if (request.statusTiketBerangkat !== undefined) dbRow.status_tiket_berangkat = request.statusTiketBerangkat
  if (request.tanggalIssueTiketBerangkat !== undefined) dbRow.tanggal_issue_tiket_berangkat = request.tanggalIssueTiketBerangkat
  if (request.statusTiketBalik !== undefined) dbRow.status_tiket_balik = request.statusTiketBalik
  if (request.tanggalIssueTiketBalik !== undefined) dbRow.tanggal_issue_tiket_balik = request.tanggalIssueTiketBalik
  if (request.bookingCodeBalik !== undefined) dbRow.booking_code_balik = request.bookingCodeBalik
  if (request.namaPesawatBalik !== undefined) dbRow.nama_pesawat_balik = request.namaPesawatBalik
  if (request.jamKeberangkatanBalik !== undefined) dbRow.jam_keberangkatan_balik = request.jamKeberangkatanBalik
  if (request.tanggalBerangkatBalik !== undefined) dbRow.tanggal_berangkat_balik = request.tanggalBerangkatBalik
  if (request.berangkatDariBalik !== undefined) dbRow.berangkat_dari_balik = request.berangkatDariBalik
  if (request.tujuanBalik !== undefined) dbRow.tujuan_balik = request.tujuanBalik

  return dbRow
}
