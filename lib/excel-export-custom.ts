import * as XLSX from "xlsx"
import { downloadExcel } from "./download-utils"
import type { LeaveRequest } from "./types"

function formatDateForExcel(date: string | Date | null | undefined): string {
  if (!date) return "-"
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "-"

    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ]

    const day = d.getDate()
    const month = months[d.getMonth()]
    const year = d.getFullYear()

    return `${day} ${month} ${year}`
  } catch (error) {
    return "-"
  }
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending_dic: "Menunggu DIC",
    pending_pjo: "Menunggu PJO",
    pending_manager_ho: "Menunggu Manager HO",
    pending_hr_ho: "Menunggu HR HO",
    di_proses: "Diproses",
    tiket_issued: "Tiket Issued",
    ditolak_dic: "Ditolak DIC",
    ditolak_pjo: "Ditolak PJO",
    ditolak_manager_ho: "Ditolak Manager HO",
    ditolak_hr_ho: "Ditolak HR HO",
  }
  return statusMap[status] || status
}

const COLUMN_MAPPING: Record<string, { header: string; getValue: (item: any) => string }> = {
  // User Data
  nik: {
    header: "NIK",
    getValue: (item) => item.userNik || "-",
  },
  namaKaryawan: {
    header: "NAMA KARYAWAN",
    getValue: (item) => item.userName || "-",
  },
  email: {
    header: "EMAIL",
    getValue: (item) => item.email || "-",
  },
  jabatan: {
    header: "JABATAN",
    getValue: (item) => item.jabatan || "-",
  },
  departemen: {
    header: "DEPARTEMEN",
    getValue: (item) => item.departemen || "-",
  },
  site: {
    header: "SITE",
    getValue: (item) => item.site || "-",
  },
  role: {
    header: "ROLE",
    getValue: (item) => item.role || "-",
  },
  hakTiket: {
    header: "HAK TIKET",
    getValue: (item) => item.hakTiket || "-",
  },
  poh: {
    header: "POH",
    getValue: (item) => item.poh || "-",
  },
  noKtp: {
    header: "NO KTP",
    getValue: (item) => item.noKtp || "-",
  },
  noTelp: {
    header: "NO TELP",
    getValue: (item) => item.noTelp || "-",
  },

  // Leave Request Data
  jenisCuti: {
    header: "JENIS CUTI",
    getValue: (item) => item.jenisCuti || "-",
  },
  tanggalPengajuan: {
    header: "TANGGAL PENGAJUAN",
    getValue: (item) => formatDateForExcel(item.tanggalPengajuan),
  },
  periodeAwal: {
    header: "PERIODE AWAL",
    getValue: (item) => formatDateForExcel(item.periodeAwal),
  },
  periodeAkhir: {
    header: "PERIODE AKHIR",
    getValue: (item) => formatDateForExcel(item.periodeAkhir),
  },
  jumlahHari: {
    header: "JUMLAH HARI",
    getValue: (item) => item.jumlahHari?.toString() || "-",
  },
  tanggalKeberangkatan: {
    header: "TANGGAL KEBERANGKATAN",
    getValue: (item) => formatDateForExcel(item.tanggalKeberangkatan),
  },
  berangkatDari: {
    header: "BERANGKAT DARI",
    getValue: (item) => item.berangkatDari || "-",
  },
  tujuan: {
    header: "TUJUAN",
    getValue: (item) => item.tujuan || "-",
  },
  catatan: {
    header: "CATATAN",
    getValue: (item) => item.catatan || "-",
  },
  cutiPeriodikBerikutnya: {
    header: "CUTI PERIODIK BERIKUTNYA",
    getValue: (item) => formatDateForExcel(item.cutiPeriodikBerikutnya),
  },

  // Workflow Status
  status: {
    header: "STATUS",
    getValue: (item) => formatStatus(item.status),
  },

  // Ticketing
  bookingCode: {
    header: "KODE BOOKING",
    getValue: (item) => item.bookingCode || "-",
  },
  namaPesawat: {
    header: "NAMA PESAWAT",
    getValue: (item) => item.namaPesawat || "-",
  },
  rutePesawat: {
    header: "RUTE PESAWAT",
    getValue: (item) => {
      const dari = item.berangkatDari || "-"
      const tujuan = item.tujuan || "-"
      return `${dari} - ${tujuan}`
    },
  },
  tanggalIssuedTiket: {
    header: "TANGGAL ISSUED TIKET",
    getValue: (item) => formatDateForExcel(item.tanggalIssuedTiket),
  },

  // Ticket Departure
  tiketBerangkatCode: {
    header: "TIKET BERANGKAT - KODE",
    getValue: (item) => item.tiketBerangkatCode || "-",
  },
  tiketBerangkatMaskapai: {
    header: "TIKET BERANGKAT - MASKAPAI",
    getValue: (item) => item.tiketBerangkatMaskapai || "-",
  },
  tiketBerangkatJam: {
    header: "TIKET BERANGKAT - JAM",
    getValue: (item) => item.tiketBerangkatJam || "-",
  },
  tiketBerangkatRute: {
    header: "TIKET BERANGKAT - RUTE",
    getValue: (item) => item.tiketBerangkatRute || "-",
  },

  // Ticket Return
  tiketBalikCode: {
    header: "TIKET BALIK - KODE",
    getValue: (item) => item.tiketBalikCode || "-",
  },
  tiketBalikMaskapai: {
    header: "TIKET BALIK - MASKAPAI",
    getValue: (item) => item.tiketBalikMaskapai || "-",
  },
  tiketBalikJam: {
    header: "TIKET BALIK - JAM",
    getValue: (item) => item.tiketBalikJam || "-",
  },
  tiketBalikRute: {
    header: "TIKET BALIK - RUTE",
    getValue: (item) => item.tiketBalikRute || "-",
  },

  // Metadata
  createdAt: {
    header: "DIBUAT PADA",
    getValue: (item) => formatDateForExcel(item.createdAt),
  },
  updatedAt: {
    header: "DIUPDATE PADA",
    getValue: (item) => formatDateForExcel(item.updatedAt),
  },
}

export async function exportToExcelCustom(data: LeaveRequest[], fileName: string, selectedColumns: string[]) {
  console.log("[v0] ========== CUSTOM EXCEL EXPORT START ==========")
  console.log("[v0] Data count:", data.length)
  console.log("[v0] Selected columns:", selectedColumns)

  if (!data || data.length === 0) {
    throw new Error("Tidak ada data untuk di-export")
  }

  if (!selectedColumns || selectedColumns.length === 0) {
    throw new Error("Pilih minimal satu kolom untuk di-export")
  }

  try {
    // Build headers based on selected columns
    const headers = selectedColumns.map((colId) => COLUMN_MAPPING[colId]?.header || colId.toUpperCase())

    // Build rows
    const rows = data.map((item) => {
      return selectedColumns.map((colId) => {
        const mapping = COLUMN_MAPPING[colId]
        return mapping ? mapping.getValue(item) : "-"
      })
    })

    console.log("[v0] Headers:", headers)
    console.log("[v0] Rows count:", rows.length)

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // Set column widths
    worksheet["!cols"] = headers.map(() => ({ wch: 20 }))

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Requests")

    // Write to buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    })

    if (!excelBuffer || excelBuffer.byteLength === 0) {
      throw new Error("Failed to generate Excel file")
    }

    // Download
    await downloadExcel(excelBuffer, `${fileName}.xlsx`)

    console.log("[v0] ========== CUSTOM EXCEL EXPORT COMPLETE ==========")
  } catch (error) {
    console.error("[v0] ========== CUSTOM EXCEL EXPORT ERROR ==========")
    console.error("[v0] Error:", error)
    throw error
  }
}
