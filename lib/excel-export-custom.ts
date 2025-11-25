import * as XLSX from "xlsx"
import { downloadExcel } from "./download-utils"
import type { LeaveRequest } from "./types"

function formatDateForExcel(date: string | Date): string {
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

const COLUMN_MAPPING: Record<string, { header: string; getValue: (item: any) => string }> = {
  nama: {
    header: "NAMA",
    getValue: () => "", // Blank
  },
  tglInvoice: {
    header: "TGL INVOICE",
    getValue: () => "", // Blank
  },
  nomorInvoice: {
    header: "NOMOR INVOICE",
    getValue: () => "", // Blank
  },
  site: {
    header: "SITE",
    getValue: (item) => item.site || "-",
  },
  nik: {
    header: "NIK KARYAWAN",
    getValue: (item) => item.userNik || "-",
  },
  namaKaryawan: {
    header: "NAMA KARYAWAN",
    getValue: (item) => item.userName || "-",
  },
  jabatan: {
    header: "JABATAN",
    getValue: (item) => item.jabatan || "-",
  },
  hakTiketKaryawan: {
    header: "HAK TIKET KARYAWAN",
    getValue: (item) => item.hakTiket || "-",
  },
  pohTiketKaryawan: {
    header: "POH TIKET KARYAWAN",
    getValue: (item) => item.poh || "-",
  },
  namaPesawat: {
    header: "NAMA PESAWAT",
    getValue: (item) => item.namaPesawat || "-",
  },
  lamaOnsite: {
    header: "LAMA ONSITE",
    getValue: (item) => (item.lamaOnsite ? String(item.lamaOnsite) : "-"),
  },
  notes: {
    header: "NOTES",
    getValue: () => "", // Blank
  },
  notesLainnya: {
    header: "NOTES LAINNYA",
    getValue: (item) => item.catatanAdminSite || "-",
  },
  tglIssuedTiket: {
    header: "TGL ISSUED TIKET",
    getValue: (item) => (item.tanggalIssuedTiket ? formatDateForExcel(item.tanggalIssuedTiket) : "-"),
  },
  tglTiket: {
    header: "TGL TIKET",
    getValue: (item) => (item.tanggalKeberangkatan ? formatDateForExcel(item.tanggalKeberangkatan) : "-"),
  },
  rutePesawat: {
    header: "RUTE PESAWAT",
    getValue: (item) => {
      const dari = item.berangkatDari || "-"
      const tujuan = item.tujuan || "-"
      return `${dari} - ${tujuan}`
    },
  },
  keteranganPotonganGaji: {
    header: "KETERANGAN POTONG GAJI",
    getValue: () => "", // Blank
  },
  nilaiRefundTiket: {
    header: "NILAI REFUND TIKET",
    getValue: () => "", // Blank
  },
  keteranganRefund: {
    header: "KETERANGAN REFUND",
    getValue: () => "", // Blank
  },
  harga: {
    header: "HARGA",
    getValue: () => "", // Blank
  },
  dpp: {
    header: "DPP",
    getValue: () => "", // Blank
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
