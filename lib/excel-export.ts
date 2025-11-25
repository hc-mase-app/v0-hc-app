import * as XLSX from "xlsx"
import { downloadExcel } from "./download-utils"

function getSiteFullName(site: string): string {
  const siteUpper = site?.toUpperCase() || ""

  if (siteUpper === "HSM") return "HALTENG - HSM SITE"
  if (siteUpper === "WBN") return "WEDA - WBN SITE"
  if (siteUpper === "PSN") return "PSN - HALTIM"
  if (siteUpper === "MHM") return "HALTENG - MHM SITE"

  return site || "-"
}

function getHakTiket(jabatan: string): string {
  const jabatanUpper = jabatan?.toUpperCase() || ""

  // Operator, Mekanik, Admin, Driver: 12 MINGGU
  if (
    jabatanUpper.includes("OPERATOR") ||
    jabatanUpper.includes("MEKANIK") ||
    jabatanUpper.includes("ADMIN") ||
    jabatanUpper.includes("DRIVER")
  ) {
    return "12 MINGGU"
  }

  // GL, SPV, Head: varies
  if (jabatanUpper.includes("GL") || jabatanUpper.includes("GENERAL LEADER")) {
    return "10 MINGGU"
  }

  if (jabatanUpper.includes("SPV") || jabatanUpper.includes("SUPERVISOR")) {
    return "10 MINGGU"
  }

  if (jabatanUpper.includes("HEAD")) {
    return "10 MINGGU"
  }

  // PJO: 8 MINGGU
  if (jabatanUpper.includes("PJO") || jabatanUpper.includes("PROJECT OFFICER")) {
    return "8 MINGGU"
  }

  return "-"
}

export async function exportToExcel(data: any[], fileName: string) {
  console.log("[v0] ========== EXCEL EXPORT START ==========")
  console.log("[v0] exportToExcel called with", data.length, "records")
  console.log("[v0] fileName:", fileName)

  if (!data || data.length === 0) {
    console.error("[v0] No data provided for export")
    throw new Error("Tidak ada data untuk di-export")
  }

  try {
    const headers = [
      "NAMA",
      "TGL INVOICE",
      "NOMOR INVOICE",
      "SITE",
      "NIK KARYAWAN",
      "NAMA KARYAWAN",
      "JABATAN",
      "HAK TIKET KARYAWAN",
      "POH TIKET KARYAWAN",
      "NAMA PESAWAT",
      "LAMA ONSITE",
      "NOTES",
      "NOTES LAINNYA",
      "TGL ISSUED TIKET",
      "TGL TIKET",
      "RUTE PESAWAT",
      "KETERANGAN POTONGAN GAJI",
      "NILAI POTONGAN GAJI",
      "NILAI REFUND TIKET",
      "KETERANGAN REFUND",
      "HARGA",
      "DPP",
    ]

    console.log("[v0] ========== HEADERS ==========")
    console.log("[v0] Total headers:", headers.length)
    headers.forEach((header, index) => {
      console.log(`[v0] Header ${index}: "${header}"`)
    })

    const rows = data.map((item, index) => {
      const namaPesawatValue = item.namaPesawat || "-"
      const lamaOnsiteValue = item.lamaOnsite ? String(item.lamaOnsite) : "-"

      const hakTiketValue = getHakTiket(item.jabatan || "")

      const siteFullName = getSiteFullName(item.site || "")

      const row = [
        "", // 0: NAMA (blank)
        "", // 1: TGL INVOICE (blank)
        "", // 2: NOMOR INVOICE (blank)
        siteFullName, // 3: SITE (with full name mapping)
        item.userNik || "-", // 4: NIK KARYAWAN
        item.userName || "-", // 5: NAMA KARYAWAN
        item.jabatan || "-", // 6: JABATAN
        hakTiketValue, // 7: HAK TIKET KARYAWAN (auto-filled based on jabatan including Driver)
        item.poh || "-", // 8: POH TIKET KARYAWAN
        namaPesawatValue, // 9: NAMA PESAWAT
        lamaOnsiteValue, // 10: LAMA ONSITE
        "", // 11: NOTES (blank)
        item.catatan || "-", // 12: NOTES LAINNYA (catatan dari Admin Site saat pengajuan)
        item.tanggalIssueTiketBerangkat ? formatDateForExcel(item.tanggalIssueTiketBerangkat) : "-", // 13: TGL ISSUED TIKET (tanggal HR Ticketing issued tiket)
        item.tanggalKeberangkatan ? formatDateForExcel(item.tanggalKeberangkatan) : "-", // 14: TGL TIKET
        item.berangkatDari && item.tujuan ? `${item.berangkatDari} - ${item.tujuan}` : "-", // 15: RUTE PESAWAT
        "", // 16: KETERANGAN POTONGAN GAJI (blank)
        "", // 17: NILAI POTONGAN GAJI (blank)
        "", // 18: NILAI REFUND TIKET (blank)
        "", // 19: KETERANGAN REFUND (blank)
        "", // 20: HARGA (blank)
        "", // 21: DPP (blank)
      ]

      if (index === 0) {
        console.log("[v0] ========== FIRST DATA ROW ==========")
        console.log(`[v0] Row ${index + 1} - ID: ${item.id}, User: ${item.userName}`)
        console.log(`[v0] Total columns in row: ${row.length}`)
        row.forEach((value, colIndex) => {
          console.log(`[v0] Column ${colIndex} (${headers[colIndex]}): "${value}"`)
        })
      }

      return row
    })

    console.log("[v0] ========== ROWS SUMMARY ==========")
    console.log("[v0] Total rows created:", rows.length)

    console.log("[v0] ========== CREATING WORKSHEET ==========")
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    console.log("[v0] Worksheet created successfully")

    // Verify worksheet structure
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
    console.log("[v0] Worksheet range:", worksheet["!ref"])
    console.log("[v0] Worksheet columns:", range.e.c + 1)
    console.log("[v0] Worksheet rows:", range.e.r + 1)

    worksheet["!cols"] = [
      { wch: 20 }, // NAMA
      { wch: 15 }, // TGL INVOICE
      { wch: 20 }, // NOMOR INVOICE
      { wch: 25 }, // SITE (wider for full names)
      { wch: 15 }, // NIK KARYAWAN
      { wch: 25 }, // NAMA KARYAWAN
      { wch: 20 }, // JABATAN
      { wch: 20 }, // HAK TIKET KARYAWAN
      { wch: 20 }, // POH TIKET KARYAWAN
      { wch: 20 }, // NAMA PESAWAT
      { wch: 15 }, // LAMA ONSITE
      { wch: 30 }, // NOTES
      { wch: 35 }, // NOTES LAINNYA
      { wch: 20 }, // TGL ISSUED TIKET
      { wch: 20 }, // TGL TIKET
      { wch: 30 }, // RUTE PESAWAT
      { wch: 25 }, // KETERANGAN POTONGAN GAJI
      { wch: 20 }, // NILAI POTONGAN GAJI
      { wch: 20 }, // NILAI REFUND TIKET
      { wch: 25 }, // KETERANGAN REFUND
      { wch: 15 }, // HARGA
      { wch: 15 }, // DPP
    ]
    console.log("[v0] Column widths set for", worksheet["!cols"].length, "columns")

    console.log("[v0] ========== CREATING WORKBOOK ==========")
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Requests")
    console.log("[v0] Workbook created with sheet: Leave Requests")

    console.log("[v0] ========== WRITING EXCEL FILE ==========")
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    })
    console.log("[v0] Excel file written successfully")
    console.log("[v0] File size:", excelBuffer.byteLength, "bytes")

    if (!excelBuffer || excelBuffer.byteLength === 0) {
      throw new Error("Failed to generate Excel file - buffer is empty")
    }

    console.log("[v0] ========== TRIGGERING DOWNLOAD ==========")
    await downloadExcel(excelBuffer, `${fileName}.xlsx`)

    console.log("[v0] ========== EXCEL EXPORT COMPLETE ==========")
    console.log("[v0] File downloaded:", `${fileName}.xlsx`)
    console.log("[v0] VERIFICATION:")
    console.log("[v0] - Total columns in Excel: 22")
    console.log("[v0] ==========================================")
  } catch (error) {
    console.error("[v0] ========== EXCEL EXPORT ERROR ==========")
    console.error("[v0] Error in exportToExcel:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] ==========================================")
    throw error
  }
}

function formatDateForExcel(date: string | Date): string {
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      console.error("[v0] Invalid date:", date)
      return "-"
    }

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
    console.error("[v0] Error formatting date:", date, error)
    return "-"
  }
}
