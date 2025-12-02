import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"

const DIMENSIONS = [
  {
    id: "attitude",
    name: "ATTITUDE / SIKAP KERJA",
    description: "Menunjukkan penampilan yang profesional, sopan santun, berwibawa dan energetic.",
    weight: 30,
  },
  {
    id: "leadership",
    name: "LEADERSHIP",
    description: "Memperlihatkan kedewasaan menghadapi lingkungan kerja dan kemampuan memimpin sumber daya.",
    weight: 30,
  },
  {
    id: "penguasaan",
    name: "PENGUASAAN MATERI",
    description: "Memperlihatkan penguasaan terhadap materi, analisa, serta menjawab pertanyaan dengan tepat.",
    weight: 20,
  },
  {
    id: "penyajian",
    name: "PENYAJIAN MATERI",
    description: "Kemampuan menyampaikan pendapat, komunikasi yang baik, dan tidak gugup saat presentasi.",
    weight: 10,
  },
  {
    id: "proposal",
    name: "PROPOSAL MATERI",
    description: "Menampilkan usulan dan solusi jangka pendek maupun panjang untuk perbaikan.",
    weight: 10,
  },
]

const KONFIRMASI_OPTIONS = [
  { value: "disarankan", label: "Disarankan" },
  { value: "denganCatatan", label: "Disarankan dengan catatan" },
  { value: "ditunda3", label: "Ditunda 3 Bulan" },
  { value: "ditunda6", label: "Ditunda 6 Bulan" },
  { value: "tidakDisarankan", label: "Tidak Disarankan" },
]

export async function POST(request: NextRequest) {
  try {
    const { formData, scores, totalScore } = await request.json()

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const colors = {
      primary: [37, 99, 235], // Blue-600
      secondary: [71, 85, 105], // Slate-600
      accent: [139, 92, 246], // Violet-500
      text: [15, 23, 42], // Slate-900
      textLight: [100, 116, 139], // Slate-500
      border: [226, 232, 240], // Slate-200
      background: [248, 250, 252], // Slate-50
      success: [34, 197, 94], // Green-500
    }

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPos = margin

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.rect(0, 0, pageWidth, 25, "F")

    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text("EVALUASI PRESENTASI KARYAWAN", pageWidth / 2, 12, { align: "center" })

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Form Penilaian Kinerja dan Kompetensi", pageWidth / 2, 18, { align: "center" })

    yPos = 30

    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
    doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, "F")

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, "S")

    const infoYStart = yPos + 5
    const col1X = margin + 5
    const col2X = margin + contentWidth / 2 + 5
    const lineHeight = 5.5

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])

    // Column 1
    doc.text("Nama", col1X, infoYStart)
    doc.text("NRP", col1X, infoYStart + lineHeight)
    doc.text("Jabatan", col1X, infoYStart + lineHeight * 2)

    // Column 2
    doc.text("Departemen", col2X, infoYStart)
    doc.text("Awal Masuk", col2X, infoYStart + lineHeight)
    doc.text("Usulan Jabatan", col2X, infoYStart + lineHeight * 2)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    // Values - Column 1
    doc.text(formData.nama || "-", col1X + 20, infoYStart)
    doc.text(formData.nrp || "-", col1X + 20, infoYStart + lineHeight)
    doc.text(formData.jabatan || "-", col1X + 20, infoYStart + lineHeight * 2)

    // Values - Column 2
    doc.text(formData.departemen || "-", col2X + 25, infoYStart)
    doc.text(formData.awalMasuk || "-", col2X + 25, infoYStart + lineHeight)
    doc.text(formData.usulanJabatan || "-", col2X + 25, infoYStart + lineHeight * 2)

    yPos += 28

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.text("Dimensi Penilaian", margin, yPos)
    yPos += 6

    const colWidths = {
      no: 12,
      dimensi: 72,
      bobot: 20,
      rating: 50, // Total for all ratings
      nilai: 22,
    }

    const headerHeight = 10
    let xPos = margin

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.roundedRect(margin, yPos, contentWidth, headerHeight, 1, 1, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)

    // Headers
    doc.text("No", xPos + colWidths.no / 2, yPos + 6.5, { align: "center" })
    xPos += colWidths.no

    doc.text("Dimensi & Deskripsi", xPos + colWidths.dimensi / 2, yPos + 6.5, { align: "center" })
    xPos += colWidths.dimensi

    doc.text("Bobot", xPos + colWidths.bobot / 2, yPos + 6.5, { align: "center" })
    xPos += colWidths.bobot

    doc.text("Rating (5-1)", xPos + colWidths.rating / 2, yPos + 6.5, { align: "center" })
    xPos += colWidths.rating

    doc.text("Nilai", xPos + colWidths.nilai / 2, yPos + 6.5, { align: "center" })

    yPos += headerHeight

    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    DIMENSIONS.forEach((dim, index) => {
      const rating = formData[dim.id] || 0
      const score = scores[dim.id] || 0
      const rowHeight = 20

      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
        doc.rect(margin, yPos, contentWidth, rowHeight, "F")
      }

      xPos = margin

      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
      doc.setLineWidth(0.3)

      // No
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
      doc.text((index + 1).toString(), xPos + colWidths.no / 2, yPos + rowHeight / 2 + 1, { align: "center" })
      xPos += colWidths.no

      // Dimensi
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      doc.text(dim.name, xPos + 2, yPos + 6)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
      const descLines = doc.splitTextToSize(dim.description, colWidths.dimensi - 4)
      doc.text(descLines, xPos + 2, yPos + 11)
      xPos += colWidths.dimensi

      // Bobot
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      doc.text(dim.weight.toString(), xPos + colWidths.bobot / 2, yPos + rowHeight / 2 + 1, { align: "center" })
      xPos += colWidths.bobot

      const ratingSpacing = colWidths.rating / 5
      for (let r = 5; r >= 1; r--) {
        const circleX = xPos + ratingSpacing / 2
        const circleY = yPos + rowHeight / 2
        const circleRadius = 3

        if (rating === r) {
          // Filled circle for selected rating
          doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
          doc.circle(circleX, circleY, circleRadius, "F")

          // White checkmark
          doc.setTextColor(255, 255, 255)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(7)
          doc.text("✓", circleX, circleY + 1, { align: "center" })
        } else {
          // Empty circle
          doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
          doc.setLineWidth(0.5)
          doc.circle(circleX, circleY, circleRadius, "S")

          // Rating number
          doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
          doc.setFont("helvetica", "normal")
          doc.setFontSize(7)
          doc.text(r.toString(), circleX, circleY + 1, { align: "center" })
        }

        xPos += ratingSpacing
      }

      // Nilai with highlight
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2])
      doc.roundedRect(xPos + 2, yPos + rowHeight / 2 - 5, colWidths.nilai - 4, 10, 2, 2, "F")

      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text(score.toString(), xPos + colWidths.nilai / 2, yPos + rowHeight / 2 + 2, { align: "center" })

      yPos += rowHeight
    })

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text("TOTAL NILAI", margin + contentWidth - 40, yPos + 5.5)
    doc.setFontSize(12)
    doc.text(totalScore.toString(), margin + contentWidth - 12, yPos + 5.5)

    yPos += 13

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
    doc.text("Konfirmasi Penilai", margin, yPos)
    yPos += 5

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    KONFIRMASI_OPTIONS.forEach((option) => {
      const radioX = margin + 3
      const radioY = yPos - 1
      const radioRadius = 2

      if (formData.konfirmasi === option.value) {
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
        doc.circle(radioX, radioY, radioRadius, "F")
      } else {
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
        doc.setLineWidth(0.5)
        doc.circle(radioX, radioY, radioRadius, "S")
      }

      doc.text(option.label, margin + 8, yPos)
      yPos += 4.5
    })

    yPos += 3

    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
    doc.roundedRect(margin, yPos, contentWidth, 28, 2, 2, "F")

    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, contentWidth, 28, 2, 2, "S")

    const sigYStart = yPos + 5
    const sigCol1X = margin + 5
    const sigCol2X = margin + contentWidth / 2 + 5

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])

    doc.text("Nama Penilai", sigCol1X, sigYStart)
    doc.text("Jabatan", sigCol2X, sigYStart)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    doc.text(formData.namaPenilai || "-", sigCol1X, sigYStart + 5)
    doc.text(formData.jabatanPenilai || "-", sigCol2X, sigYStart + 5)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])

    doc.text("Tanggal", sigCol1X, sigYStart + 11)
    doc.text("Tanda Tangan", sigCol2X, sigYStart + 11)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])

    doc.text(formData.tanggalPenilai || "-", sigCol1X, sigYStart + 16)

    // Signature image
    if (formData.signature) {
      try {
        doc.addImage(formData.signature, "PNG", sigCol2X, sigYStart + 13, 30, 8)
      } catch {
        doc.setFont("helvetica", "italic")
        doc.setFontSize(7)
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
        doc.text("(Belum ditandatangani)", sigCol2X, sigYStart + 16)
      }
    } else {
      doc.setFont("helvetica", "italic")
      doc.setFontSize(7)
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
      doc.text("(Belum ditandatangani)", sigCol2X, sigYStart + 16)
    }

    yPos += 33

    if (yPos + 20 <= pageHeight - margin) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
      doc.text("Catatan:", margin, yPos)
      yPos += 4

      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, "F")

      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, "S")

      if (formData.catatan) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
        const catatanLines = doc.splitTextToSize(formData.catatan, contentWidth - 6)
        doc.text(catatanLines.slice(0, 2), margin + 3, yPos + 5)
      } else {
        doc.setFont("helvetica", "italic")
        doc.setFontSize(8)
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
        doc.text("(Tidak ada catatan)", margin + 3, yPos + 7)
      }
    }

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
    const footerText = `Generated on ${new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`
    doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: "center" })

    // Generate PDF as buffer
    const pdfBuffer = doc.output("arraybuffer")

    const filename = `Evaluasi_Presentasi_${formData.nama || "Karyawan"}_${new Date().toISOString().split("T")[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
