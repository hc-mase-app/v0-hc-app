import * as XLSX from "xlsx"
import { downloadExcel } from "./download-utils"
import type { LeaveRequest } from "./types"

function formatDateForExcel(date: string | Date): string {
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "-"
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch (error) {
    return "-"
  }
}

const COLUMN_MAPPING: Record<string, { header: string; getValue: (item: any) => string }> = {
  nik: {
    header: "NIK",
    getValue: (item) => item.userNik || "-",
  },
  nama: {
    header: "NAMA",
    getValue: (item) => item.userName || "-",
  },
  tanggalLahir: {
    header: "TANGGAL LAHIR",
    getValue: (item) => (item.tanggalLahir ? formatDateForExcel(item.tanggalLahir) : "-"),
  },
  jenisKelamin: {
    header: "JENIS KELAMIN",
    getValue: (item) => item.jenisKelamin || "-",
  },
  nomorKTP: {
    header: "NOMOR KTP",
    getValue: (item) => item.noKtp || "-",
  },
  site: {
    header: "SITE",
    getValue: (item) => item.site || "-",
  },
  jabatan: {
    header: "JABATAN",
    getValue: (item) => item.jabatan || "-",
  },
  departemen: {
    header: "DEPARTEMEN",
    getValue: (item) => item.departemen || "-",
  },
  jenisCuti: {
    header: "JENIS CUTI",
    getValue: (item) => item.jenisPengajuanCuti || "-",
  },
  tanggalMulai: {
    header: "TANGGAL MULAI CUTI",
    getValue: (item) => (item.tanggalMulai ? formatDateForExcel(item.tanggalMulai) : "-"),
  },
  tanggalSelesai: {
    header: "TANGGAL SELESAI CUTI",
    getValue: (item) => (item.tanggalSelesai ? formatDateForExcel(item.tanggalSelesai) : "-"),
  },
  lamaOnsite: {
    header: "LAMA ONSITE",
    getValue: (item) => (item.lamaOnsite ? String(item.lamaOnsite) : "-"),
  },
  bookingCode: {
    header: "KODE BOOKING BERANGKAT",
    getValue: (item) => item.bookingCode || "-",
  },
  namaPesawat: {
    header: "NAMA PESAWAT BERANGKAT",
    getValue: (item) => item.namaPesawat || "-",
  },
  tanggalKeberangkatan: {
    header: "TANGGAL KEBERANGKATAN",
    getValue: (item) => (item.tanggalKeberangkatan ? formatDateForExcel(item.tanggalKeberangkatan) : "-"),
  },
  jamKeberangkatan: {
    header: "JAM KEBERANGKATAN",
    getValue: (item) => item.jamKeberangkatan || "-",
  },
  berangkatDari: {
    header: "BERANGKAT DARI",
    getValue: (item) => item.berangkatDari || "-",
  },
  tujuan: {
    header: "TUJUAN",
    getValue: (item) => item.tujuan || "-",
  },
  bookingCodeBalik: {
    header: "KODE BOOKING BALIK",
    getValue: (item) => item.bookingCodeBalik || "-",
  },
  namaPesawatBalik: {
    header: "NAMA PESAWAT BALIK",
    getValue: (item) => item.namaPesawatBalik || "-",
  },
  tanggalBerangkatBalik: {
    header: "TANGGAL KEBERANGKATAN BALIK",
    getValue: (item) => (item.tanggalBerangkatBalik ? formatDateForExcel(item.tanggalBerangkatBalik) : "-"),
  },
  jamKeberangkatanBalik: {
    header: "JAM KEBERANGKATAN BALIK",
    getValue: (item) => item.jamKeberangkatanBalik || "-",
  },
  berangkatDariBalik: {
    header: "BERANGKAT DARI (BALIK)",
    getValue: (item) => item.berangkatDariBalik || "-",
  },
  tujuanBalik: {
    header: "TUJUAN (BALIK)",
    getValue: (item) => item.tujuanBalik || "-",
  },
  catatan: {
    header: "CATATAN",
    getValue: (item) => item.catatan || "-",
  },
  status: {
    header: "STATUS",
    getValue: (item) => item.status || "-",
  },
  statusTiketBerangkat: {
    header: "STATUS TIKET BERANGKAT",
    getValue: (item) => item.statusTiketBerangkat || "-",
  },
  statusTiketBalik: {
    header: "STATUS TIKET BALIK",
    getValue: (item) => item.statusTiketBalik || "-",
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
