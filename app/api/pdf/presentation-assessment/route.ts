import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"

const DIMENSIONS = [
  {
    id: "attitude",
    name: "1. ATTITUDE / SIKAP KERJA",
    description: "Menunjukkan penampilan yang profesional, sopan santun, berwibawa dan energetic.",
    weight: 30,
  },
  {
    id: "leadership",
    name: "2. LEADERSHIP",
    description:
      "Memperlihatkan kedewasaan menghadapi lingkungan kerja, kondisi kerja dan kemampuan untuk mengkoordinasikan dan memimpin sumber daya yang tersedia.",
    weight: 30,
  },
  {
    id: "penguasaan",
    name: "3. PENGUASAAN MATERI",
    description:
      "Memperlihatkan penguasaan terhadap apa yang telah dipelajari, dianalisa dan dikerjakan selama periode program.",
    weight: 20,
  },
  {
    id: "penyajian",
    name: "4. PENYAJIAN MATERI",
    description: "Kemampuan menjawab pertanyaan secara memuaskan, teknik dan sarana yang baik dalam berkomunikasi.",
    weight: 10,
  },
  {
    id: "proposal",
    name: "5. PROPOSAL MATERI",
    description: "Menampilkan usulan, saran dan proposal terhadap keadaan yang perlu diperbaiki.",
    weight: 10,
  },
]

const RATING_GRADES: Record<number, string> = {
  5: "IS",
  4: "BS",
  3: "B",
  2: "C",
  1: "K",
}

export async function POST(request: NextRequest) {
  try {
    const { formData, scores, totalScore } = await request.json()

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 8
    const contentWidth = pageWidth - margin * 2
    let yPos = margin

    doc.setFont("Arial", "normal")

    // Header
    doc.setFontSize(14)
    doc.setFont("Arial", "bold")
    doc.text("EVALUASI PRESENTASI KARYAWAN", pageWidth / 2, yPos, { align: "center" })
    yPos += 5

    doc.setFontSize(9)
    doc.setFont("Arial", "normal")
    doc.text("PT. SARANA SUKSES SEJAHTERA", pageWidth / 2, yPos, { align: "center" })
    yPos += 6

    doc.setDrawColor(0)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 4

    // Employee Information
    doc.setFontSize(8)
    doc.setFont("Arial", "bold")
    doc.text("INFORMASI KARYAWAN", margin, yPos)
    yPos += 3

    const empInfoData = [
      ["Nama:", formData.nama || "-", "Departemen:", formData.departemen || "-", "NRP:", formData.nrp || "-"],
      [
        "Awal Masuk:",
        formData.awalMasuk || "-",
        "Jabatan:",
        formData.jabatan || "-",
        "Usulan Jabatan:",
        formData.usulanJabatan || "-",
      ],
    ]

    doc.setFont("Arial", "normal")
    doc.setFontSize(7)
    empInfoData.forEach((row) => {
      const colWidth = contentWidth / 3
      for (let i = 0; i < 3; i++) {
        doc.setFont("Arial", "bold")
        doc.text(row[i * 2], margin + i * colWidth, yPos, { maxWidth: colWidth - 1 })
        doc.setFont("Arial", "normal")
        doc.text(row[i * 2 + 1], margin + i * colWidth + 15, yPos, { maxWidth: colWidth - 16 })
      }
      yPos += 3
    })
    yPos += 2

    // Evaluation Table
    doc.setFont("Arial", "bold")
    doc.setFontSize(8)
    doc.text("EVALUASI DIMENSI KINERJA", margin, yPos)
    yPos += 3

    const tableColWidths = [contentWidth * 0.5, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.2]
    const headerHeight = 5

    doc.setFillColor(200, 200, 200)
    doc.rect(margin, yPos, tableColWidths[0], headerHeight, "F")
    doc.rect(margin + tableColWidths[0], yPos, tableColWidths[1], headerHeight, "F")
    doc.rect(margin + tableColWidths[0] + tableColWidths[1], yPos, tableColWidths[2], headerHeight, "F")
    doc.rect(
      margin + tableColWidths[0] + tableColWidths[1] + tableColWidths[2],
      yPos,
      tableColWidths[3],
      headerHeight,
      "F",
    )

    doc.setFont("Arial", "bold")
    doc.setFontSize(7)
    doc.text("Dimensi Evaluasi", margin + 1, yPos + 2)
    doc.text("Bobot", margin + tableColWidths[0] + tableColWidths[1] / 2, yPos + 2, { align: "center" })
    doc.text("Rating", margin + tableColWidths[0] + tableColWidths[1] + tableColWidths[2] / 2, yPos + 2, {
      align: "center",
    })
    doc.text(
      "Nilai",
      margin + tableColWidths[0] + tableColWidths[1] + tableColWidths[2] + tableColWidths[3] / 2,
      yPos + 2,
      { align: "center" },
    )
    yPos += headerHeight

    // Table rows
    doc.setFont("Arial", "normal")
    doc.setFontSize(6)
    DIMENSIONS.forEach((dim) => {
      const rating = formData[dim.id] || 0
      const score = scores[dim.id] || 0
      const rowHeight = 8

      doc.setFillColor(255, 255, 255)
      doc.rect(margin, yPos, tableColWidths[0], rowHeight, "F")
      doc.rect(margin + tableColWidths[0], yPos, tableColWidths[1], rowHeight, "F")
      doc.rect(margin + tableColWidths[0] + tableColWidths[1], yPos, tableColWidths[2], rowHeight, "F")
      doc.rect(
        margin + tableColWidths[0] + tableColWidths[1] + tableColWidths[2],
        yPos,
        tableColWidths[3],
        rowHeight,
        "F",
      )

      doc.setDrawColor(0)
      doc.rect(margin, yPos, tableColWidths[0], rowHeight)
      doc.rect(margin + tableColWidths[0], yPos, tableColWidths[1], rowHeight)
      doc.rect(margin + tableColWidths[0] + tableColWidths[1], yPos, tableColWidths[2], rowHeight)
      doc.rect(margin + tableColWidths[0] + tableColWidths[1] + tableColWidths[2], yPos, tableColWidths[3], rowHeight)

      doc.text(dim.name + "\n" + dim.description, margin + 1, yPos + 1, { maxWidth: tableColWidths[0] - 2 })
      doc.text(dim.weight.toString(), margin + tableColWidths[0] + tableColWidths[1] / 2, yPos + 4, {
        align: "center",
      })
      doc.text(
        rating ? rating.toString() : "-",
        margin + tableColWidths[0] + tableColWidths[1] + tableColWidths[2] / 2,
        yPos + 4,
        {
          align: "center",
        },
      )
      doc.text(
        score ? score.toString() : "-",
        margin + tableColWidths[0] + tableColWidths[1] + tableColWidths[2] + tableColWidths[3] / 2,
        yPos + 4,
        { align: "center" },
      )

      yPos += rowHeight
    })

    // Total row
    const tableRowHeight = 4
    doc.setFillColor(220, 220, 220)
    doc.rect(margin, yPos, tableColWidths[0], tableRowHeight, "F")
    doc.rect(margin + tableColWidths[0], yPos, tableColWidths[1], tableRowHeight, "F")
    doc.rect(margin + tableColWidths[0] + tableColWidths[1], yPos, tableColWidths[2], tableRowHeight, "F")
    doc.rect(
      margin + tableColWidths[0] + tableColWidths[1] + tableColWidths[2],
      yPos,
      tableColWidths[3],
      tableRowHeight,
      "F",
    )

    doc.setFont("Arial", "bold")
    doc.setFontSize(7)
    doc.text("TOTAL NILAI", margin + 1, yPos + 2)
    doc.text(
      totalScore.toString(),
      margin + tableColWidths[0] + tableColWidths[1] + tableColWidths[2] + tableColWidths[3] / 2,
      yPos + 2,
      { align: "center" },
    )
    yPos += tableRowHeight + 2

    // Grading System
    doc.setFont("Arial", "bold")
    doc.setFontSize(7)
    doc.text("SISTEM PENILAIAN", margin, yPos)
    yPos += 3

    const gradingColWidth = contentWidth / 5
    const gradingRowHeight = 4

    const gradingLabels = ["Istimewa", "Baik Sekali", "Baik", "Cukup", "Kurang"]
    const gradingValues = ["500", "400", "300", "200", "100"]

    doc.setFillColor(200, 200, 200)
    gradingLabels.forEach((label, idx) => {
      doc.rect(margin + idx * gradingColWidth, yPos, gradingColWidth, gradingRowHeight, "F")
      doc.setDrawColor(0)
      doc.rect(margin + idx * gradingColWidth, yPos, gradingColWidth, gradingRowHeight)
      doc.setFont("Arial", "bold")
      doc.setFontSize(6)
      doc.text(label, margin + idx * gradingColWidth + gradingColWidth / 2, yPos + 2, { align: "center" })
    })
    yPos += gradingRowHeight

    doc.setFillColor(255, 255, 255)
    gradingValues.forEach((value, idx) => {
      doc.rect(margin + idx * gradingColWidth, yPos, gradingColWidth, gradingRowHeight, "F")
      doc.setDrawColor(0)
      doc.rect(margin + idx * gradingColWidth, yPos, gradingColWidth, gradingRowHeight)
      doc.setFont("Arial", "normal")
      doc.setFontSize(6)
      doc.text(value, margin + idx * gradingColWidth + gradingColWidth / 2, yPos + 2, { align: "center" })
    })
    yPos += gradingRowHeight + 2

    doc.setFont("Arial", "bold")
    doc.setFontSize(6)
    doc.text("Standar Minimum Kelulusan: ≥ 300", pageWidth / 2, yPos, { align: "center" })
    yPos += 3

    // Confirmation
    doc.setFont("Arial", "bold")
    doc.setFontSize(7)
    doc.text("KONFIRMASI DARI PENILAI", margin, yPos)
    yPos += 2
    doc.setFont("Arial", "normal")
    doc.setFontSize(6)
    doc.rect(margin, yPos, contentWidth, 4)
    doc.text(formData.konfirmasi || "-", margin + 1, yPos + 1.5, { maxWidth: contentWidth - 2 })
    yPos += 5

    // Signature Section
    doc.setFont("Arial", "bold")
    doc.setFontSize(6)
    const sigColWidth = contentWidth / 3

    if (formData.signature) {
      doc.addImage(formData.signature, "PNG", margin, yPos, 15, 8)
    }
    doc.text("Tanda Tangan", margin + 7.5, yPos + 9, { align: "center" })

    doc.text("Nama Penilai", margin + sigColWidth + 5, yPos, { align: "center" })
    doc.setFont("Arial", "normal")
    doc.setFontSize(5)
    doc.text(formData.namaPenilai || "-", margin + sigColWidth + 5, yPos + 2, { align: "center" })

    doc.setFont("Arial", "bold")
    doc.setFontSize(6)
    doc.text("Jabatan", margin + sigColWidth * 2 + 5, yPos, { align: "center" })
    doc.setFont("Arial", "normal")
    doc.setFontSize(5)
    doc.text(formData.jabatanPenilai || "-", margin + sigColWidth * 2 + 5, yPos + 2, { align: "center" })

    doc.setFont("Arial", "bold")
    doc.setFontSize(6)
    doc.text("Tanggal", margin + sigColWidth * 2 + 5, yPos + 4, { align: "center" })
    doc.setFont("Arial", "normal")
    doc.setFontSize(5)
    doc.text(formData.tanggalPenilai || "-", margin + sigColWidth * 2 + 5, yPos + 6, { align: "center" })

    // Notes
    if (formData.catatan) {
      yPos += 12
      doc.setFont("Arial", "bold")
      doc.setFontSize(7)
      doc.text("CATATAN", margin, yPos)
      yPos += 2
      doc.setFont("Arial", "normal")
      doc.setFontSize(6)
      doc.rect(margin, yPos, contentWidth, 4)
      doc.text(formData.catatan, margin + 1, yPos + 1.5, { maxWidth: contentWidth - 2 })
    }

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
