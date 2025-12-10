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

  if (
    jabatanUpper.includes("OPERATOR") ||
    jabatanUpper.includes("MEKANIK") ||
    jabatanUpper.includes("ADMIN") ||
    jabatanUpper.includes("DRIVER")
  ) {
    return "12 MINGGU"
  }

  if (jabatanUpper.includes("GL") || jabatanUpper.includes("GENERAL LEADER")) {
    return "10 MINGGU"
  }

  if (jabatanUpper.includes("SPV") || jabatanUpper.includes("SUPERVISOR")) {
    return "10 MINGGU"
  }

  if (jabatanUpper.includes("HEAD")) {
    return "10 MINGGU"
  }

  if (jabatanUpper.includes("PJO") || jabatanUpper.includes("PROJECT OFFICER")) {
    return "8 MINGGU"
  }

  return "-"
}

function calculateLamaCuti(tanggalKeberangkatan: string | Date, tanggalBerangkatBalik: string | Date): number {
  try {
    const departDate = new Date(tanggalKeberangkatan)
    const returnDate = new Date(tanggalBerangkatBalik)

    if (isNaN(departDate.getTime()) || isNaN(returnDate.getTime())) {
      return 0
    }

    const diffTime = Math.abs(returnDate.getTime() - departDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return 0
  }
}

interface ExcelRowWithTimestamp {
  row: any[]
  timestamp: Date
}

export async function exportToExcel(data: any[], fileName: string) {
  if (!data || data.length === 0) {
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
      "KETERANGAN",
    ]

    const berangkatRows: ExcelRowWithTimestamp[] = []
    const balikRows: ExcelRowWithTimestamp[] = []

    data.forEach((item) => {
      const hakTiketValue = getHakTiket(item.jabatan || "")
      const siteFullName = getSiteFullName(item.site || "")

      // ROW BERANGKAT CUTI - use tanggalIssueTiketBerangkat or createdAt as timestamp
      const timestampBerangkat = item.tanggalIssueTiketBerangkat
        ? new Date(item.tanggalIssueTiketBerangkat)
        : item.createdAt
          ? new Date(item.createdAt)
          : new Date(0)

      const rowBerangkat = [
        "", // 0: NAMA (blank)
        "", // 1: TGL INVOICE (blank)
        "", // 2: NOMOR INVOICE (blank)
        siteFullName, // 3: SITE
        item.userNik || "-", // 4: NIK KARYAWAN
        item.userName || "-", // 5: NAMA KARYAWAN
        item.jabatan || "-", // 6: JABATAN
        hakTiketValue, // 7: HAK TIKET KARYAWAN
        item.poh || "-", // 8: POH TIKET KARYAWAN
        item.namaPesawat || "-", // 9: NAMA PESAWAT (tiket berangkat)
        item.lamaOnsite ? String(item.lamaOnsite) : "-", // 10: LAMA ONSITE
        "", // 11: NOTES (blank)
        item.catatan || "-", // 12: NOTES LAINNYA
        item.tanggalIssueTiketBerangkat ? formatDateForExcel(item.tanggalIssueTiketBerangkat) : "-", // 13: TGL ISSUED TIKET
        item.tanggalKeberangkatan ? formatDateForExcel(item.tanggalKeberangkatan) : "-", // 14: TGL TIKET
        item.berangkatDari && item.tujuan ? `${item.berangkatDari} - ${item.tujuan}` : "-", // 15: RUTE PESAWAT
        "", // 16: KETERANGAN POTONGAN GAJI (blank)
        "", // 17: NILAI POTONGAN GAJI (blank)
        "", // 18: NILAI REFUND TIKET (blank)
        "", // 19: KETERANGAN REFUND (blank)
        "", // 20: HARGA (blank)
        "", // 21: DPP (blank)
        "BERANGKAT CUTI", // 22: KETERANGAN
      ]

      berangkatRows.push({
        row: rowBerangkat,
        timestamp: timestampBerangkat,
      })

      // Check if return ticket data exists
      const hasReturnTicket =
        item.statusTiketBalik === "issued" ||
        item.tanggalBerangkatBalik ||
        item.bookingCodeBalik ||
        item.namaPesawatBalik

      if (hasReturnTicket) {
        // ROW BALIK CUTI - use tanggalIssueTiketBalik as timestamp
        const timestampBalik = item.tanggalIssueTiketBalik
          ? new Date(item.tanggalIssueTiketBalik)
          : item.updatedAt
            ? new Date(item.updatedAt)
            : new Date()

        // Calculate lama cuti = tanggalBerangkatBalik - tanggalKeberangkatan
        const lamaCuti =
          item.tanggalKeberangkatan && item.tanggalBerangkatBalik
            ? calculateLamaCuti(item.tanggalKeberangkatan, item.tanggalBerangkatBalik)
            : 0

        // Determine return route: use berangkatDariBalik/tujuanBalik if available, otherwise reverse original route
        const ruteBalik =
          item.berangkatDariBalik && item.tujuanBalik
            ? `${item.berangkatDariBalik} - ${item.tujuanBalik}`
            : item.tujuan && item.berangkatDari
              ? `${item.tujuan} - ${item.berangkatDari}`
              : "-"

        const rowBalik = [
          "", // 0: NAMA (blank)
          "", // 1: TGL INVOICE (blank)
          "", // 2: NOMOR INVOICE (blank)
          siteFullName, // 3: SITE
          item.userNik || "-", // 4: NIK KARYAWAN
          item.userName || "-", // 5: NAMA KARYAWAN
          item.jabatan || "-", // 6: JABATAN
          hakTiketValue, // 7: HAK TIKET KARYAWAN
          item.poh || "-", // 8: POH TIKET KARYAWAN
          item.namaPesawatBalik || "-", // 9: NAMA PESAWAT (tiket balik)
          lamaCuti > 0 ? String(lamaCuti) : "-", // 10: LAMA ONSITE (berisi LAMA CUTI untuk row balik)
          "", // 11: NOTES (blank)
          item.catatan || "-", // 12: NOTES LAINNYA
          item.tanggalIssueTiketBalik ? formatDateForExcel(item.tanggalIssueTiketBalik) : "-", // 13: TGL ISSUED TIKET
          item.tanggalBerangkatBalik ? formatDateForExcel(item.tanggalBerangkatBalik) : "-", // 14: TGL TIKET
          ruteBalik, // 15: RUTE PESAWAT (reversed route)
          "", // 16: KETERANGAN POTONGAN GAJI (blank)
          "", // 17: NILAI POTONGAN GAJI (blank)
          "", // 18: NILAI REFUND TIKET (blank)
          "", // 19: KETERANGAN REFUND (blank)
          "", // 20: HARGA (blank)
          "", // 21: DPP (blank)
          "BALIK CUTI", // 22: KETERANGAN
        ]

        balikRows.push({
          row: rowBalik,
          timestamp: timestampBalik,
        })
      }
    })

    berangkatRows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    balikRows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const allRows = [...berangkatRows.map((item) => item.row), ...balikRows.map((item) => item.row)]

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...allRows])

    worksheet["!cols"] = [
      { wch: 20 }, // NAMA
      { wch: 15 }, // TGL INVOICE
      { wch: 20 }, // NOMOR INVOICE
      { wch: 25 }, // SITE
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
      { wch: 20 }, // KETERANGAN (new column)
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Requests")

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    })

    if (!excelBuffer || excelBuffer.byteLength === 0) {
      throw new Error("Failed to generate Excel file - buffer is empty")
    }

    await downloadExcel(excelBuffer, `${fileName}.xlsx`)
  } catch (error) {
    console.error("Error in exportToExcel:", error)
    throw error
  }
}

function formatDateForExcel(date: string | Date): string {
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
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
  } catch {
    return "-"
  }
}
