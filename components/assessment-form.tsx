"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertCircle, Save, Download, Send } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import jsPDF from "jspdf"
import { downloadPDF } from "@/lib/download-utils"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

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
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const [isSearchingEmployee, setIsSearchingEmployee] = useState(false)

  const handleNikChange = async (value: string) => {
    setFormData({ ...formData, nik: value })

    if (value.trim().length === 10) {
      setIsSearchingEmployee(true)
      try {
        const response = await fetch(`/api/users?nik=${encodeURIComponent(value.trim())}`)
        if (response.ok) {
          const users = await response.json()
          if (users && users.length > 0) {
            const employee = users[0]
            setFormData((prev) => ({
              ...prev,
              nik: employee.nik,
              nama: employee.nama,
              jabatan: employee.jabatan,
              departemen: employee.departemen,
              site: employee.site,
              status_karyawan: employee.statusKaryawan,
              tgl_masuk: employee.tanggalBergabung || employee.createdAt?.split("T")[0] || "",
            }))
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching employee by NIK:", error)
      } finally {
        setIsSearchingEmployee(false)
      }
    }
  }

  const handleNamaChange = async (value: string) => {
    setFormData({ ...formData, nama: value })

    if (value.trim() && value.length >= 3) {
      setIsSearchingEmployee(true)
      try {
        const response = await fetch("/api/users")
        if (response.ok) {
          const users = await response.json()
          const employee = users.find((user: any) => user.nama.toLowerCase().includes(value.toLowerCase()))
          if (employee) {
            setFormData((prev) => ({
              ...prev,
              nik: employee.nik,
              nama: employee.nama,
              jabatan: employee.jabatan,
              departemen: employee.departemen,
              site: employee.site,
              status_karyawan: employee.statusKaryawan,
              tgl_masuk: employee.tanggalBergabung || employee.createdAt?.split("T")[0] || "",
            }))
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching employee by name:", error)
      } finally {
        setIsSearchingEmployee(false)
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

    let penaltyPercentage = 0
    const isKontrak = formData.status_karyawan === "Kontrak"
    const isProbation = formData.status_karyawan === "Probation"

    // Sakit penalties for Kontrak
    if (isKontrak && formData.jumlah_sakit > 0) {
      // Each sick day = -3%
      penaltyPercentage += formData.jumlah_sakit * 3
    }

    // Sakit penalties for Probation
    if (isProbation && formData.jumlah_sakit > 0) {
      // Each sick day = -5%
      penaltyPercentage += formData.jumlah_sakit * 5
    }

    // Alpa penalties based on status
    if (isKontrak) {
      // Kontrak: 1x=-10%, 2x=-20%, 3x=-30%, 4x=-40%, 5x+=-50%
      if (formData.jumlah_alpa === 1) {
        penaltyPercentage += 10
      } else if (formData.jumlah_alpa === 2) {
        penaltyPercentage += 20
      } else if (formData.jumlah_alpa === 3) {
        penaltyPercentage += 30
      } else if (formData.jumlah_alpa === 4) {
        penaltyPercentage += 40
      } else if (formData.jumlah_alpa >= 5) {
        penaltyPercentage += 50
      }
    } else if (isProbation) {
      // Probation: 1x=-20%, 2x+=-30%
      if (formData.jumlah_alpa === 1) {
        penaltyPercentage += 20
      } else if (formData.jumlah_alpa >= 2) {
        penaltyPercentage += 30
      }
    }

    // SP penalties based on status
    if (isKontrak) {
      // Kontrak: SP1=-10%, SP2=-20% (total), SP3=-30% (total)
      if (formData.jumlah_sp1 >= 1) {
        penaltyPercentage += 10
      }
      if (formData.jumlah_sp2 >= 1) {
        penaltyPercentage += 10 // Additional 10% (total becomes 20%)
      }
      if (formData.jumlah_sp3 >= 1) {
        penaltyPercentage += 10 // Additional 10% (total becomes 30%)
      }
    } else if (isProbation) {
      // Probation: SP1=-20%, SP2=-30% (total), SP3=-70% (total)
      if (formData.jumlah_sp1 >= 1) {
        penaltyPercentage += 20
      }
      if (formData.jumlah_sp2 >= 1) {
        penaltyPercentage += 10 // Additional 10% (total becomes 30%)
      }
      if (formData.jumlah_sp3 >= 1) {
        penaltyPercentage += 40 // Additional 40% (total becomes 70%)
      }
    }

    // Apply penalty to scaled score
    const penaltyAmount = (scaledScore * penaltyPercentage) / 100
    scaledScore = Math.max(0, scaledScore - penaltyAmount)

    return scaledScore
  }

  const totalScore = calculateTotalScore()
  const nilaiC = calculateNilaiC()
  const nilaiD = calculateNilaiD()

  const calculatePenalties = () => {
    const penalties = []
    const isKontrak = formData.status_karyawan === "Kontrak"
    const isProbation = formData.status_karyawan === "Probation"

    if (isKontrak) {
      // Sakit penalties for Kontrak
      if (formData.jumlah_sakit > 0) {
        const sakitPenalty = formData.jumlah_sakit * 3
        penalties.push(`Sakit ${formData.jumlah_sakit}x: -${sakitPenalty}%`)
      }

      // Kontrak penalties
      if (formData.jumlah_alpa === 1) penalties.push("Alpa 1x: -10%")
      if (formData.jumlah_alpa === 2) penalties.push("Alpa 2x: -20%")
      if (formData.jumlah_alpa === 3) penalties.push("Alpa 3x: -30%")
      if (formData.jumlah_alpa === 4) penalties.push("Alpa 4x: -40%")
      if (formData.jumlah_alpa >= 5) penalties.push(`Alpa ${formData.jumlah_alpa}x: -50%`)

      if (formData.jumlah_sp1 >= 1) penalties.push("SP1: -10%")
      if (formData.jumlah_sp2 >= 1) penalties.push("SP2: -20% (total)")
      if (formData.jumlah_sp3 >= 1) penalties.push("SP3: -30% (total)")
    } else if (isProbation) {
      // Sakit penalties for Probation
      if (formData.jumlah_sakit > 0) {
        const sakitPenalty = formData.jumlah_sakit * 5
        penalties.push(`Sakit ${formData.jumlah_sakit}x: -${sakitPenalty}%`)
      }

      // Probation penalties
      if (formData.jumlah_alpa === 1) penalties.push("Alpa 1x: -20%")
      if (formData.jumlah_alpa >= 2) penalties.push(`Alpa ${formData.jumlah_alpa}x: -30%`)

      if (formData.jumlah_sp1 >= 1) penalties.push("SP1: -20%")
      if (formData.jumlah_sp2 >= 1) penalties.push("SP2: -30% (total)")
      if (formData.jumlah_sp3 >= 1) penalties.push("SP3: -70% (total)")
    }

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

  const handleExportPDF = async () => {
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

      const pdfOutput = doc.output("dataurlstring")
      await downloadPDF(pdfOutput, `Assessment_${formData.nama}_${new Date().toISOString().split("T")[0]}.pdf`)
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

  const handleSubmitAssessment = async () => {
    if (!user) {
      alert("Anda harus login terlebih dahulu")
      return
    }

    if (!formData.nik || !formData.nama) {
      alert("Mohon lengkapi data karyawan terlebih dahulu")
      return
    }

    if (!formData.periode_penilaian) {
      alert("Mohon isi periode penilaian")
      return
    }

    // Validate that at least some scores are filled
    const hasKepribadianScores = formData.kepribadian.some((item) => item.score > 0)
    const hasPrestasiScores = formData.prestasi.some((item) => item.score > 0)

    if (!hasKepribadianScores || !hasPrestasiScores) {
      alert("Mohon isi minimal satu score untuk Kepribadian dan Prestasi")
      return
    }

    setIsSubmitting(true)

    try {
      const assessmentData = {
        employeeNik: formData.nik,
        employeeName: formData.nama,
        employeeJabatan: formData.jabatan,
        employeeDepartemen: formData.departemen,
        employeeSite: formData.site,
        employeeTanggalMasuk: formData.tgl_masuk,
        employeeStatus: formData.status_karyawan,
        assessmentPeriod: formData.periode_penilaian,
        kepribadian: formData.kepribadian.map((item) => ({
          id: item.id,
          name: item.name,
          weight: item.weight,
          score: item.score,
          calculatedScore: item.score * item.weight,
        })),
        prestasi: formData.prestasi.map((item) => ({
          id: item.id,
          name: item.name,
          weight: item.weight,
          score: item.score,
          calculatedScore: item.score * item.weight,
        })),
        kehadiran: {
          sakit: formData.jumlah_sakit,
          izin: formData.jumlah_izin,
          alpa: formData.jumlah_alpa,
          score: nilaiC,
        },
        indisipliner: {
          teguran: 0,
          sp1: formData.jumlah_sp1,
          sp2: formData.jumlah_sp2,
          sp3: formData.jumlah_sp3,
          score: nilaiD,
        },
        totalScore: totalScore,
        grade: gradeInfo.grade,
        penalties: {
          sakit: formData.jumlah_sakit,
          alpa: formData.jumlah_alpa,
          sp1: formData.jumlah_sp1,
          sp2: formData.jumlah_sp2,
          sp3: formData.jumlah_sp3,
        },
        strengths: formData.kelebihan,
        weaknesses: formData.kekurangan,
        recommendations: [
          {
            type: "perpanjangan_kontrak",
            selected: formData.rekomendasi.perpanjangan_kontrak,
            months: formData.rekomendasi.perpanjangan_bulan,
          },
          {
            type: "pengangkatan_tetap",
            selected: formData.rekomendasi.pengangkatan_tetap,
          },
          {
            type: "promosi",
            selected: formData.rekomendasi.promosi,
          },
          {
            type: "perubahan_gaji",
            selected: formData.rekomendasi.perubahan_gaji,
          },
          {
            type: "end_kontrak",
            selected: formData.rekomendasi.end_kontrak,
          },
        ],
        status: "pending_pjo",
        createdByNik: user.nik,
        createdByName: user.nama,
        createdByRole: user.role,
      }

      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentData),
      })

      if (!response.ok) {
        throw new Error("Gagal menyimpan assessment")
      }

      const result = await response.json()
      alert("Assessment berhasil disubmit untuk approval PJO!")

      // Redirect to DIC dashboard
      router.push("/dashboard/dic")
    } catch (error) {
      console.error("[v0] Error submitting assessment:", error)
      alert("Gagal menyimpan assessment. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 bg-white rounded-lg p-4 md:p-6">
      {/* Data Karyawan Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">1. DATA KARYAWAN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label htmlFor="nik" className="text-sm">
                NIK Karyawan
              </Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => handleNikChange(e.target.value)}
                placeholder="Masukkan NIK (10 digit)"
                disabled={isSearchingEmployee}
                className="text-sm"
              />
              {isSearchingEmployee && <p className="text-xs text-blue-500 mt-1">Mencari data karyawan...</p>}
            </div>

            {formData.nama && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 bg-slate-50 rounded-lg border-2 border-primary/20">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs text-slate-600">Nama</Label>
                  <p className="text-sm font-medium">{formData.nama}</p>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs text-slate-600">Jabatan</Label>
                  <p className="text-sm font-medium">{formData.jabatan}</p>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs text-slate-600">Departemen</Label>
                  <p className="text-sm font-medium">{formData.departemen}</p>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs text-slate-600">Site / Lokasi Kerja</Label>
                  <p className="text-sm font-medium">{formData.site}</p>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs text-slate-600">Status Karyawan</Label>
                  <p className="text-sm font-medium">{formData.status_karyawan}</p>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs text-slate-600">Tanggal Masuk</Label>
                  <p className="text-sm font-medium">
                    {formData.tgl_masuk
                      ? new Date(formData.tgl_masuk).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="periode" className="text-sm">
                Periode Penilaian
              </Label>
              <Input
                id="periode"
                value={formData.periode_penilaian}
                onChange={(e) => setFormData({ ...formData, periode_penilaian: e.target.value })}
                placeholder="Contoh: 01/01/2024 - 30/06/2024"
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Penilaian Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">2. INFORMASI SYSTEM PENILAIAN</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Keterangan Penilaian A & B: Score 1 - 10 (1 = Jelek sekali, 10 = Bagus sekali)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* Kepribadian */}
          <div>
            <h3 className="font-bold mb-3 text-sm md:text-base">A. Kepribadian (Bobot Item: 0.075)</h3>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <table className="w-full border-collapse text-xs md:text-sm min-w-[600px]">
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
                          value={item.score === 0 ? "" : item.score}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            let score = 0

                            if (inputValue === "" || inputValue === null) {
                              score = 0
                            } else {
                              const numValue = Number.parseInt(inputValue)
                              if (numValue > 10) {
                                score = 10
                              } else if (numValue < 1) {
                                score = 1
                              } else {
                                score = numValue
                              }
                            }

                            const newKepribadian = [...formData.kepribadian]
                            newKepribadian[idx] = { ...item, score }
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
            <h3 className="font-bold mb-3 text-sm md:text-base">B. Prestasi & Hasil Kerja (Bobot Item: 0.03)</h3>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <table className="w-full border-collapse text-xs md:text-sm min-w-[600px]">
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
                          value={item.score === 0 ? "" : item.score}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            let score = 0

                            if (inputValue === "" || inputValue === null) {
                              score = 0
                            } else {
                              const numValue = Number.parseInt(inputValue)
                              if (numValue > 10) {
                                score = 10
                              } else if (numValue < 1) {
                                score = 1
                              } else {
                                score = numValue
                              }
                            }

                            const newPrestasi = [...formData.prestasi]
                            newPrestasi[idx] = { ...item, score }
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
            <h3 className="font-bold mb-3 text-sm md:text-base">C. Kehadiran (Sakit, Izin, Alpa - ATR)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-3">
              <div>
                <Label className="text-sm">Sakit (hari)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_sakit}
                  onChange={(e) => setFormData({ ...formData, jumlah_sakit: Number.parseInt(e.target.value) || 0 })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">Izin (hari)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_izin}
                  onChange={(e) => setFormData({ ...formData, jumlah_izin: Number.parseInt(e.target.value) || 0 })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">Alpa (hari)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_alpa}
                  onChange={(e) => setFormData({ ...formData, jumlah_alpa: Number.parseInt(e.target.value) || 0 })}
                  className="text-sm"
                />
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs md:text-sm">
                Nilai Kehadiran (F): {nilaiC.toFixed(2)} (Total Hari:{" "}
                {formData.jumlah_sakit + formData.jumlah_izin + formData.jumlah_alpa})
              </AlertDescription>
            </Alert>
          </div>

          {/* Indisipliner */}
          <div>
            <h3 className="font-bold mb-3 text-sm md:text-base">D. Indisipliner (SP)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-3">
              <div>
                <Label className="text-sm">SP 1</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_sp1}
                  onChange={(e) => setFormData({ ...formData, jumlah_sp1: Number.parseInt(e.target.value) || 0 })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">SP 2</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_sp2}
                  onChange={(e) => setFormData({ ...formData, jumlah_sp2: Number.parseInt(e.target.value) || 0 })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">SP 3</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.jumlah_sp3}
                  onChange={(e) => setFormData({ ...formData, jumlah_sp3: Number.parseInt(e.target.value) || 0 })}
                  className="text-sm"
                />
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs md:text-sm">
                Nilai Indisipliner (F): {nilaiD.toFixed(2)} (Total SP:{" "}
                {formData.jumlah_sp1 + formData.jumlah_sp2 + formData.jumlah_sp3})
              </AlertDescription>
            </Alert>
          </div>

          {/* Penalties Display Section */}
          {penalties.length > 0 && (
            <Card className="border-yellow-500 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-800 text-sm md:text-base">Penalti yang Diterapkan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {penalties.map((penalty, idx) => (
                    <p key={idx} className="text-yellow-800 font-semibold text-xs md:text-sm">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Kelebihan dan Kekurangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div>
            <Label htmlFor="kelebihan" className="text-sm">
              Kelebihan Karyawan
            </Label>
            <Textarea
              id="kelebihan"
              value={formData.kelebihan}
              onChange={(e) => setFormData({ ...formData, kelebihan: e.target.value })}
              rows={3}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="kekurangan" className="text-sm">
              Kekurangan Karyawan
            </Label>
            <Textarea
              id="kekurangan"
              value={formData.kekurangan}
              onChange={(e) => setFormData({ ...formData, kekurangan: e.target.value })}
              rows={3}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Score Akhir */}
      <Card className={`${gradeInfo.color} text-white`}>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <p className="text-xs md:text-sm opacity-90">SCORE AKHIR (Skala 10.00)</p>
              <p className="text-3xl md:text-4xl font-bold">{totalScore.toFixed(2)}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs md:text-sm opacity-90">NILAI</p>
              <p className="text-2xl md:text-3xl font-bold">{gradeInfo.grade}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rekomendasi */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">3. HASIL REKOMENDASI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
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
            <Label htmlFor="perpanjangan" className="flex-1 text-sm">
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
              className="w-16 md:w-20 text-sm"
            />
            <span className="text-sm">Bulan)</span>
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
            <Label htmlFor="pengangkatan" className="text-sm">
              Pengangkatan Karyawan Tetap
            </Label>
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
            <Label htmlFor="promosi" className="text-sm">
              Promosi Jabatan
            </Label>
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
            <Label htmlFor="gaji" className="text-sm">
              Perubahan Gaji
            </Label>
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
            <Label htmlFor="end" className="text-sm">
              End Kontrak
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <Button onClick={handleSaveDraft} variant="outline" className="flex-1 bg-transparent text-sm md:text-base">
          <Save className="h-4 w-4 mr-2" />
          Simpan Draft
        </Button>
        <Button onClick={handleExportPDF} variant="outline" className="flex-1 bg-transparent text-sm md:text-base">
          <Download className="h-4 w-4 mr-2" />
          Cetak / Ekspor ke PDF
        </Button>
        <Button
          onClick={handleSubmitAssessment}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm md:text-base"
          disabled={isSubmitting}
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? "Mengirim..." : "Submit untuk Approval"}
        </Button>
      </div>
    </div>
  )
}
