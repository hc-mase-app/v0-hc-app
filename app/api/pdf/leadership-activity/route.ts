import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.formData?.nama || !data.formData?.nik) {
      return NextResponse.json(
        { error: "Validation failed", message: "Nama dan NIK harus diisi" },
        { status: 400 }
      )
    }

    if (!data.activities || data.activities.length === 0) {
      return NextResponse.json(
        { error: "Validation failed", message: "Minimal harus ada 1 activity" },
        { status: 400 }
      )
    }

    const isMobile = request.headers.get('user-agent')?.toLowerCase().includes('mobile')
    
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: isMobile ? true : false,
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPos = margin

    // Logo (if provided as base64)
    if (data.logoDataURL) {
      try {
        const maxLogoSize = isMobile ? 50 * 1024 : 100 * 1024
        const logoSize = data.logoDataURL.length
        
        if (logoSize < maxLogoSize) {
          doc.addImage(data.logoDataURL, "PNG", margin, yPos, 25, 25)
        } else {
          console.warn('[PDF] Logo too large, skipping')
        }
      } catch (e) {
        console.error("Error adding logo:", e)
        // Continue without logo
      }
    }

    // Header Title
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("FORMULIR LEADERSHIP ACTIVITY", pageWidth / 2, yPos + 12, { align: "center" })
    yPos += 30

    // Activity Section
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setFillColor(220, 220, 220)
    doc.rect(margin, yPos, contentWidth, 7, "F")
    doc.text("ACTIVITY", margin + 2, yPos + 5)
    yPos += 7

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const activityText = data.activities && data.activities.length > 0 ? data.activities.join(", ") : "-"
    doc.rect(margin, yPos, contentWidth, 10)
    doc.text(activityText, margin + 2, yPos + 6)
    yPos += 12

    // Employee Data Section
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setFillColor(220, 220, 220)
    doc.rect(margin, yPos, contentWidth, 7, "F")
    doc.text("Data Karyawan", margin + 2, yPos + 5)
    yPos += 7

    const colWidth = contentWidth / 2
    const rowHeight = 8
    const employeeData = [
      ["NIK", data.formData.nik || "-", "Departemen", data.formData.departemen || "-"],
      ["Nama", data.formData.nama || "-", "Lokasi Kerja", data.formData.lokasi || "-"],
      ["Jabatan", data.formData.jabatan || "-", "Tanggal Masuk", data.formData.tanggal_masuk || "-"],
    ]

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    employeeData.forEach((row) => {
      doc.rect(margin, yPos, colWidth, rowHeight)
      doc.setFont("helvetica", "bold")
      doc.text(row[0], margin + 2, yPos + 5)
      doc.setFont("helvetica", "normal")
      doc.text(row[1], margin + 30, yPos + 5)

      doc.rect(margin + colWidth, yPos, colWidth, rowHeight)
      doc.setFont("helvetica", "bold")
      doc.text(row[2], margin + colWidth + 2, yPos + 5)
      doc.setFont("helvetica", "normal")
      doc.text(row[3], margin + colWidth + 30, yPos + 5)

      yPos += rowHeight
    })
    yPos += 3

    // Problem Section
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setFillColor(220, 220, 220)
    doc.rect(margin, yPos, contentWidth, 7, "F")
    doc.text("MASALAH", margin + 2, yPos + 5)
    yPos += 7

    doc.setFont("helvetica", "normal")
    const masalahLines = doc.splitTextToSize(data.formData.masalah || "-", contentWidth - 4)
    const masalahHeight = Math.max(15, masalahLines.length * 5 + 4)
    doc.rect(margin, yPos, contentWidth, masalahHeight)
    doc.text(masalahLines, margin + 2, yPos + 5)
    yPos += masalahHeight + 3

    // Follow-up Section
    doc.setFont("helvetica", "bold")
    doc.setFillColor(220, 220, 220)
    doc.rect(margin, yPos, contentWidth, 7, "F")
    doc.text("TINDAK LANJUT / SOLUSI", margin + 2, yPos + 5)
    yPos += 7

    doc.setFont("helvetica", "normal")
    const tindakLanjutLines = doc.splitTextToSize(data.formData.tindak_lanjut || "-", contentWidth - 4)
    const tindakLanjutHeight = Math.max(15, tindakLanjutLines.length * 5 + 4)
    doc.rect(margin, yPos, contentWidth, tindakLanjutHeight)
    doc.text(tindakLanjutLines, margin + 2, yPos + 5)
    yPos += tindakLanjutHeight + 3

    // Commitment Section
    doc.setFont("helvetica", "bold")
    doc.setFillColor(220, 220, 220)
    doc.rect(margin, yPos, contentWidth, 7, "F")
    doc.text("KOMITMEN", margin + 2, yPos + 5)
    yPos += 7

    doc.setFont("helvetica", "normal")
    const komitmenLines = doc.splitTextToSize(data.formData.komitmen || "-", contentWidth - 4)
    const komitmenHeight = Math.max(15, komitmenLines.length * 5 + 4)
    doc.rect(margin, yPos, contentWidth, komitmenHeight)
    doc.text(komitmenLines, margin + 2, yPos + 5)
    yPos += komitmenHeight + 3

    // Notes
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`Catatan: ${data.formData.catatan || "-"}`, margin, yPos)
    yPos += 8

    // Signature Section
    const sigWidth = contentWidth / 4
    const sigHeight = 35

    const signatureData = [
      { key: "atasan", title: "Dibuat oleh,", subtitle: "Atasan Langsung" },
      { key: "karyawan", title: "Diterima oleh,", subtitle: "Karyawan" },
      { key: "pjo", title: "Diketahui oleh,", subtitle: "PJO / Mgr. / GM / Dir." },
      { key: "hcga", title: "HCGA", subtitle: "Dic / Pic" },
    ]

    doc.setFontSize(8)
    signatureData.forEach((sig, idx) => {
      const xPos = margin + idx * sigWidth
      const sigInfo = data.signatures[sig.key]
      const signatureDataUrl = data.capturedSignatures[sig.key]

      doc.setFont("helvetica", "bold")
      doc.text(sig.title, xPos + sigWidth / 2, yPos, { align: "center" })
      doc.setFont("helvetica", "normal")
      doc.text(sig.subtitle, xPos + sigWidth / 2, yPos + 4, { align: "center" })

      if (signatureDataUrl) {
        try {
          doc.addImage(signatureDataUrl, "PNG", xPos + 5, yPos + 6, sigWidth - 10, 15)
        } catch (e) {
          console.error(`Error adding signature ${sig.key}:`, e)
          // Continue without this signature
        }
      }

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.text(sigInfo?.nama || "-", xPos + sigWidth / 2, yPos + 25, { align: "center" })
      doc.text(sigInfo?.tanggal || "-", xPos + sigWidth / 2, yPos + 29, { align: "center" })

      if (idx < signatureData.length - 1) {
        doc.setDrawColor(200, 200, 200)
        doc.line(xPos + sigWidth, yPos, xPos + sigWidth, yPos + sigHeight)
      }
    })

    // Photo page
    if (data.photoData) {
      try {
        const photoSize = data.photoData.length
        const maxPhotoSize = isMobile ? 300 * 1024 : 800 * 1024 // Increased limits
        
        if (photoSize > maxPhotoSize) {
          console.warn('[PDF] Photo size large:', photoSize, 'bytes')
          // Add warning page instead of trying to add large photo
          doc.addPage()
          yPos = margin
          doc.setFontSize(12)
          doc.setTextColor(200, 0, 0)
          doc.text("Perhatian: Foto terlalu besar untuk ditambahkan ke PDF", pageWidth / 2, yPos + 20, { align: "center" })
          doc.text("Silakan gunakan foto dengan ukuran lebih kecil (< 1MB)", pageWidth / 2, yPos + 30, { align: "center" })
        } else {
          doc.addPage()
          yPos = margin

          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(0, 0, 0)
          doc.text("BUKTI PERTEMUAN (FOTO)", pageWidth / 2, yPos, { align: "center" })
          yPos += 10

          const maxWidth = contentWidth
          const maxHeight = pageHeight - yPos - margin
          const xOffset = margin

          const imageFormat = data.photoData.includes('data:image/png') ? "PNG" : "JPEG"
          
          doc.addImage(data.photoData, imageFormat, xOffset, yPos, maxWidth, maxHeight * 0.8)
        }
      } catch (e) {
        console.error("Error adding photo:", e)
        doc.addPage()
        yPos = margin
        doc.setFontSize(12)
        doc.setTextColor(255, 0, 0)
        doc.text("Error: Foto tidak dapat ditambahkan ke PDF", pageWidth / 2, yPos + 20, { align: "center" })
        doc.text("Format atau ukuran foto tidak didukung", pageWidth / 2, yPos + 30, { align: "center" })
      }
    }

    // Generate PDF as buffer
    const pdfBuffer = doc.output("arraybuffer")

    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9\s]/g, "_").replace(/\s+/g, "_").replace(/_+/g, "_").substring(0, 50)
    const filename = `LA_${sanitize(data.formData?.nama || "Nama")}_${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ 
      error: "Failed to generate PDF",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
