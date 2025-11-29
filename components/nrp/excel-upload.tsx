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
        nama_karyawan: "Contoh: Budi Santoso",
        jabatan: "Staff",
        departemen: "HCGA",
        tanggal_masuk_kerja: "2025-01-15",
        site: "HEAD OFFICE",
        entitas: "PT GSM",
      },
      {
        nama_karyawan: "Contoh: Ani Wijaya",
        jabatan: "Manager",
        departemen: "FINANCE",
        tanggal_masuk_kerja: "2025-02-01",
        site: "HSM",
        entitas: "PT SSS",
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")

    ws["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]

    XLSX.writeFile(wb, "template-import-karyawan.xlsx")
  }

  function validateRow(row: Record<string, unknown>, rowNumber: number): ParsedRow {
    const errors: string[] = []

    const nama_karyawan = String(row.nama_karyawan || "").trim()
    const jabatan = String(row.jabatan || "").trim()
    const departemen = String(row.departemen || "").trim()
    const site = String(row.site || "").trim()
    const entitas = String(row.entitas || "").trim()

    let tanggal_masuk_kerja = ""
    if (row.tanggal_masuk_kerja) {
      if (typeof row.tanggal_masuk_kerja === "number") {
        const date = XLSX.SSF.parse_date_code(row.tanggal_masuk_kerja)
        tanggal_masuk_kerja = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`
      } else {
        const dateStr = String(row.tanggal_masuk_kerja).trim()
        const parsed = new Date(dateStr)
        if (!isNaN(parsed.getTime())) {
          tanggal_masuk_kerja = parsed.toISOString().split("T")[0]
        } else {
          const parts = dateStr.split(/[/-]/)
          if (parts.length === 3) {
            const [d, m, y] = parts
            tanggal_masuk_kerja = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
          }
        }
      }
    }

    if (!nama_karyawan) errors.push("Nama karyawan wajib diisi")
    if (!jabatan) errors.push("Jabatan wajib diisi")
    if (!departemen) errors.push("Departemen wajib diisi")
    if (!tanggal_masuk_kerja) errors.push("Tanggal masuk tidak valid")
    if (!site) errors.push("Site wajib diisi")
    if (!entitas) errors.push("Entitas wajib diisi")
    if (entitas && !VALID_ENTITAS.includes(entitas)) {
      errors.push(`Entitas tidak valid. Gunakan: ${VALID_ENTITAS.join(" atau ")}`)
    }

    return {
      rowNumber,
      nama_karyawan,
      jabatan,
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
      departemen: row.departemen,
      tanggal_masuk_kerja: row.tanggal_masuk_kerja,
      site: row.site,
      entitas: row.entitas,
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
          {/* Template Download */}
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

          {/* File Upload */}
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

          {/* Preview Data */}
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
                        <TableHead className="text-[#D4AF37]">Nama</TableHead>
                        <TableHead className="text-[#D4AF37]">Jabatan</TableHead>
                        <TableHead className="text-[#D4AF37]">Departemen</TableHead>
                        <TableHead className="text-[#D4AF37]">Tgl Masuk</TableHead>
                        <TableHead className="text-[#D4AF37]">Site</TableHead>
                        <TableHead className="text-[#D4AF37]">Entitas</TableHead>
                        <TableHead className="text-[#D4AF37]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row) => (
                        <TableRow key={row.rowNumber} className="border-[#333]">
                          <TableCell className="text-white/70">{row.rowNumber}</TableCell>
                          <TableCell className="text-white">{row.nama_karyawan}</TableCell>
                          <TableCell className="text-white/70">{row.jabatan}</TableCell>
                          <TableCell className="text-white/70">{row.departemen}</TableCell>
                          <TableCell className="text-white/70">{row.tanggal_masuk_kerja}</TableCell>
                          <TableCell className="text-white/70">{row.site}</TableCell>
                          <TableCell className="text-white/70">{row.entitas}</TableCell>
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

          {/* Upload Result */}
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

        {/* Actions */}
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
