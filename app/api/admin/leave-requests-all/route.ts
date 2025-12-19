import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET(request: NextRequest) {
  try {
    const result = await sql`
      SELECT 
        lr.*,
        u.name as user_name,
        u.nik as user_nik,
        u.site,
        u.jabatan,
        u.departemen,
        u.poh,
        u.status_karyawan,
        u.no_ktp,
        u.no_telp,
        u.email,
        u.tanggal_lahir,
        u.jenis_kelamin
      FROM leave_requests lr
      LEFT JOIN users u ON lr.nik = u.nik
      ORDER BY lr.created_at DESC
    `

    const formatted = result.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userNik: row.user_nik || row.nik,
      userName: row.user_name || row.nama,
      site: row.site,
      jabatan: row.jabatan,
      departemen: row.departemen,
      poh: row.poh,
      statusKaryawan: row.status_karyawan,
      noKtp: row.no_ktp,
      noTelp: row.no_telp,
      email: row.email,
      tanggalLahir: row.tanggal_lahir,
      jenisKelamin: row.jenis_kelamin,
      jenisPengajuanCuti: row.jenis_pengajuan_cuti || row.jenis_cuti,
      jenisPengajuan: row.jenis_pengajuan,
      tanggalPengajuan: row.tanggal_pengajuan,
      tanggalKeberangkatan: row.tanggal_keberangkatan,
      tanggalMulai: row.tanggal_mulai || row.periode_awal,
      tanggalSelesai: row.tanggal_selesai || row.periode_akhir,
      jumlahHari: row.jumlah_hari,
      berangkatDari: row.berangkat_dari,
      tujuan: row.tujuan,
      sisaCutiTahunan: row.sisa_cuti_tahunan,
      catatan: row.catatan,
      alasan: row.alasan,
      status: row.status,
      bookingCode: row.booking_code,
      submittedBy: row.submitted_by,
      submittedByName: row.submitted_by_name,
      lamaOnsite: row.lama_onsite,
      namaPesawat: row.nama_pesawat,
      jamKeberangkatan: row.jam_keberangkatan,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("[API Admin] Error fetching all leave requests:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
