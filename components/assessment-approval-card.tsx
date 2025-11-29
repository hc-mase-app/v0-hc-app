"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { EmployeeAssessment } from "@/lib/types"
import { CheckCircle, XCircle, ChevronDown, ChevronUp, User, Clock, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

interface AssessmentApprovalCardProps {
  assessment: EmployeeAssessment
  onApprove?: () => void
  onReject?: () => void
  readOnly?: boolean
}

export function AssessmentApprovalCard({
  assessment,
  onApprove,
  onReject,
  readOnly = false,
}: AssessmentApprovalCardProps) {
  const { user } = useAuth()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [showDetails, setShowDetails] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleApprove = async () => {
    if (!user || !notes.trim()) {
      setError("Catatan harus diisi")
      return
    }

    setError("")
    setIsApproving(true)

    try {
      const response = await fetch(`/api/assessments/${assessment.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approverUserId: user.nik,
          approverName: user.nama,
          approverRole: user.role,
          notes: notes,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || "Gagal menyetujui assessment")
        return
      }

      setNotes("")
      onApprove?.()
    } catch (error) {
      setError("Gagal menyetujui assessment")
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!user || !notes.trim()) {
      setError("Catatan penolakan harus diisi")
      return
    }

    setError("")
    setIsRejecting(true)

    try {
      const response = await fetch(`/api/assessments/${assessment.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approverUserId: user.nik,
          approverName: user.nama,
          approverRole: user.role,
          notes: notes,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || "Gagal menolak assessment")
        return
      }

      setNotes("")
      onReject?.()
    } catch (error) {
      setError("Gagal menolak assessment")
    } finally {
      setIsRejecting(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      const ensureNumber = (value: any, fallback = 0): number => {
        const num = Number(value)
        return Number.isFinite(num) ? num : fallback
      }

      const pageWidth = ensureNumber(doc.internal.pageSize.getWidth(), 210)
      const pageHeight = ensureNumber(doc.internal.pageSize.getHeight(), 297)
      const margin = 12
      let yPos = margin

      // Header background
      doc.setFillColor(248, 250, 252)
      doc.rect(0, 0, pageWidth, 35, "F")

      // Company name
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("PT. SARANA SUKSES SEJAHTERA", pageWidth / 2, yPos, { align: "center" })
      yPos += 7

      // Form title
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(71, 85, 105)
      doc.text("FORMULIR PENILAIAN KINERJA KARYAWAN", pageWidth / 2, yPos, { align: "center" })
      yPos += 5
      doc.setFontSize(8)
      doc.text("(Assessment yang Telah Disetujui)", pageWidth / 2, yPos, { align: "center" })
      yPos += 6

      // Approved badge
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setFillColor(34, 197, 94)
      doc.rect(pageWidth / 2 - 20, yPos - 4, 40, 7, "F")
      doc.setTextColor(255, 255, 255)
      doc.text("APPROVED", pageWidth / 2, yPos, { align: "center" })
      doc.setTextColor(0, 0, 0)
      yPos += 10

      // Employee data section
      doc.setFillColor(241, 245, 249)
      doc.rect(margin, yPos, pageWidth - 2 * margin, 26, "F")

      yPos += 5
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("DATA KARYAWAN", margin + 3, yPos)
      yPos += 6

      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 65, 85)

      const tanggalMasukFormatted = assessment.employeeTanggalMasuk
        ? formatDateOnly(assessment.employeeTanggalMasuk)
        : "-"

      const leftCol = margin + 3
      const midCol = pageWidth / 2
      const rightCol = pageWidth / 2 + 3

      doc.text(`NIK: ${assessment.employeeNik || "-"}`, leftCol, yPos)
      doc.text(`Nama: ${assessment.employeeName || "-"}`, midCol, yPos)
      yPos += 4

      doc.text(`Jabatan: ${assessment.employeeJabatan || "-"}`, leftCol, yPos)
      doc.text(`Dept: ${assessment.employeeDepartemen || "-"}`, midCol, yPos)
      yPos += 4

      doc.text(`Site: ${assessment.employeeSite || "-"}`, leftCol, yPos)
      doc.text(`Status: ${assessment.employeeStatus || "-"}`, midCol, yPos)
      yPos += 4

      doc.text(`Tgl Masuk: ${tanggalMasukFormatted}`, leftCol, yPos)
      doc.text(`Periode: ${assessment.assessmentPeriod || "-"}`, midCol, yPos)
      yPos += 8

      // Assessment results section
      doc.setFillColor(239, 246, 255)
      doc.rect(margin, yPos, pageWidth - 2 * margin, 16, "F")

      yPos += 5
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("HASIL PENILAIAN", margin + 3, yPos)
      yPos += 6

      const boxWidth = (pageWidth - 2 * margin - 6) / 2

      // Total Score box
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(203, 213, 225)
      doc.rect(margin + 3, yPos - 4, boxWidth, 9, "FD")
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 116, 139)
      doc.text("Total Score", margin + 5, yPos)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      const scoreText = ensureNumber(assessment.totalScore, 0).toFixed(2)
      doc.text(scoreText, margin + boxWidth - 2, yPos + 1, { align: "right" })

      // Grade box
      doc.setFillColor(255, 255, 255)
      doc.rect(margin + boxWidth + 6, yPos - 4, boxWidth, 9, "FD")
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")

      const grade = assessment.grade || "N/A"
      if (grade === "Sangat Baik" || grade === "Baik") {
        doc.setTextColor(22, 163, 74)
      } else if (grade === "Cukup") {
        doc.setTextColor(59, 130, 246)
      } else if (grade === "Kurang") {
        doc.setTextColor(234, 179, 8)
      } else {
        doc.setTextColor(239, 68, 68)
      }
      doc.text(grade, margin + pageWidth - 2 * margin - 2, yPos + 1, { align: "right" })
      doc.setTextColor(0, 0, 0)
      yPos += 14

      // Assessment details header
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("RINCIAN PENILAIAN", margin, yPos)
      yPos += 5

      // Two column layout for assessment details
      const colWidth = (pageWidth - 2 * margin - 4) / 2
      const leftColX = margin
      const rightColX = margin + colWidth + 4
      let leftYPos = yPos
      let rightYPos = yPos

      // Left column: Kepribadian
      if (assessment.kepribadian && assessment.kepribadian.length > 0) {
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(71, 85, 105)
        doc.text("A. Kepribadian", leftColX + 2, leftYPos)
        leftYPos += 4

        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        assessment.kepribadian.forEach((item, idx) => {
          const itemName = item.name || `Kriteria ${item.id}`
          const wrappedText = doc.splitTextToSize(itemName, colWidth - 30)
          const lineHeight = 3.5
          const textHeight = wrappedText.length * lineHeight

          if (idx % 2 === 0) {
            doc.setFillColor(249, 250, 251)
            doc.rect(leftColX, leftYPos - 2.5, colWidth, textHeight, "F")
          }

          // Render wrapped text
          wrappedText.forEach((line: string, lineIdx: number) => {
            doc.text(line, leftColX + 2, leftYPos + lineIdx * lineHeight)
          })

          const score = `${ensureNumber(item.score, 0)}/10`
          const calculated = ensureNumber(item.calculatedScore, 0).toFixed(3)

          doc.text(score, leftColX + colWidth - 18, leftYPos)
          doc.setFont("helvetica", "bold")
          doc.text(calculated, leftColX + colWidth - 8, leftYPos)
          doc.setFont("helvetica", "normal")
          leftYPos += textHeight
        })
        leftYPos += 2
      }

      // Right column: Prestasi
      if (assessment.prestasi && assessment.prestasi.length > 0) {
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(71, 85, 105)
        doc.text("B. Prestasi & Hasil Kerja", rightColX + 2, rightYPos)
        rightYPos += 4

        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        assessment.prestasi.forEach((item, idx) => {
          const itemName = item.name || `Kriteria ${item.id}`
          const wrappedText = doc.splitTextToSize(itemName, colWidth - 30)
          const lineHeight = 3.5
          const textHeight = wrappedText.length * lineHeight

          if (idx % 2 === 0) {
            doc.setFillColor(249, 250, 251)
            doc.rect(rightColX, rightYPos - 2.5, colWidth, textHeight, "F")
          }

          // Render wrapped text
          wrappedText.forEach((line: string, lineIdx: number) => {
            doc.text(line, rightColX + 2, rightYPos + lineIdx * lineHeight)
          })

          const score = `${ensureNumber(item.score, 0)}/10`
          const calculated = ensureNumber(item.calculatedScore, 0).toFixed(3)

          doc.text(score, rightColX + colWidth - 18, rightYPos)
          doc.setFont("helvetica", "bold")
          doc.text(calculated, rightColX + colWidth - 8, rightYPos)
          doc.setFont("helvetica", "normal")
          rightYPos += textHeight
        })
        rightYPos += 2
      }

      yPos = Math.max(leftYPos, rightYPos) + 2

      if (assessment.recommendations && assessment.recommendations.length > 0) {
        const selectedRecs = assessment.recommendations.filter((rec) => rec.selected)
        if (selectedRecs.length > 0) {
          doc.setFillColor(254, 252, 232)
          doc.rect(margin, yPos, pageWidth - 2 * margin, 12, "F")

          yPos += 5
          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(15, 23, 42)
          doc.text("REKOMENDASI", margin + 3, yPos)
          yPos += 5

          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(22, 163, 74)

          const recTexts = selectedRecs.map((rec) => {
            if (rec.type === "perpanjangan_kontrak") {
              return `PERPANJANGAN KONTRAK (${rec.months || 0} BULAN)`
            } else if (rec.type === "pengangkatan_tetap") {
              return "PENGANGKATAN TETAP"
            } else if (rec.type === "promosi") {
              return "PROMOSI JABATAN"
            } else if (rec.type === "perubahan_gaji") {
              return "PERUBAHAN GAJI"
            } else if (rec.type === "end_kontrak") {
              return "END KONTRAK"
            }
            return ""
          })

          doc.text(recTexts.join(" | "), margin + 3, yPos)
          yPos += 8
        }
      }

      // Attendance and discipline section
      if (assessment.kehadiran || assessment.indisipliner) {
        const attendanceBoxWidth = (pageWidth - 2 * margin - 4) / 2

        // Left box: C. Kehadiran
        if (assessment.kehadiran) {
          doc.setDrawColor(203, 213, 225)
          doc.setFillColor(255, 255, 255)
          doc.rect(margin, yPos - 2, attendanceBoxWidth, 20, "FD")

          doc.setFontSize(8.5)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(71, 85, 105)
          doc.text("C. Kehadiran", margin + 2, yPos + 1)

          doc.setFontSize(8)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(51, 65, 85)

          const sakit = ensureNumber(assessment.kehadiran.sakit, 0)
          const izin = ensureNumber(assessment.kehadiran.izin, 0)
          const alpa = ensureNumber(assessment.kehadiran.alpa, 0)
          const kehadiranScore = ensureNumber(assessment.kehadiran.score, 0).toFixed(2)

          doc.text(`Sakit: ${sakit}`, margin + 2, yPos + 5.5)
          doc.text(`Izin: ${izin}`, margin + 2, yPos + 9.5)
          doc.text(`Alpa: ${alpa}`, margin + 2, yPos + 13.5)

          doc.setFont("helvetica", "bold")
          doc.setTextColor(15, 23, 42)
          doc.text(`Nilai: -${kehadiranScore}`, margin + 2, yPos + 17.5)
        }

        // Right box: D. Indisipliner
        if (assessment.indisipliner) {
          doc.setDrawColor(203, 213, 225)
          doc.setFillColor(255, 255, 255)
          doc.rect(margin + attendanceBoxWidth + 4, yPos - 2, attendanceBoxWidth, 20, "FD")

          doc.setFontSize(8.5)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(71, 85, 105)
          doc.text("D. Indisipliner", margin + attendanceBoxWidth + 6, yPos + 1)

          doc.setFontSize(8)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(51, 65, 85)

          const teguran = ensureNumber(assessment.indisipliner.teguran, 0)
          const sp1 = ensureNumber(assessment.indisipliner.sp1, 0)
          const sp2 = ensureNumber(assessment.indisipliner.sp2, 0)
          const sp3 = ensureNumber(assessment.indisipliner.sp3, 0)
          const indisiplinerScore = ensureNumber(assessment.indisipliner.score, 0).toFixed(2)

          doc.text(`Teguran: ${teguran}`, margin + attendanceBoxWidth + 6, yPos + 5.5)
          doc.text(`SP1: ${sp1}`, margin + attendanceBoxWidth + 6, yPos + 9.5)
          doc.text(`SP2: ${sp2}`, margin + attendanceBoxWidth + 6, yPos + 13.5)
          doc.text(`SP3: ${sp3}`, margin + attendanceBoxWidth + 50, yPos + 5.5)

          doc.setFont("helvetica", "bold")
          doc.setTextColor(15, 23, 42)
          doc.text(`Nilai: -${indisiplinerScore}`, margin + attendanceBoxWidth + 6, yPos + 17.5)
        }

        yPos += 24
      }

      doc.setFillColor(248, 250, 252)
      doc.rect(margin, yPos, pageWidth - 2 * margin, 2, "F")
      yPos += 5

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("RIWAYAT PERSETUJUAN", margin + 2, yPos)
      yPos += 6

      const circleRadius = 4
      const circleDiameter = circleRadius * 2
      const arrowLength = 50
      const totalTimelineWidth = circleDiameter * 3 + arrowLength * 2
      const startX = (pageWidth - totalTimelineWidth) / 2

      let stepX = startX + circleRadius

      // Step 1: Creator (DIC)
      doc.setFillColor(191, 219, 254)
      doc.setDrawColor(147, 197, 253)
      doc.circle(stepX, yPos + 4, circleRadius, "FD")

      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(30, 64, 175)
      doc.text("DIC", stepX, yPos + 4.5, { align: "center" })

      doc.setFontSize(8.5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(15, 23, 42)
      const creatorName = (assessment.createdByName || "-").substring(0, 18)
      doc.text(creatorName, stepX, yPos + 10, { align: "center" })

      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text("Membuat", stepX, yPos + 14, { align: "center" })
      doc.text(formatDateOnly(assessment.createdAt), stepX, yPos + 18, { align: "center" })

      // Arrow 1
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.5)
      doc.line(stepX + circleRadius + 1, yPos + 4, stepX + arrowLength + circleRadius - 1, yPos + 4)
      doc.triangle(
        stepX + arrowLength + circleRadius - 1,
        yPos + 4,
        stepX + arrowLength + circleRadius - 3,
        yPos + 2.5,
        stepX + arrowLength + circleRadius - 3,
        yPos + 5.5,
        "F",
      )

      // Step 2: PJO Site
      stepX += circleDiameter + arrowLength
      const pjoApproval = assessment.approvalHistory?.find((h) => h.approverRole === "pjo_site")

      if (pjoApproval) {
        if (pjoApproval.action === "approved") {
          doc.setFillColor(187, 247, 208)
          doc.setDrawColor(134, 239, 172)
        } else {
          doc.setFillColor(254, 202, 202)
          doc.setDrawColor(252, 165, 165)
        }
        doc.circle(stepX, yPos + 4, circleRadius, "FD")

        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(
          pjoApproval.action === "approved" ? 22 : 220,
          pjoApproval.action === "approved" ? 163 : 38,
          pjoApproval.action === "approved" ? 74 : 38,
        )
        doc.text("PJO", stepX, yPos + 4.5, { align: "center" })

        doc.setFontSize(8.5)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(15, 23, 42)
        const pjoName = (pjoApproval.approverName || "-").substring(0, 18)
        doc.text(pjoName, stepX, yPos + 10, { align: "center" })

        doc.setFontSize(7.5)
        doc.setTextColor(100, 116, 139)
        doc.text(pjoApproval.action === "approved" ? "Disetujui" : "Ditolak", stepX, yPos + 14, { align: "center" })
        doc.text(formatDateOnly(pjoApproval.timestamp || pjoApproval.createdAt), stepX, yPos + 18, { align: "center" })

        if (pjoApproval.notes) {
          doc.setFontSize(7)
          doc.setTextColor(71, 85, 105)
          const notes = `"${pjoApproval.notes.substring(0, 15)}"`
          doc.text(notes, stepX, yPos + 22, { align: "center" })
        }
      } else {
        doc.setFillColor(229, 231, 235)
        doc.setDrawColor(209, 213, 219)
        doc.circle(stepX, yPos + 4, circleRadius, "FD")

        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(156, 163, 175)
        doc.text("PJO", stepX, yPos + 4.5, { align: "center" })

        doc.setFontSize(8)
        doc.setTextColor(156, 163, 175)
        doc.text("Menunggu", stepX, yPos + 10, { align: "center" })
      }

      // Arrow 2
      doc.setDrawColor(203, 213, 225)
      doc.line(stepX + circleRadius + 1, yPos + 4, stepX + arrowLength + circleRadius - 1, yPos + 4)
      doc.triangle(
        stepX + arrowLength + circleRadius - 1,
        yPos + 4,
        stepX + arrowLength + circleRadius - 3,
        yPos + 2.5,
        stepX + arrowLength + circleRadius - 3,
        yPos + 5.5,
        "F",
      )

      // Step 3: HR Site
      stepX += circleDiameter + arrowLength
      const hrApproval = assessment.approvalHistory?.find((h) => h.approverRole === "hr_site")

      if (hrApproval) {
        if (hrApproval.action === "approved") {
          doc.setFillColor(187, 247, 208)
          doc.setDrawColor(134, 239, 172)
        } else {
          doc.setFillColor(254, 202, 202)
          doc.setDrawColor(252, 165, 165)
        }
        doc.circle(stepX, yPos + 4, circleRadius, "FD")

        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(
          hrApproval.action === "approved" ? 22 : 220,
          hrApproval.action === "approved" ? 163 : 38,
          hrApproval.action === "approved" ? 74 : 38,
        )
        doc.text("HR", stepX, yPos + 4.5, { align: "center" })

        doc.setFontSize(8.5)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(15, 23, 42)
        const hrName = (hrApproval.approverName || "-").substring(0, 18)
        doc.text(hrName, stepX, yPos + 10, { align: "center" })

        doc.setFontSize(7.5)
        doc.setTextColor(100, 116, 139)
        doc.text(hrApproval.action === "approved" ? "Diketahui" : "Ditolak", stepX, yPos + 14, { align: "center" })
        doc.text(formatDateOnly(hrApproval.timestamp || hrApproval.createdAt), stepX, yPos + 18, { align: "center" })

        if (hrApproval.notes) {
          doc.setFontSize(7)
          doc.setTextColor(71, 85, 105)
          const notes = `"${hrApproval.notes.substring(0, 15)}"`
          doc.text(notes, stepX, yPos + 22, { align: "center" })
        }
      } else {
        doc.setFillColor(229, 231, 235)
        doc.setDrawColor(209, 213, 219)
        doc.circle(stepX, yPos + 4, circleRadius, "FD")

        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(156, 163, 175)
        doc.text("HR", stepX, yPos + 4.5, { align: "center" })

        doc.setFontSize(8)
        doc.setTextColor(156, 163, 175)
        doc.text("Menunggu", stepX, yPos + 10, { align: "center" })
      }

      yPos += 28

      // Footer
      yPos = pageHeight - 8
      doc.setFontSize(6)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Generated: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`,
        pageWidth / 2,
        yPos,
        { align: "center" },
      )

      // Save PDF
      const filename = `Assessment_${(assessment.employeeName || "Unknown").replace(/\s+/g, "_")}_${assessment.employeeNik || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error("[v0] Error exporting PDF:", error)
      alert("Gagal export PDF. Silakan coba lagi.")
    } finally {
      setIsExportingPDF(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_pjo":
        return <Badge className="bg-yellow-500">Menunggu PJO</Badge>
      case "pending_hr_site":
        return <Badge className="bg-blue-500">Menunggu HR Site</Badge>
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-600">Rejected</Badge>
      default:
        return <Badge className="bg-slate-500">{status}</Badge>
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade === "Sangat Baik") return "text-green-600 font-bold"
    if (grade === "Baik") return "text-green-500 font-bold"
    if (grade === "Cukup") return "text-blue-500 font-bold"
    if (grade === "Kurang") return "text-yellow-500 font-bold"
    return "text-red-500 font-bold"
  }

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      dic: "DIC",
      pjo_site: "PJO Site",
      hr_site: "HR Site",
      hr_ho: "HR HO",
      super_admin: "Super Admin",
    }
    return roleMap[role] || role
  }

  const formatDateOnly = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  const getNoApprovalMessage = (status: string) => {
    const messages: Record<string, string> = {
      draft: "Assessment masih dalam tahap draft",
      pending_pjo: "Menunggu persetujuan dari PJO Site...",
      pending_hr_site: "Menunggu persetujuan dari HR Site...",
      approved: "Assessment telah disetujui",
      rejected: "Assessment telah ditolak",
    }
    return messages[status] || "Belum ada approval"
  }

  console.log("[v0] Assessment approval history:", assessment.approvalHistory)

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg text-slate-900">{assessment.employeeName}</h3>
            {getStatusBadge(assessment.status)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">NIK</p>
              <p className="font-medium text-slate-900">{assessment.employeeNik}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Jabatan</p>
              <p className="font-medium text-slate-900">{assessment.employeeJabatan}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Departemen</p>
              <p className="font-medium text-slate-900">{assessment.employeeDepartemen}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Site</p>
              <p className="font-medium text-slate-900">{assessment.employeeSite}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Periode Assessment</p>
              <p className="font-medium text-slate-900">{assessment.assessmentPeriod}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Score</p>
              <p className="text-xl font-bold text-slate-900">
                {typeof assessment.totalScore === "number"
                  ? assessment.totalScore.toFixed(2)
                  : Number.parseFloat(assessment.totalScore as any)?.toFixed(2) || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Grade</p>
              <p className={`text-xl ${getGradeColor(assessment.grade)}`}>{assessment.grade || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rekomendasi Section */}
      {assessment.recommendations && assessment.recommendations.length > 0 && (
        <div className="bg-green-50 p-3 rounded border border-green-200 space-y-2">
          <h4 className="font-semibold text-sm text-slate-900">Rekomendasi</h4>
          {assessment.recommendations.map(
            (rec, index) =>
              rec.selected && (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-slate-700">
                    {rec.type === "perpanjangan_kontrak" && `Perpanjangan Kontrak (${rec.months} bulan)`}
                    {rec.type === "pengangkatan_tetap" && "Pengangkatan Tetap"}
                    {rec.type === "promosi" && "Promosi Jabatan"}
                    {rec.type === "perubahan_gaji" && "Perubahan Gaji"}
                    {rec.type === "end_kontrak" && "End Kontrak"}
                  </span>
                </div>
              ),
          )}
        </div>
      )}

      {/* Horizontal Workflow Timeline */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
        <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Riwayat Assessment
        </h4>

        <div className="flex items-start justify-between gap-3 overflow-x-auto pb-2">
          {/* Step 1: Creator (DIC) */}
          <div className="flex flex-col items-center min-w-[140px]">
            <div className="bg-blue-100 p-3 rounded-full border-2 border-blue-300">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <Badge variant="outline" className="mt-2 text-xs bg-blue-50 border-blue-200">
              {getRoleDisplay(assessment.createdByRole)}
            </Badge>
            <p className="text-xs font-semibold text-slate-900 mt-2 text-center max-w-[130px] break-words">
              {assessment.createdByName}
            </p>
            <p className="text-xs text-slate-500 mt-1">Membuat</p>
            <p className="text-xs text-slate-400 mt-1 text-center">{formatDateOnly(assessment.createdAt)}</p>
          </div>

          {/* Arrow 1 */}
          <div className="flex-shrink-0 text-slate-400 text-2xl pt-6">→</div>

          {/* Step 2: PJO Site Approval */}
          <div className="flex flex-col items-center min-w-[140px]">
            {assessment.approvalHistory?.some((h) => h.approverRole === "pjo_site") ? (
              <>
                <div
                  className={`p-3 rounded-full border-2 ${
                    assessment.approvalHistory.find((h) => h.approverRole === "pjo_site")?.action === "approved"
                      ? "bg-green-100 border-green-300"
                      : "bg-red-100 border-red-300"
                  }`}
                >
                  {assessment.approvalHistory.find((h) => h.approverRole === "pjo_site")?.action === "approved" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`mt-2 text-xs ${
                    assessment.approvalHistory.find((h) => h.approverRole === "pjo_site")?.action === "approved"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  PJO Site
                </Badge>
                <p className="text-xs font-semibold text-slate-900 mt-2 text-center max-w-[130px] break-words">
                  {assessment.approvalHistory.find((h) => h.approverRole === "pjo_site")?.approverName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {assessment.approvalHistory.find((h) => h.approverRole === "pjo_site")?.action === "approved"
                    ? "Disetujui"
                    : "Ditolak"}
                </p>
                <p className="text-xs text-slate-400 mt-1 text-center">
                  {formatDateOnly(
                    assessment.approvalHistory.find((h) => h.approverRole === "pjo_site")?.timestamp || "",
                  )}
                </p>
                {assessment.approvalHistory.find((h) => h.approverRole === "pjo_site")?.notes && (
                  <p className="text-xs text-slate-600 italic mt-2 text-center max-w-[130px] break-words bg-white p-1.5 rounded border">
                    "{assessment.approvalHistory.find((h) => h.approverRole === "pjo_site")?.notes}"
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="bg-gray-100 p-3 rounded-full border-2 border-gray-300">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <Badge variant="outline" className="mt-2 text-xs bg-gray-50 border-gray-200">
                  PJO Site
                </Badge>
                <p className="text-xs text-slate-500 mt-2">Menunggu</p>
                <p className="text-xs text-slate-400 mt-1">-</p>
              </>
            )}
          </div>

          {/* Arrow 2 */}
          <div className="flex-shrink-0 text-slate-400 text-2xl pt-6">→</div>

          {/* Step 3: HR Site Approval */}
          <div className="flex flex-col items-center min-w-[140px]">
            {assessment.approvalHistory?.some((h) => h.approverRole === "hr_site") ? (
              <>
                <div
                  className={`p-3 rounded-full border-2 ${
                    assessment.approvalHistory.find((h) => h.approverRole === "hr_site")?.action === "approved"
                      ? "bg-green-100 border-green-300"
                      : "bg-red-100 border-red-300"
                  }`}
                >
                  {assessment.approvalHistory.find((h) => h.approverRole === "hr_site")?.action === "approved" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`mt-2 text-xs ${
                    assessment.approvalHistory.find((h) => h.approverRole === "hr_site")?.action === "approved"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  HR Site
                </Badge>
                <p className="text-xs font-semibold text-slate-900 mt-2 text-center max-w-[130px] break-words">
                  {assessment.approvalHistory.find((h) => h.approverRole === "hr_site")?.approverName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {assessment.approvalHistory.find((h) => h.approverRole === "hr_site")?.action === "approved"
                    ? "Diketahui"
                    : "Ditolak"}
                </p>
                <p className="text-xs text-slate-400 mt-1 text-center">
                  {formatDateOnly(
                    assessment.approvalHistory.find((h) => h.approverRole === "hr_site")?.timestamp || "",
                  )}
                </p>
                {assessment.approvalHistory.find((h) => h.approverRole === "hr_site")?.notes && (
                  <p className="text-xs text-slate-600 italic mt-2 text-center max-w-[130px] break-words bg-white p-1.5 rounded border">
                    "{assessment.approvalHistory.find((h) => h.approverRole === "hr_site")?.notes}"
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="bg-gray-100 p-3 rounded-full border-2 border-gray-300">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <Badge variant="outline" className="mt-2 text-xs bg-gray-50 border-gray-200">
                  HR Site
                </Badge>
                <p className="text-xs text-slate-500 mt-2">Menunggu</p>
                <p className="text-xs text-slate-400 mt-1">-</p>
              </>
            )}
          </div>
        </div>

        {/* Status Message */}
        {(!assessment.approvalHistory || assessment.approvalHistory.length === 0) && (
          <p className="text-xs text-slate-500 italic text-center pt-2 border-t border-slate-200">
            {getNoApprovalMessage(assessment.status)}
          </p>
        )}
      </div>

      {/* PDF Export Button */}
      {assessment.status === "approved" && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="w-full bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExportingPDF ? "Mengexport..." : "Export to PDF"}
          </Button>
        </div>
      )}

      {/* Toggle Details Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full bg-transparent"
      >
        {showDetails ? (
          <>
            <ChevronUp className="h-4 w-4 mr-2" />
            Sembunyikan Detail Penilaian
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            Lihat Detail Penilaian
          </>
        )}
      </Button>

      {/* Assessment Details */}
      {showDetails && (
        <Card className="bg-slate-50">
          <CardContent className="pt-4 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Section A: Kepribadian */}
              {assessment.kepribadian && assessment.kepribadian.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-slate-900">A. Kepribadian</h4>
                  <div className="space-y-2">
                    {assessment.kepribadian.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm bg-white p-2 rounded border"
                      >
                        <span className="text-slate-700">{item.name || `Kriteria ${item.id}`}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">Score: {item.score}/10</span>
                          <span className="font-medium text-slate-900">
                            {typeof item.calculatedScore === "number" ? item.calculatedScore.toFixed(3) : "0.000"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section B: Prestasi & Hasil Kerja */}
              {assessment.prestasi && assessment.prestasi.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-slate-900">B. Prestasi & Hasil Kerja</h4>
                  <div className="space-y-2">
                    {assessment.prestasi.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm bg-white p-2 rounded border"
                      >
                        <span className="text-slate-700">{item.name || `Kriteria ${item.id}`}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">Score: {item.score}/10</span>
                          <span className="font-medium text-slate-900">
                            {typeof item.calculatedScore === "number" ? item.calculatedScore.toFixed(3) : "0.000"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Section C: Kehadiran (ATR) */}
              {assessment.kehadiran && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-slate-900">C. Kehadiran (ATR)</h4>
                  <div className="bg-white p-3 rounded border space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Sakit</span>
                      <span className="font-medium">{assessment.kehadiran.sakit} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Izin</span>
                      <span className="font-medium">{assessment.kehadiran.izin} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Alpa</span>
                      <span className="font-medium">{assessment.kehadiran.alpa} hari</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-slate-900 font-semibold">Nilai Kehadiran</span>
                      <span className="font-bold text-slate-900">{assessment.kehadiran.score.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section D: Indisipliner (SP) */}
              {assessment.indisipliner && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-slate-900">D. Indisipliner (SP)</h4>
                  <div className="bg-white p-3 rounded border space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Teguran</span>
                      <span className="font-medium">{assessment.indisipliner.teguran}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">SP 1</span>
                      <span className="font-medium">{assessment.indisipliner.sp1}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">SP 2</span>
                      <span className="font-medium">{assessment.indisipliner.sp2}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">SP 3</span>
                      <span className="font-medium">{assessment.indisipliner.sp3}x</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-slate-900 font-semibold">Nilai Indisipliner</span>
                      <span className="font-bold text-slate-900">{assessment.indisipliner.score.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Penalties Applied */}
            {assessment.penalties && Object.keys(assessment.penalties).length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 text-slate-900">Penalti yang Diterapkan</h4>
                <div className="bg-red-50 p-3 rounded border border-red-200 space-y-1 text-sm">
                  {assessment.penalties.alpa && (
                    <div className="flex justify-between text-red-700">
                      <span>Penalti Alpa</span>
                      <span className="font-medium">-{assessment.penalties.alpa}%</span>
                    </div>
                  )}
                  {assessment.penalties.sakit && (
                    <div className="flex justify-between text-red-700">
                      <span>Penalti Sakit</span>
                      <span className="font-medium">-{assessment.penalties.sakit}%</span>
                    </div>
                  )}
                  {assessment.penalties.sp1 && (
                    <div className="flex justify-between text-red-700">
                      <span>Penalti SP1</span>
                      <span className="font-medium">-{assessment.penalties.sp1}%</span>
                    </div>
                  )}
                  {assessment.penalties.sp2 && (
                    <div className="flex justify-between text-red-700">
                      <span>Penalti SP2</span>
                      <span className="font-medium">-{assessment.penalties.sp2}%</span>
                    </div>
                  )}
                  {assessment.penalties.sp3 && (
                    <div className="flex justify-between text-red-700">
                      <span>Penalti SP3</span>
                      <span className="font-medium">-{assessment.penalties.sp3}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-4">
              {assessment.strengths && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-slate-900">Kelebihan</h4>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded border">{assessment.strengths}</p>
                </div>
              )}
              {assessment.weaknesses && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-slate-900">Kekurangan</h4>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded border">{assessment.weaknesses}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!readOnly && (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="space-y-2">
            <Label htmlFor={`notes-${assessment.id}`}>Catatan Persetujuan/Penolakan</Label>
            <Textarea
              id={`notes-${assessment.id}`}
              placeholder="Masukkan catatan Anda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isRejecting ? "Menolak..." : "Tolak"}
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isApproving || isRejecting} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              {isApproving ? "Menyetujui..." : "Setujui"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
