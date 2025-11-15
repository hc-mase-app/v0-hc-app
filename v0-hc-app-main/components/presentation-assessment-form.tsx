"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Download } from "lucide-react"
import { SignaturePad } from "./signature-pad"

interface AssessmentData {
  // Employee Info
  nama: string
  departemen: string
  nrp: string
  awalMasuk: string
  jabatan: string
  usulanJabatan: string

  // Ratings (1-5)
  attitude: number
  leadership: number
  penguasaan: number
  penyajian: number
  proposal: number

  // Confirmation
  konfirmasi: string

  // Assessor Info
  namaPenilai: string
  jabatanPenilai: string
  tanggalPenilai: string

  // Notes
  catatan: string

  signature: string
}

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

const RATING_GRADES = {
  5: "IS",
  4: "BS",
  3: "B",
  2: "C",
  1: "K",
}

const GRADING_SYSTEM = {
  5: { label: "Istimewa", value: 500 },
  4: { label: "Baik Sekali", value: 400 },
  3: { label: "Baik", value: 300 },
  2: { label: "Cukup", value: 200 },
  1: { label: "Kurang", value: 100 },
}

export default function PresentationAssessmentForm() {
  const [formData, setFormData] = useState<AssessmentData>({
    nama: "",
    departemen: "",
    nrp: "",
    awalMasuk: "",
    jabatan: "",
    usulanJabatan: "",
    attitude: 0,
    leadership: 0,
    penguasaan: 0,
    penyajian: 0,
    proposal: 0,
    konfirmasi: "",
    namaPenilai: "",
    jabatanPenilai: "",
    tanggalPenilai: "",
    catatan: "",
    signature: "",
  })

  const [scores, setScores] = useState({
    attitude: 0,
    leadership: 0,
    penguasaan: 0,
    penyajian: 0,
    proposal: 0,
  })

  const calculateScores = () => {
    const newScores = {
      attitude: formData.attitude * 30,
      leadership: formData.leadership * 30,
      penguasaan: formData.penguasaan * 20,
      penyajian: formData.penyajian * 10,
      proposal: formData.proposal * 10,
    }
    setScores(newScores)
  }

  useEffect(() => {
    calculateScores()
  }, [formData.attitude, formData.leadership, formData.penguasaan, formData.penyajian, formData.proposal])

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const isPassing = totalScore >= 300

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRatingChange = (dimension: string, rating: number) => {
    setFormData((prev) => ({
      ...prev,
      [dimension]: rating,
    }))
  }

  const handleSignatureChange = (signatureData: string) => {
    setFormData((prev) => ({
      ...prev,
      signature: signatureData,
    }))
  }

  const handleSaveDraft = () => {
    localStorage.setItem("presentationAssessmentDraft", JSON.stringify(formData))
    alert("Draft berhasil disimpan!")
  }

  const handleLoadDraft = () => {
    const draft = localStorage.getItem("presentationAssessmentDraft")
    if (draft) {
      setFormData(JSON.parse(draft))
      alert("Draft berhasil dimuat!")
    } else {
      alert("Tidak ada draft yang tersimpan")
    }
  }

  const handleExportPDF = async () => {
    if (!formData.signature) {
      alert("Silakan tanda tangani form terlebih dahulu sebelum export")
      return
    }

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 8
      const contentWidth = pageWidth - margin * 2
      let yPos = margin

      // Set default font
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

      // Horizontal line
      doc.setDrawColor(0)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 4

      // Employee Information Table
      doc.setFontSize(8)
      doc.setFont("Arial", "bold")
      doc.text("INFORMASI KARYAWAN", margin, yPos)
      yPos += 3

      const empInfoData = [
        ["Nama:", formData.nama, "Departemen:", formData.departemen, "NRP:", formData.nrp],
        ["Awal Masuk:", formData.awalMasuk, "Jabatan:", formData.jabatan, "Usulan Jabatan:", formData.usulanJabatan],
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

      // Table header
      const tableColWidths = [contentWidth * 0.5, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.2]
      const tableRowHeight = 4
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
        const rating = formData[dim.id as keyof typeof formData] as number
        const score = scores[dim.id as keyof typeof scores]
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
          { align: "center" },
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

      // Grading labels
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

      // Signature image
      if (formData.signature) {
        doc.addImage(formData.signature, "PNG", margin, yPos, 15, 8)
      }
      doc.text("Tanda Tangan", margin + 7.5, yPos + 9, { align: "center" })

      // Assessor name
      doc.text("Nama Penilai", margin + sigColWidth + 5, yPos, { align: "center" })
      doc.setFont("Arial", "normal")
      doc.setFontSize(5)
      doc.text(formData.namaPenilai, margin + sigColWidth + 5, yPos + 2, { align: "center" })

      // Assessor position
      doc.setFont("Arial", "bold")
      doc.setFontSize(6)
      doc.text("Jabatan", margin + sigColWidth * 2 + 5, yPos, { align: "center" })
      doc.setFont("Arial", "normal")
      doc.setFontSize(5)
      doc.text(formData.jabatanPenilai, margin + sigColWidth * 2 + 5, yPos + 2, { align: "center" })

      // Date
      doc.setFont("Arial", "bold")
      doc.setFontSize(6)
      doc.text("Tanggal", margin + sigColWidth * 2 + 5, yPos + 4, { align: "center" })
      doc.setFont("Arial", "normal")
      doc.setFontSize(5)
      doc.text(formData.tanggalPenilai, margin + sigColWidth * 2 + 5, yPos + 6, { align: "center" })

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

      // Save PDF
      doc.save(`Evaluasi_Presentasi_${formData.nama || "Karyawan"}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error exporting PDF:", error)
      alert("Gagal export ke PDF. Silakan coba lagi.")
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-6">
        {/* Employee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Karyawan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nama" className="text-xs font-semibold uppercase">
                  Nama Karyawan
                </Label>
                <Input
                  id="nama"
                  placeholder="Masukkan nama lengkap"
                  value={formData.nama}
                  onChange={(e) => handleInputChange("nama", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="departemen" className="text-xs font-semibold uppercase">
                  Departemen
                </Label>
                <Input
                  id="departemen"
                  placeholder="Masukkan departemen"
                  value={formData.departemen}
                  onChange={(e) => handleInputChange("departemen", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nrp" className="text-xs font-semibold uppercase">
                  NRP
                </Label>
                <Input
                  id="nrp"
                  placeholder="Masukkan NRP"
                  value={formData.nrp}
                  onChange={(e) => handleInputChange("nrp", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="awalMasuk" className="text-xs font-semibold uppercase">
                  Tanggal Masuk
                </Label>
                <Input
                  id="awalMasuk"
                  type="date"
                  value={formData.awalMasuk}
                  onChange={(e) => handleInputChange("awalMasuk", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="jabatan" className="text-xs font-semibold uppercase">
                  Jabatan Saat Ini
                </Label>
                <Input
                  id="jabatan"
                  placeholder="Masukkan jabatan"
                  value={formData.jabatan}
                  onChange={(e) => handleInputChange("jabatan", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="usulanJabatan" className="text-xs font-semibold uppercase">
                  Usulan Jabatan
                </Label>
                <Input
                  id="usulanJabatan"
                  placeholder="Masukkan usulan jabatan"
                  value={formData.usulanJabatan}
                  onChange={(e) => handleInputChange("usulanJabatan", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Dimensions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evaluasi Dimensi Kinerja</CardTitle>
            <p className="text-xs text-muted-foreground mt-2">
              5=Istimewa(IS) | 4=Baik Sekali(BS) | 3=Baik(B) | 2=Cukup(C) | 1=Kurang(K)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {DIMENSIONS.map((dimension) => {
                const rating = formData[dimension.id as keyof typeof formData] as number
                const score = scores[dimension.id as keyof typeof scores]

                return (
                  <div key={dimension.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <h3 className="font-semibold text-sm">{dimension.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{dimension.description}</p>
                        <div className="mt-2 text-sm font-bold text-primary">Bobot: {dimension.weight}%</div>
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex gap-2 flex-wrap">
                          {[5, 4, 3, 2, 1].map((r) => (
                            <button
                              key={r}
                              onClick={() => handleRatingChange(dimension.id, r)}
                              className={`flex flex-col items-center justify-center w-12 h-12 rounded border-2 transition-all ${
                                rating === r ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                              }`}
                            >
                              <span className="font-bold text-sm">{r}</span>
                              <span className="text-xs">{RATING_GRADES[r as keyof typeof RATING_GRADES]}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Nilai</p>
                          <p className="text-2xl font-bold text-primary">{score}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total Score */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold">TOTAL NILAI</span>
                <span className="text-3xl font-bold text-primary">{totalScore}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {isPassing ? (
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Lulus (≥ 300)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">{"Tidak Lulus (< 300)"}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grading System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sistem Penilaian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(GRADING_SYSTEM).map(([rating, { label, value }]) => (
                <div key={rating} className="text-center p-3 border rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold text-primary">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted rounded text-center text-sm font-medium">
              Standar Minimum Kelulusan: ≥ 300
            </div>
          </CardContent>
        </Card>

        {/* Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Konfirmasi dari Penilai</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={formData.konfirmasi} onValueChange={(value) => handleInputChange("konfirmasi", value)}>
              <div className="space-y-3">
                {[
                  { value: "disarankan", label: "Disarankan" },
                  { value: "denganCatatan", label: "Disarankan dengan catatan" },
                  { value: "ditunda3", label: "Ditunda 3 Bulan" },
                  { value: "ditunda6", label: "Ditunda 6 Bulan" },
                  { value: "tidakDisarankan", label: "Tidak Disarankan" },
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Assessor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Penilai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="namaPenilai" className="text-xs font-semibold uppercase">
                  Nama Penilai
                </Label>
                <Input
                  id="namaPenilai"
                  placeholder="Masukkan nama penilai"
                  value={formData.namaPenilai}
                  onChange={(e) => handleInputChange("namaPenilai", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="jabatanPenilai" className="text-xs font-semibold uppercase">
                  Jabatan
                </Label>
                <Input
                  id="jabatanPenilai"
                  placeholder="Masukkan jabatan"
                  value={formData.jabatanPenilai}
                  onChange={(e) => handleInputChange("jabatanPenilai", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tanggalPenilai" className="text-xs font-semibold uppercase">
                  Tanggal
                </Label>
                <Input
                  id="tanggalPenilai"
                  type="date"
                  value={formData.tanggalPenilai}
                  onChange={(e) => handleInputChange("tanggalPenilai", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Masukkan catatan tambahan jika diperlukan..."
              value={formData.catatan}
              onChange={(e) => handleInputChange("catatan", e.target.value)}
              className="min-h-24"
            />
          </CardContent>
        </Card>
      </div>

      <SignaturePad value={formData.signature} onSignatureChange={handleSignatureChange} />

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center pb-8 flex-wrap">
        <Button variant="outline" onClick={handleSaveDraft}>
          Simpan Draft
        </Button>
        <Button variant="outline" onClick={handleLoadDraft}>
          Muat Draft
        </Button>
        <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export to PDF
        </Button>
        <Button className="bg-primary hover:bg-primary/90">Kirim Penilaian</Button>
      </div>
    </div>
  )
}
