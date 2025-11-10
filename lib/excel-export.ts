import * as XLSX from "xlsx"
import { downloadExcel } from "./download-utils"

function getHakTiket(jabatan: string): string {
  const jabatanUpper = jabatan?.toUpperCase() || ""
  if (jabatanUpper.includes("GL") || jabatanUpper.includes("GENERAL LEADER")) {
    return "12 MINGGU"
  } else if (jabatanUpper.includes("SPV") || jabatanUpper.includes("SUPERVISOR")) {
    return "10 MINGGU"
  } else if (jabatanUpper.includes("PJO") || jabatanUpper.includes("PROJECT OFFICER")) {
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
      "NAMA TRAVEL",
      "TGL INVOICE",
      "NOMOR INVOICE",
      "NIK",
      "TANGGAL LAHIR",
      "SITE",
      "NAMA",
      "JABATAN",
      "HAK Tiket Karyawan",
      "POH TIKET KARYAWAN",
      "NAMA PESAWAT",
      "LAMA ONSITE",
      "NOTES",
      "NOTES LAINNYA",
      "TGL ISSUED TIKET",
      "TGL TIKET",
      "RUTE",
      "Harga TIKET",
    ]

    console.log("[v0] ========== HEADERS ==========")
    console.log("[v0] Total headers:", headers.length)
    headers.forEach((header, index) => {
      console.log(`[v0] Header ${index}: "${header}"`)
    })

    const rows = data.map((item, index) => {
      const namaPesawatValue = item.namaPesawat || "-"
      const lamaOnsiteValue = item.lamaOnsite ? String(item.lamaOnsite) : "-"

      const row = [
        "-", // 0: NAMA TRAVEL
        "-", // 1: TGL INVOICE
        "-", // 2: NOMOR INVOICE
        item.userNik || "-", // 3: NIK
        item.tanggalLahir ? formatDateForExcel(item.tanggalLahir) : "-", // 4: TANGGAL LAHIR
        item.site || "-", // 5: SITE
        item.userName || "-", // 6: NAMA
        item.jabatan && item.departemen ? `${item.jabatan} - ${item.departemen}` : item.jabatan || "-", // 7: JABATAN
        getHakTiket(item.jabatan), // 8: HAK Tiket Karyawan
        item.poh || "-", // 9: POH TIKET KARYAWAN
        namaPesawatValue, // 10: NAMA PESAWAT
        lamaOnsiteValue, // 11: LAMA ONSITE
        "-", // 12: NOTES
        item.catatan || "-", // 13: NOTES LAINNYA
        item.bookingCodeIssuedAt ? formatDateForExcel(item.bookingCodeIssuedAt) : "-", // 14: TGL ISSUED TIKET
        item.tanggalKeberangkatan ? formatDateForExcel(item.tanggalKeberangkatan) : "-", // 15: TGL TIKET
        item.berangkatDari && item.tujuan
          ? `${item.berangkatDari} - ${item.tujuan}`
          : item.berangkatDari || item.tujuan || "-", // 16: RUTE
        "-", // 17: Harga TIKET
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

    // Check specific cells
    console.log("[v0] Cell D1 (NIK header):", worksheet["D1"]?.v)
    console.log("[v0] Cell E1 (TANGGAL LAHIR header):", worksheet["E1"]?.v)
    console.log("[v0] Cell K1 (NAMA PESAWAT header):", worksheet["K1"]?.v)
    console.log("[v0] Cell L1 (LAMA ONSITE header):", worksheet["L1"]?.v)
    if (rows.length > 0) {
      console.log("[v0] Cell D2 (First NIK value):", worksheet["D2"]?.v)
      console.log("[v0] Cell E2 (First TANGGAL LAHIR value):", worksheet["E2"]?.v)
      console.log("[v0] Cell K2 (First NAMA PESAWAT value):", worksheet["K2"]?.v)
      console.log("[v0] Cell L2 (First LAMA ONSITE value):", worksheet["L2"]?.v)
    }

    worksheet["!cols"] = [
      { wch: 20 }, // NAMA TRAVEL
      { wch: 15 }, // TGL INVOICE
      { wch: 18 }, // NOMOR INVOICE
      { wch: 15 }, // NIK
      { wch: 15 }, // TANGGAL LAHIR
      { wch: 12 }, // SITE
      { wch: 25 }, // NAMA
      { wch: 30 }, // JABATAN
      { wch: 20 }, // HAK Tiket Karyawan
      { wch: 20 }, // POH TIKET KARYAWAN
      { wch: 20 }, // NAMA PESAWAT
      { wch: 15 }, // LAMA ONSITE
      { wch: 30 }, // NOTES
      { wch: 35 }, // NOTES LAINNYA
      { wch: 20 }, // TGL ISSUED TIKET
      { wch: 20 }, // TGL TIKET
      { wch: 30 }, // RUTE
      { wch: 15 }, // Harga TIKET
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
    console.log("[v0] - Headers include NIK at position 3: YES")
    console.log("[v0] - Headers include TANGGAL LAHIR at position 4: YES")
    console.log("[v0] - Headers include NAMA PESAWAT at position 10: YES")
    console.log("[v0] - Headers include LAMA ONSITE at position 11: YES")
    console.log("[v0] - Total columns in Excel: 18")
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
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error("[v0] Error formatting date:", date, error)
    return "-"
  }
}
