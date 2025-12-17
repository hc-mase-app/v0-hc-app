"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, X, Check, AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { bulkAddKaryawan } from "@/app/nrp-generator/actions"
import type { KaryawanInput } from "@/lib/nrp-types"
import * as XLSX from "xlsx"

interface ParsedRow extends KaryawanInput {
  rowNumber: number
  isValid: boolean
  errors: string[]
}

const VALID_ENTITAS = ["PT SSS", "PT GSM"]

function parseDDMMYYYYDate(dateStr: string): string {
  const parts = dateStr.split(/[/-]/)
  console.log("[v0] parseDDMMYYYYDate input:", dateStr, "parts:", parts)

  if (parts.length !== 3) {
    console.log("[v0] Invalid parts length")
    return ""
  }

  const [d, m, y] = parts
  const day = Number.parseInt(d, 10)
  const month = Number.parseInt(m, 10)
  let year = Number.parseInt(y, 10)

  // Validate day and month ranges
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    console.log("[v0] Invalid day/month:", { day, month })
    return ""
  }

  // Convert 2-digit year to 4-digit (e.g., 16 -> 2016, 25 -> 2025)
  if (year < 100) {
    year = year < 30 ? 2000 + year : 1900 + year
  }

  const result = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
  console.log("[v0] parseDDMMYYYYDate output:", result)
  return result
}

export function ExcelUpload({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function downloadTemplate() {
    const template = [
      {
        nrp: "(Opsional) atau kosongkan untuk auto-generate",
        nama_karyawan: "Contoh: Budi Santoso",
        jabatan: "Staff",
        level: "Admin",
        departemen: "HCGA",
        site: "HEAD OFFICE",
        entitas: "PT GSM",
        tanggal_masuk_kerja: "06/08/2016",
      },
      {
        nrp: "",
        nama_karyawan: "Contoh: Ani Wijaya",
        jabatan: "Manager",
        level: "Manager",
        departemen: "FINANCE",
        site: "HSM",
        entitas: "PT SSS",
        tanggal_masuk_kerja: "01/02/2025",
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")

    ws["!cols"] = [
      { wch: 35 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
    ]

    XLSX.writeFile(wb, "template-import-karyawan.xlsx")
  }

  function validateRow(row: Record<string, unknown>, rowNumber: number): ParsedRow {
    const errors: string[] = []

    const nrp = row.nrp ? String(row.nrp || "").trim() : ""

    const nama_karyawan = String(row.nama_karyawan || "").trim()
    const jabatan = String(row.jabatan || "").trim()
    const level = row.level ? String(row.level || "").trim() : undefined
    console.log("[v0] validateRow - level from CSV:", level, "raw value:", row.level)
    const departemen = String(row.departemen || "").trim()
    const site = String(row.site || "").trim()
    const entitas = String(row.entitas || "").trim()

    let tanggal_masuk_kerja = ""

    const tanggalValue = row.tanggal_masuk_kerja || row.tanggal_masuk
    console.log("[v0] validateRow - tanggalValue:", tanggalValue, "type:", typeof tanggalValue)

    if (tanggalValue) {
      if (typeof tanggalValue === "number") {
        const date = XLSX.SSF.parse_date_code(tanggalValue)
        tanggal_masuk_kerja = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`
        console.log("[v0] Parsed as numeric date:", tanggal_masuk_kerja)
      } else {
        const dateStr = String(tanggalValue).trim()
        console.log("[v0] Parsing string date:", dateStr)

        let parsed = parseDDMMYYYYDate(dateStr)

        // If DD/MM/YYYY parsing failed, try other formats
        if (!parsed) {
          console.log("[v0] DD/MM/YYYY parsing failed, trying alternatives")
          const dateObj = new Date(dateStr)
          if (!isNaN(dateObj.getTime())) {
            parsed = dateObj.toISOString().split("T")[0]
            console.log("[v0] Parsed with Date constructor:", parsed)
          } else {
            // Try flexible parsing of MM/DD/YYYY or DD/MM/YYYY
            const parts = dateStr.split(/[/-]/)
            if (parts.length === 3) {
              const [first, second, third] = parts.map((p) => p.trim())
              const firstNum = Number.parseInt(first, 10)
              const secondNum = Number.parseInt(second, 10)

              // If first > 12, it must be day (DD/MM/YYYY)
              if (firstNum > 12) {
                parsed = `${third}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`
                console.log("[v0] Parsed as DD/MM/YYYY:", parsed)
              } else if (secondNum > 12) {
                // If second > 12, it must be day (MM/DD/YYYY)
                parsed = `${third}-${first.padStart(2, "0")}-${second.padStart(2, "0")}`
                console.log("[v0] Parsed as MM/DD/YYYY:", parsed)
              } else {
                // Default to DD/MM/YYYY
                parsed = parseDDMMYYYYDate(dateStr)
                console.log("[v0] Default parsed as DD/MM/YYYY:", parsed)
              }
            }
          }
        }

        tanggal_masuk_kerja = parsed
      }
    }

    console.log("[v0] Final tanggal_masuk_kerja:", tanggal_masuk_kerja)

    if (!nama_karyawan) errors.push("Nama karyawan wajib diisi")
    if (!jabatan) errors.push("Jabatan wajib diisi")
    if (!departemen) errors.push("Departemen wajib diisi")
    if (!tanggal_masuk_kerja) errors.push("Tanggal masuk tidak valid")
    if (!site) errors.push("Site wajib diisi")
    if (!entitas) errors.push("Entitas wajib diisi")
    if (entitas && !VALID_ENTITAS.includes(entitas)) {
      errors.push(`Entitas tidak valid. Gunakan: ${VALID_ENTITAS.join(" atau ")}`)
    }

    if (nrp && nrp.length !== 10) {
      errors.push("NRP harus 10 digit jika diisi")
    }
    if (nrp && !/^\d+$/.test(nrp)) {
      errors.push("NRP harus berupa angka")
    }

    console.log("[v0] Row validation:", { rowNumber, isValid: errors.length === 0, errors })

    return {
      rowNumber,
      nrp,
      nama_karyawan,
      jabatan,
      level,
      departemen,
      tanggal_masuk_kerja,
      site,
      entitas,
      isValid: errors.length === 0,
      errors,
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setUploadResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const parsed = jsonData.map((row, index) => validateRow(row as Record<string, unknown>, index + 2))

        setParsedData(parsed)
      } catch {
        alert("Gagal membaca file Excel. Pastikan format file benar.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleUpload() {
    const validRows = parsedData.filter((row) => row.isValid)
    if (validRows.length === 0) {
      alert("Tidak ada data valid untuk diupload")
      return
    }

    setUploading(true)

    const inputs: KaryawanInput[] = validRows.map((row) => ({
      nama_karyawan: row.nama_karyawan,
      jabatan: row.jabatan,
      level: row.level,
      departemen: row.departemen,
      tanggal_masuk_kerja: row.tanggal_masuk_kerja,
      site: row.site,
      entitas: row.entitas,
      nrp: row.nrp || undefined,
    }))

    const result = await bulkAddKaryawan(inputs)

    setUploadResult({
      success: result.successCount,
      failed: result.failedCount,
    })

    setUploading(false)

    if (result.successCount > 0) {
      onSuccess()
    }
  }

  function resetState() {
    setParsedData([])
    setFileName("")
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      resetState()
    }
  }

  const validCount = parsedData.filter((r) => r.isValid).length
  const invalidCount = parsedData.filter((r) => !r.isValid).length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-[#333]">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37]">Import Data Karyawan dari Excel</DialogTitle>
          <DialogDescription className="text-[#888]">
            Upload file Excel (.xlsx, .xls) dengan format yang sesuai
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-[#333] bg-[#1a1a1a]">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-white">Template File</CardTitle>
              <CardDescription className="text-[#888]">
                Download template untuk memastikan format data yang benar
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="gap-2 border-[#444] text-white hover:bg-[#333] bg-transparent"
              >
                <Download className="h-4 w-4" />
                Download Template Excel
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#333] bg-[#1a1a1a]">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-white">Upload File</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload">
                  <Button
                    variant="outline"
                    asChild
                    className="cursor-pointer border-[#444] text-white hover:bg-[#333] bg-transparent"
                  >
                    <span className="gap-2">
                      <Upload className="h-4 w-4" />
                      Pilih File
                    </span>
                  </Button>
                </label>
                {fileName && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{fileName}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetState}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {parsedData.length > 0 && (
            <Card className="border-[#333] bg-[#1a1a1a]">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-white">Preview Data ({parsedData.length} baris)</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Valid: {validCount}
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                        Error: {invalidCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-md border border-[#333] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#333] bg-[#0a0a0a]">
                        <TableHead className="text-[#D4AF37]">Row</TableHead>
                        <TableHead className="text-[#D4AF37]">NRP</TableHead>
                        <TableHead className="text-[#D4AF37]">Nama</TableHead>
                        <TableHead className="text-[#D4AF37]">Jabatan</TableHead>
                        <TableHead className="text-[#D4AF37]">Level</TableHead>
                        <TableHead className="text-[#D4AF37]">Departemen</TableHead>
                        <TableHead className="text-[#D4AF37]">Site</TableHead>
                        <TableHead className="text-[#D4AF37]">Entitas</TableHead>
                        <TableHead className="text-[#D4AF37]">Tanggal Masuk</TableHead>
                        <TableHead className="text-[#D4AF37]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row) => (
                        <TableRow key={row.rowNumber} className="border-[#333]">
                          <TableCell className="text-white/70">{row.rowNumber}</TableCell>
                          <TableCell className="text-white/70 font-mono">
                            {row.nrp || <span className="text-[#D4AF37] text-xs">Auto</span>}
                          </TableCell>
                          <TableCell className="text-white">{row.nama_karyawan}</TableCell>
                          <TableCell className="text-white/70">{row.jabatan}</TableCell>
                          <TableCell className="text-white/70">{row.level || "-"}</TableCell>
                          <TableCell className="text-white/70">{row.departemen}</TableCell>
                          <TableCell className="text-white/70">{row.site}</TableCell>
                          <TableCell className="text-white/70">{row.entitas}</TableCell>
                          <TableCell className="text-white/70">{row.tanggal_masuk_kerja}</TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <span className="text-xs text-red-400 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {row.errors[0]}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadResult && (
            <Card
              className={`border ${uploadResult.failed > 0 ? "border-yellow-500/50" : "border-emerald-500/50"} bg-[#1a1a1a]`}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-4">
                  {uploadResult.success > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400 text-sm">
                      <Check className="h-4 w-4" />
                      {uploadResult.success} data berhasil diimport
                    </span>
                  )}
                  {uploadResult.failed > 0 && (
                    <span className="flex items-center gap-1 text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {uploadResult.failed} data gagal
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-[#444] text-white hover:bg-[#333]"
          >
            Tutup
          </Button>
          <Button
            onClick={handleUpload}
            disabled={validCount === 0 || uploading}
            className="bg-[#D4AF37] hover:bg-[#B8962F] text-black"
          >
            {uploading ? (
              <>
                <span className="mr-2">...</span>
                Mengupload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import {validCount} Data
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
