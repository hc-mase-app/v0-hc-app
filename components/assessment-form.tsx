"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertCircle, Save, Download, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import jsPDF from "jspdf"
import { INITIAL_USERS } from "@/lib/mock-data"

const DEPARTMENTS = ["Operation", "Produksi", "Plant", "SCM", "HCGA", "HSE", "Finance", "Accounting"]
const SITES = ["Head Office", "BSF", "WBN", "HSM", "MHM", "PSN", "BEKB", "ABN", "KE", "TCMM", "TCM", "IM", "TMU"]

const KEPRIBADIAN_ITEMS = [
  { id: "A1", name: "Inisiatif & Kreativitas", weight: 0.075 },
  { id: "A2", name: "Kedisiplinan & Kerajinan", weight: 0.075 },
  { id: "A3", name: "Komunikasi & Etika Kerja", weight: 0.075 },
  { id: "A4", name: "Tanggung Jawab & Motivasi", weight: 0.075 },
]

const PRESTASI_ITEMS = [
  { id: "B1", name: "Pengetahuan & Kemampuan", weight: 0.03 },
  { id: "B2", name: "Efisiensi & Efektivitas Kerja", weight: 0.03 },
  { id: "B3", name: "Kecepatan & Ketelitian Kerja", weight: 0.03 },
  { id: "B4", name: "Kualitas & Kerjasama Tim", weight: 0.03 },
  { id: "B5", name: "Hasil & Pencapaian Target Kerja", weight: 0.03 },
  { id: "B6", name: "Penguasaan Sistem & Administrasi", weight: 0.03 },
  { id: "B7", name: "Pencatatan, Penyimpanan, dan Pengarsipan Kebutuhan Kerja", weight: 0.03 },
  { id: "B8", name: "Pemahaman & Pengoperasian Unit", weight: 0.03 },
  { id: "B9", name: "Perawatan Unit & Alat Kerja", weight: 0.03 },
  { id: "B10", name: "Kebersihan & Kepedulian K3", weight: 0.03 },
]

interface AssessmentItem {
  id: string
  name: string
  weight: number
  score: number
  nilai: number
}

interface SignatureData {
  name: string
  jabatan: string
  data: string
}

export default function AssessmentForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentSignatureTarget, setCurrentSignatureTarget] = useState<string | null>(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)

  const [formData, setFormData] = useState({
    nik: "",
    nama: "",
    jabatan: "",
    tgl_masuk: "",
    departemen: "",
    site: "",
    status_karyawan: "Kontrak",
    periode_penilaian: "",
    kepribadian: KEPRIBADIAN_ITEMS.map((item) => ({ ...item, score: 0, nilai: 0 })),
    prestasi: PRESTASI_ITEMS.map((item) => ({ ...item, score: 0, nilai: 0 })),
    jumlah_sakit: 0,
    jumlah_izin: 0,
    jumlah_alpa: 0,
    nilai_C: 0,
    jumlah_sp1: 0,
    jumlah_sp2: 0,
    jumlah_sp3: 0,
    nilai_D: 0,
    kelebihan: "",
    kekurangan: "",
    rekomendasi: {
      perpanjangan_kontrak: false,
      perpanjangan_bulan: 12,
      pengangkatan_tetap: false,
      promosi: false,
      perubahan_gaji: false,
      end_kontrak: false,
    },
    signatures: {
      user_site: { name: "", jabatan: "", data: "" },
      hr_site: { name: "", jabatan: "", data: "" },
      pjo_site: { name: "", jabatan: "", data: "" },
      hr_ho: { name: "", jabatan: "", data: "" },
    },
  })

  const handleNikChange = (value: string) => {
    setFormData({ ...formData, nik: value })

    if (value.trim()) {
      const employee = INITIAL_USERS.find((user) => user.nik.toLowerCase() === value.toLowerCase())
      if (employee) {
        setFormData((prev) => ({
          ...prev,
          nik: employee.nik,
          nama: employee.nama,
          jabatan: employee.jabatan,
          departemen: employee.departemen,
          site: employee.site,
          status_karyawan: employee.statusKaryawan,
          tgl_masuk: employee.tanggalBergabung,
        }))
      }
    }
  }

  const handleNamaChange = (value: string) => {
    setFormData({ ...formData, nama: value })

    if (value.trim()) {
      const employee = INITIAL_USERS.find((user) => user.nama.toLowerCase().includes(value.toLowerCase()))
      if (employee) {
        setFormData((prev) => ({
          ...prev,
          nik: employee.nik,
          nama: employee.nama,
          jabatan: employee.jabatan,
          departemen: employee.departemen,
          site: employee.site,
          status_karyawan: employee.statusKaryawan,
          tgl_masuk: employee.tanggalBergabung,
        }))
      }
    }
  }

  const calculateNilaiC = () => {
    const totalAtr = formData.jumlah_sakit + formData.jumlah_izin + formData.jumlah_alpa
    if (totalAtr === 0) return 0.2
    if (totalAtr === 1) return 0.15
    if (totalAtr === 2) return 0.1
    if (totalAtr === 3) return 0.05
    return 0
  }

  const calculateNilaiD = () => {
    const totalSp = formData.jumlah_sp1 + formData.jumlah_sp2 + formData.jumlah_sp3
    if (totalSp === 0) return 0.2
    if (totalSp === 1) return 0.1
    return 0
  }

  const calculateTotalScore = () => {
    const kepribadianTotal = formData.kepribadian.reduce((sum, item) => sum + item.score * item.weight, 0)
    const prestasiTotal = formData.prestasi.reduce((sum, item) => sum + item.score * item.weight, 0)
    const nilaiC = calculateNilaiC()
    const nilaiD = calculateNilaiD()

    const subTotal = kepribadianTotal + prestasiTotal + nilaiC + nilaiD
    const MAX_SCORE = 6.4
    const SCALE_FACTOR = 10.0 / MAX_SCORE
    let scaledScore = subTotal * SCALE_FACTOR

    // Calculate penalties based on number of Alpa and SP
    let penaltyPercentage = 0

    // Alpa penalties
    if (formData.jumlah_alpa === 1) {
      penaltyPercentage += 10 // -10%
    } else if (formData.jumlah_alpa >= 2) {
      penaltyPercentage += 20 // -20%
    }

    // SP penalties
    if (formData.jumlah_sp1 >= 1) {
      penaltyPercentage += 10 // -10%
    }
    if (formData.jumlah_sp2 >= 1) {
      penaltyPercentage += 20 // -20%
    }
    if (formData.jumlah_sp3 >= 1) {
      penaltyPercentage += 50 // -50%
    }

    // Apply penalty to scaled score
    const penaltyAmount = (scaledScore * penaltyPercentage) / 100
    scaledScore = Math.max(0, scaledScore - penaltyAmount) // Ensure score doesn't go below 0

    return scaledScore
  }

  const totalScore = calculateTotalScore()
  const nilaiC = calculateNilaiC()
  const nilaiD = calculateNilaiD()

  const calculatePenalties = () => {
    const penalties = []
    if (formData.jumlah_alpa === 1) penalties.push("Alpa 1x: -10%")
    if (formData.jumlah_alpa >= 2) penalties.push("Alpa 2x+: -20%")
    if (formData.jumlah_sp1 >= 1) penalties.push("SP1: -10%")
    if (formData.jumlah_sp2 >= 1) penalties.push("SP2: -20%")
    if (formData.jumlah_sp3 >= 1) penalties.push("SP3: -50%")
    return penalties
  }

  const penalties = calculatePenalties()

  const getGrade = (score: number) => {
    if (score >= 9.01) return { grade: "Sangat Baik", color: "bg-green-600" }
    if (score >= 8.01) return { grade: "Baik", color: "bg-green-500" }
    if (score >= 6.01) return { grade: "Cukup", color: "bg-blue-500" }
    if (score >= 4.01) return { grade: "Kurang", color: "bg-yellow-500" }
    return { grade: "Buruk", color: "bg-red-500" }
  }

  const gradeInfo = getGrade(totalScore)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    setIsDrawing(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext("2d")
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext("2d")
    if (ctx) {
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.strokeStyle = "#000"
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  const saveSignature = () => {
    if (!canvasRef.current || !currentSignatureTarget) return
    const signatureData = canvasRef.current.toDataURL("image/png")
    setFormData({
      ...formData,
      signatures: {
        ...formData.signatures,
        [currentSignatureTarget]: {
          ...formData.signatures[currentSignatureTarget as keyof typeof formData.signatures],
          data: signatureData,
        },
      },
    })
    setShowSignatureModal(false)
    clearSignature()
  }

  const openSignatureModal = (target: string) => {
    setCurrentSignatureTarget(target)
    setShowSignatureModal(true)
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth
        canvasRef.current.height = 200
      }
    }, 100)
  }

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 8
      let yPos = margin

      // Header
      doc.setFontSize(14)
      doc.setFont(undefined, "bold")
      doc.text("FORMULIR PENILAIAN KINERJA KARYAWAN", pageWidth / 2, yPos, { align: "center" })
      yPos += 4

      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.text("PT. SARANA SUKSES SEJAHTERA", pageWidth / 2, yPos, { align: "center" })
      yPos += 6

      // Employee Info Table
      doc.setFont(undefined, "bold")
      doc.setFontSize(9)
      doc.text("DATA KARYAWAN", margin, yPos)
      yPos += 4

      doc.setFont(undefined, "normal")
      doc.setFontSize(8)
      const infoRows = [
        [`Nama: ${formData.nama}`, `Departemen: ${formData.departemen}`, `NRP: ${formData.nik}`],
        [
          `Awal Masuk: ${formData.tgl_masuk}`,
          `Jabatan: ${formData.jabatan}`,
          `Usulan Jabatan: ${formData.status_karyawan}`,
        ],
      ]

      infoRows.forEach((row) => {
        doc.text(row[0], margin, yPos)
        doc.text(row[1], pageWidth / 2 - 20, yPos)
        doc.text(row[2], pageWidth - margin - 30, yPos)
        yPos += 3
      })

      yPos += 2

      // Evaluation Table
      doc.setFont(undefined, "bold")
      doc.setFontSize(9)
      doc.text("EVALUASI DIMENSI KINERJA", margin, yPos)
      yPos += 3

      doc.setFont(undefined, "normal")
      doc.setFontSize(7)

      const tableData: string[][] = []
      tableData.push(["Dimensi Evaluasi", "Bobot", "Rating", "Nilai"])

      // Add Kepribadian items
      formData.kepribadian.forEach((item) => {
        tableData.push([
          item.name,
          item.weight.toString(),
          item.score.toString(),
          (item.score * item.weight).toFixed(3),
        ])
      })

      // Add Prestasi items
      formData.prestasi.forEach((item) => {
        tableData.push([
          item.name,
          item.weight.toString(),
          item.score.toString(),
          (item.score * item.weight).toFixed(3),
        ])
      })

      // Calculate table dimensions
      const colWidths = [60, 20, 20, 20]
      const rowHeight = 3
      const tableWidth = colWidths.reduce((a, b) => a + b, 0)
      const startX = margin
      let tableY = yPos

      // Draw table header
      doc.setFillColor(200, 200, 200)
      let xPos = startX
      tableData[0].forEach((cell, idx) => {
        doc.rect(xPos, tableY, colWidths[idx], rowHeight, "F")
        doc.text(cell, xPos + 1, tableY + 2)
        xPos += colWidths[idx]
      })
      tableY += rowHeight

      // Draw table rows
      doc.setFillColor(255, 255, 255)
      tableData.slice(1).forEach((row) => {
        xPos = startX
        row.forEach((cell, idx) => {
          doc.rect(xPos, tableY, colWidths[idx], rowHeight)
          doc.text(cell, xPos + 1, tableY + 2)
          xPos += colWidths[idx]
        })
        tableY += rowHeight
      })

      yPos = tableY + 2

      // Total Score with new grading scale
      doc.setFont(undefined, "bold")
      doc.setFontSize(9)
      doc.text(`SCORE AKHIR: ${totalScore.toFixed(2)} (${gradeInfo.grade})`, margin, yPos)
      yPos += 5

      // Penalties
      if (penalties.length > 0) {
        doc.setFont(undefined, "bold")
        doc.setFontSize(8)
        doc.text("PENALTI", margin, yPos)
        yPos += 3

        doc.setFont(undefined, "normal")
        doc.setFontSize(7)
        penalties.forEach((penalty) => {
          doc.text(penalty, margin, yPos)
          yPos += 2
        })
      }

      // Strengths and Weaknesses
      if (formData.kelebihan || formData.kekurangan) {
        doc.setFont(undefined, "bold")
        doc.setFontSize(8)
        doc.text("KELEBIHAN & KEKURANGAN", margin, yPos)
        yPos += 3

        doc.setFont(undefined, "normal")
        doc.setFontSize(7)
        if (formData.kelebihan) {
          doc.text("Kelebihan:", margin, yPos)
          yPos += 2
          const strengthsLines = doc.splitTextToSize(formData.kelebihan, pageWidth - 2 * margin)
          doc.text(strengthsLines, margin + 2, yPos)
          yPos += strengthsLines.length * 2 + 1
        }

        if (formData.kekurangan) {
          doc.text("Kekurangan:", margin, yPos)
          yPos += 2
          const weaknessesLines = doc.splitTextToSize(formData.kekurangan, pageWidth - 2 * margin)
          doc.text(weaknessesLines, margin + 2, yPos)
          yPos += weaknessesLines.length * 2
        }
      }

      doc.save(`Assessment_${formData.nama}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error exporting PDF:", error)
      alert("Gagal export PDF")
    }
  }

  const handleSaveDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("assessmentDrafts") || "[]")
    const newDraft = {
      ...formData,
      id: `draft_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "draft",
    }
    drafts.push(newDraft)
    localStorage.setItem("assessmentDrafts", JSON.stringify(drafts))
    alert("Draft tersimpan!")
  }

  return (
    <div className="space-y-6 bg-white rounded-lg p-6">
      {/* Data Karyawan Section */}
      <Card>
        <CardHeader>
          <CardTitle>1. DATA KARYAWAN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="nik">NIK Karyawan</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => handleNikChange(e.target.value)}
                placeholder="Masukkan NIK atau cari..."
              />
            </div>
            <div>
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => handleNamaChange(e.target.value)}
                placeholder="Masukkan Nama atau cari..."
              />
            </div>
            <div>
              <Label htmlFor="jabatan">Jabatan</Label>
              <Input
                id="jabatan"
                value={formData.jabatan}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                placeholder="Otomatis terisi"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="tgl_masuk">Tanggal Masuk Kerja</Label>
              <Input
                id="tgl_masuk"
                type="date"
                value={formData.tgl_masuk}
                onChange={(e) => setFormData({ ...formData, tgl_masuk: e.target.value })}
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="departemen">Departemen</Label>
              <Input
                id="departemen"
                value={formData.departemen}
                onChange={(e) => setFormData({ ...formData, departemen: e.target.value })}
                placeholder="Otomatis terisi"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                placeholder="Otomatis terisi"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="status">Status Karyawan</Label>
              <Input
                id="status"
                value={formData.status_karyawan}
                onChange={(e) => setFormData({ ...formData, status_karyawan: e.target.value })}
                placeholder="Otomatis terisi"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="periode">Periode Penilaian</Label>
              <Input
                id="periode"
                value={formData.periode_penilaian}
                onChange={(e) => setFormData({ ...formData, periode_penilaian: e.target.value })}
                placeholder="Contoh: 01/01/2024 - 30/06/2024"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Penilaian Section */}
      <Card>
        <CardHeader>
          <CardTitle>2. INFORMASI SYSTEM PENILAIAN</CardTitle>
          <CardDescription>
            Keterangan Penilaian A & B: Score 1 - 10 (1 = Jelek sekali, 10 = Bagus sekali)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Kepribadian */}
          <div>
            <h3 className="font-bold mb-3">A. Kepribadian (Bobot Item: 0.075)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">No.</th>
                    <th className="border p-2 text-left">Kriteria Penilaian</th>
                    <th className="border p-2 text-center">Bobot (D)</th>
                    <th className="border p-2 text-center">Score 1-10 (E)</th>
                    <th className="border p-2 text-center">Nilai (F=E*D)</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.kepribadian.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border p-2">{item.id}</td>
                      <td className="border p-2">{item.name}</td>
                      <td className="border p-2 text-center">{item.weight}</td>
                      <td className="border p-2 text-center">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={item.score}
                          onChange={(e) => {
                            const newKepribadian = [...formData.kepribadian]
                            newKepribadian[idx] = { ...item, score: Number.parseInt(e.target.value) || 0 }
                            setFormData({ ...formData, kepribadian: newKepribadian })
                          }}
                          className="w-16 text-center"
                        />
                      </td>
                      <td className="border p-2 text-center font-bold">{(item.score * item.weight).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prestasi */}
          <div>
            <h3 className="font-bold mb-3">B. Prestasi & Hasil Kerja (Bobot Item: 0.03)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">No.</th>
                    <th className="border p-2 text-left">Kriteria Penilaian</th>
                    <th className="border p-2 text-center">Bobot (D)</th>
                    <th className="border p-2 text-center">Score 1-10 (E)</th>
                    <th className="border p-2 text-center">Nilai (F=E*D)</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.prestasi.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border p-2">{item.id}</td>
                      <td className="border p-2">{item.name}</td>
                      <td className="border p-2 text-center">{item.weight}</td>
                      <td className="border p-2 text-center">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={item.score}
                          onChange={(e) => {
                            const newPrestasi = [...formData.prestasi]
                            newPrestasi[idx] = { ...item, score: Number.parseInt(e.target.value) || 0 }
                            setFormData({ ...formData, prestasi: newPrestasi })
                          }}
                          className="w-16 text-center"
                        />
                      </td>
                      <td className="border p-2 text-center font-bold">{(item.score * item.weight).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="border p-2 text-right">
                      SUB TOTAL (A+B)
                    </td>
                    <td className="border p-2 text-center">
                      {(
                        formData.kepribadian.reduce((sum, item) => sum + item.score * item.weight, 0) +
                        formData.prestasi.reduce((sum, item) => sum + item.score * item.weight, 0)
                      ).toFixed(3)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Kehadiran */}
          <div>
            <h3 className="font-bold mb-3">C. Kehadiran (Sakit, Izin, Alpa - ATR)</h3>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <Label>Sakit (hari)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_sakit}
                  onChange={(e) => setFormData({ ...formData, jumlah_sakit: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Izin (hari)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_izin}
                  onChange={(e) => setFormData({ ...formData, jumlah_izin: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Alpa (hari)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_alpa}
                  onChange={(e) => setFormData({ ...formData, jumlah_alpa: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nilai Kehadiran (F): {nilaiC.toFixed(2)} (Total Hari:{" "}
                {formData.jumlah_sakit + formData.jumlah_izin + formData.jumlah_alpa})
              </AlertDescription>
            </Alert>
          </div>

          {/* Indisipliner */}
          <div>
            <h3 className="font-bold mb-3">D. Indisipliner (SP)</h3>
            <div className="grid grid-cols-4 gap-4 mb-3">
              <div>
                <Label>SP 1</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_sp1}
                  onChange={(e) => setFormData({ ...formData, jumlah_sp1: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>SP 2</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_sp2}
                  onChange={(e) => setFormData({ ...formData, jumlah_sp2: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>SP 3</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_sp3}
                  onChange={(e) => setFormData({ ...formData, jumlah_sp3: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nilai Indisipliner (F): {nilaiD.toFixed(2)} (Total SP:{" "}
                {formData.jumlah_sp1 + formData.jumlah_sp2 + formData.jumlah_sp3})
              </AlertDescription>
            </Alert>
          </div>

          {/* Penalties Display Section */}
          {penalties.length > 0 && (
            <Card className="border-yellow-500 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Penalti yang Diterapkan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {penalties.map((penalty, idx) => (
                    <p key={idx} className="text-yellow-800 font-semibold">
                      • {penalty}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Kelebihan & Kekurangan */}
      <Card>
        <CardHeader>
          <CardTitle>Kelebihan dan Kekurangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="kelebihan">Kelebihan Karyawan</Label>
            <Textarea
              id="kelebihan"
              value={formData.kelebihan}
              onChange={(e) => setFormData({ ...formData, kelebihan: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="kekurangan">Kekurangan Karyawan</Label>
            <Textarea
              id="kekurangan"
              value={formData.kekurangan}
              onChange={(e) => setFormData({ ...formData, kekurangan: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Score Akhir */}
      <Card className={`${gradeInfo.color} text-white`}>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">SCORE AKHIR (Skala 10.00)</p>
              <p className="text-4xl font-bold">{totalScore.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">NILAI</p>
              <p className="text-3xl font-bold">{gradeInfo.grade}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rekomendasi */}
      <Card>
        <CardHeader>
          <CardTitle>3. HASIL REKOMENDASI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="perpanjangan"
              checked={formData.rekomendasi.perpanjangan_kontrak}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  rekomendasi: { ...formData.rekomendasi, perpanjangan_kontrak: checked as boolean },
                })
              }
            />
            <Label htmlFor="perpanjangan" className="flex-1">
              Perpanjangan Kontrak (di angka:
            </Label>
            <Input
              type="number"
              min="1"
              value={formData.rekomendasi.perpanjangan_bulan}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rekomendasi: { ...formData.rekomendasi, perpanjangan_bulan: Number.parseInt(e.target.value) || 12 },
                })
              }
              className="w-20"
            />
            <span>Bulan)</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="pengangkatan"
              checked={formData.rekomendasi.pengangkatan_tetap}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  rekomendasi: { ...formData.rekomendasi, pengangkatan_tetap: checked as boolean },
                })
              }
            />
            <Label htmlFor="pengangkatan">Pengangkatan Karyawan Tetap</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="promosi"
              checked={formData.rekomendasi.promosi}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  rekomendasi: { ...formData.rekomendasi, promosi: checked as boolean },
                })
              }
            />
            <Label htmlFor="promosi">Promosi Jabatan</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="gaji"
              checked={formData.rekomendasi.perubahan_gaji}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  rekomendasi: { ...formData.rekomendasi, perubahan_gaji: checked as boolean },
                })
              }
            />
            <Label htmlFor="gaji">Perubahan Gaji</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="end"
              checked={formData.rekomendasi.end_kontrak}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  rekomendasi: { ...formData.rekomendasi, end_kontrak: checked as boolean },
                })
              }
            />
            <Label htmlFor="end">End Kontrak</Label>
          </div>
        </CardContent>
      </Card>

      {/* Validasi Section */}
      <Card>
        <CardHeader>
          <CardTitle>4. HALAMAN VALIDASI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { key: "user_site", label: "Dibuat Oleh (User Site)" },
              { key: "hr_site", label: "Diketahui (HR Site)" },
              { key: "pjo_site", label: "Disetujui (PJO Site)" },
              { key: "hr_ho", label: "Diterima (HR HO)" },
            ].map((sig) => (
              <div key={sig.key} className="border rounded-lg p-4">
                <p className="font-bold text-sm mb-2">{sig.label}</p>
                <div
                  className="border-2 border-dashed rounded p-2 mb-2 h-24 flex items-center justify-center bg-gray-50 cursor-pointer"
                  onClick={() => openSignatureModal(sig.key)}
                >
                  {formData.signatures[sig.key as keyof typeof formData.signatures].data ? (
                    <img
                      src={formData.signatures[sig.key as keyof typeof formData.signatures].data || "/placeholder.svg"}
                      alt="Signature"
                      className="max-h-full max-w-full"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs text-center">Klik untuk TTD</span>
                  )}
                </div>
                <Input
                  placeholder="Nama Lengkap"
                  value={formData.signatures[sig.key as keyof typeof formData.signatures].name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signatures: {
                        ...formData.signatures,
                        [sig.key]: {
                          ...formData.signatures[sig.key as keyof typeof formData.signatures],
                          name: e.target.value,
                        },
                      },
                    })
                  }
                  className="mb-2 text-xs"
                />
                <Input
                  placeholder="Jabatan"
                  value={formData.signatures[sig.key as keyof typeof formData.signatures].jabatan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signatures: {
                        ...formData.signatures,
                        [sig.key]: {
                          ...formData.signatures[sig.key as keyof typeof formData.signatures],
                          jabatan: e.target.value,
                        },
                      },
                    })
                  }
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleSaveDraft} variant="outline" className="flex-1 bg-transparent">
          <Save className="h-4 w-4 mr-2" />
          Simpan Draft
        </Button>
        <Button onClick={handleExportPDF} className="flex-1 bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" />
          Cetak / Ekspor ke PDF
        </Button>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Gambarkan Tanda Tangan Anda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full border-2 border-gray-300 rounded cursor-crosshair bg-white"
                height={200}
              />
              <div className="flex gap-2 justify-end">
                <Button onClick={clearSignature} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus TTD
                </Button>
                <Button onClick={saveSignature} className="bg-blue-600 hover:bg-blue-700">
                  Simpan TTD
                </Button>
                <Button onClick={() => setShowSignatureModal(false)} variant="outline">
                  Tutup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
