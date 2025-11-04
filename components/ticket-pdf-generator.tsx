"use client"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import type { LeaveRequest } from "@/lib/types"

function convertOklchToHex(oklchValue: string): string {
  const hex: { [key: string]: string } = {
    "oklch(0.99 0 0)": "#fefef9",
    "oklch(0.15 0 0)": "#262626",
    "oklch(1 0 0)": "#ffffff",
    "oklch(0.45 0.15 250)": "#2563eb",
    "oklch(0.96 0 0)": "#f5f5f5",
    "oklch(0.55 0.22 25)": "#dc2626",
  }
  return hex[oklchValue] || "#000000"
}

export async function downloadTicketPDF(request: LeaveRequest) {
  try {
    console.log("[v0] Starting PDF generation for booking code:", request.bookingCode)

    // Create temporary container with NO stylesheet inheritance
    const container = document.createElement("div")
    container.style.position = "fixed"
    container.style.left = "-9999px"
    container.style.top = "-9999px"
    container.style.width = "448px"
    container.style.margin = "0"
    container.style.padding = "0"

    const formatDate = (date: string | null | undefined) => {
      if (!date) return "-"
      return new Date(date).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }

    const formatDateOfBirth = (date: string | null | undefined) => {
      if (!date) return "-"
      return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }

    const berangkat = (request.berangkatDari || "-").toUpperCase()
    const tujuan = (request.tujuan || "-").toUpperCase()

    container.innerHTML = `
      <div style="width: 448px; margin: 0; padding: 0; background: #ffffff; min-height: 900px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; display: flex; flex-direction: column; box-sizing: border-box; color: #000000; font-size: 16px;">
        <div style="background: #2563eb; color: #ffffff; padding: 16px; position: relative; flex-shrink: 0; display: flex; align-items: flex-start; gap: 12px;">
          <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
            <div style="font-size: 12px; opacity: 0.9; margin: 0; word-break: break-word;">PT 3S GSM Indonesia</div>
            <div style="font-size: 24px; font-weight: bold; margin-top: 8px; margin-bottom: 0; line-height: 1.2; word-break: break-word;">TIKET PERJALANAN</div>
            <div style="font-size: 13px; margin-top: 4px; margin-bottom: 0;">KARYAWAN</div>
          </div>
          <div style="background: #facc15; color: #000000; padding: 12px; border-radius: 4px; width: 140px; box-sizing: border-box; flex-shrink: 0; text-align: center;">
            <div style="font-size: 11px; font-weight: bold; margin: 0;">KODE BOOKING</div>
            <div style="font-size: 28px; font-weight: bold; margin-top: 4px; margin-bottom: 0; word-break: break-all;">${request.bookingCode || "-----"}</div>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 16px; border-bottom: 2px solid #e5e7eb; flex-shrink: 0;">
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 12px; margin-top: 0;">DETAIL PENUMPANG</div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin: 0;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 0; gap: 8px;">
              <span style="font-weight: bold; margin: 0; flex-shrink: 0;">Nama:</span>
              <span style="margin: 0; text-align: right; flex: 1; word-break: break-word;">${request.userName || "-"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 0; gap: 8px;">
              <span style="font-weight: bold; margin: 0; flex-shrink: 0;">Nomor KTP:</span>
              <span style="margin: 0; text-align: right; flex: 1; word-break: break-word;">${request.noKtp || "-"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 0; gap: 8px;">
              <span style="font-weight: bold; margin: 0; flex-shrink: 0;">Tanggal Lahir:</span>
              <span style="margin: 0; text-align: right; flex: 1; word-break: break-word;">${formatDateOfBirth(request.tanggalLahir)}</span>
            </div>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 16px; flex: 1; display: flex; flex-direction: column;">
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 14px; margin-top: 0;">DETAIL PERJALANAN</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: nowrap; margin-top: 0; gap: 8px;">
            <div style="font-size: 18px; font-weight: bold; color: #2563eb; flex: 1; text-align: center; word-break: break-word; margin: 0; min-width: 0;">${berangkat}</div>
            <div style="font-size: 32px; color: #9ca3af; margin: 0; flex-shrink: 0; line-height: 1; text-align: center;">→</div>
            <div style="font-size: 18px; font-weight: bold; color: #2563eb; flex: 1; text-align: center; word-break: break-word; margin: 0; min-width: 0;">${tujuan}</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; margin-top: 0;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 0; gap: 8px;">
              <span style="font-weight: bold; margin: 0; flex-shrink: 0;">Maskapai:</span>
              <span style="margin: 0; text-align: right; flex: 1; word-break: break-word;">${request.namaPesawat || "-"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 0; gap: 8px;">
              <span style="font-weight: bold; margin: 0; flex-shrink: 0;">Tanggal Keberangkatan:</span>
              <span style="margin: 0; text-align: right; flex: 1; word-break: break-word;">${formatDate(request.tanggalKeberangkatan)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 0; gap: 8px;">
              <span style="font-weight: bold; margin: 0; flex-shrink: 0;">Jam Keberangkatan:</span>
              <span style="margin: 0; text-align: right; flex: 1; word-break: break-word;">${request.jamKeberangkatan || "-"}</span>
            </div>
          </div>
          <div style="background: #fef3c7; border: 2px solid #fcd34d; padding: 12px; margin-top: auto;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px; margin-top: 0;">INFORMASI PENTING - CHECK IN</div>
            <ul style="font-size: 12px; margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 8px; list-style: disc; line-height: 1.5;">
              <li style="margin: 0; word-break: break-word;">Hadir di bandara MAKSIMAL 1 JAM sebelum keberangkatan</li>
              <li style="margin: 0; word-break: break-word;">Disarankan untuk melakukan online check-in minimal 12 jam sebelum keberangkatan</li>
              <li style="margin: 0; word-break: break-word;">Siapkan dokumen identitas (KTP) saat check-in</li>
            </ul>
          </div>
        </div>
        <div style="border-top: 1px solid #d1d5db; padding: 10px; text-align: center; flex-shrink: 0; margin-top: 0;">
          <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px; margin-top: 0; word-break: break-word;">Tunjukkan tiket ini saat check-in di bandara</div>
          <div style="font-size: 11px; color: #6b7280; margin: 0;">${new Date().toLocaleDateString("id-ID")}</div>
        </div>
      </div>
    `
    document.body.appendChild(container)

    console.log("[v0] Container created, calling html2canvas")

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      allowTaint: true,
      useCORS: false,
      logging: false,
      ignoreElements: (element) => {
        return element.tagName === "STYLE" || element.tagName === "LINK"
      },
      windowHeight: 1200,
      windowWidth: 448,
    })

    document.body.removeChild(container)

    console.log("[v0] Canvas generated, converting to PDF")

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const imgHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight)
    pdf.save(`Tiket-Perjalanan-${request.bookingCode || request.userNik}-${new Date().toISOString().split("T")[0]}.pdf`)

    console.log("[v0] PDF saved successfully")
  } catch (error) {
    console.error("[v0] PDF generation error:", error instanceof Error ? error.message : String(error))
    alert("Gagal mengunduh tiket. Silakan coba lagi.")
  }
}

export function TicketPDFDownloadButton({ request }: { request: LeaveRequest }) {
  const handleDownload = async () => {
    await downloadTicketPDF(request)
  }

  return (
    <button
      onClick={handleDownload}
      className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
    >
      📥 Download Tiket PDF
    </button>
  )
}
