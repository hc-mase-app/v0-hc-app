"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Upload, Download } from "lucide-react"
import * as XLSX from "xlsx"
import type { JenisPengajuan, LeaveStatus } from "@/lib/types"

interface LeaveRequestImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ParsedLeaveRequest {
  nik: string
  nama: string
  site: string
  jabatan: string
  departemen: string
  poh: string
  jenisPengajuanCuti: string
  jenisPengajuan: JenisPengajuan
  tanggalPengajuan: string
  tanggalKeberangkatan: string
  tanggalMulai: string
  tanggalSelesai: string
  jumlahHari: number
  berangkatDari: string
  tujuan: string
  sisaCutiTahunan: number
  catatan: string
  alasan: string
  status: LeaveStatus
  submittedBy?: string
  submittedByName?: string
  lamaOnsite?: number
}

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

const VALID_JENIS_PENGAJUAN: JenisPengajuan[] = ["dengan_tiket", "lokal"]
const VALID_STATUSES: LeaveStatus[] = [
  "pending_dic",
  "pending_pjo",
  "pending_manager_ho",
  "pending_hr_ho",
  "di_proses",
  "tiket_issued",
  "approved",
  "ditolak_dic",
  "ditolak_pjo",
  "ditolak_manager_ho",
  "ditolak_hr_ho",
]

const parseXLSX = async (file: File): Promise<ParsedLeaveRequest[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

        if (jsonData.length < 2) {
          reject(new Error("File harus memiliki header dan minimal 1 baris data"))
          return
        }

        const headers = jsonData[0].map((h: string) => h.toLowerCase().trim().replace(/\s+/g, "_"))
        const parsedRequests: ParsedLeaveRequest[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue

          const getVal = (key: string) => String(row[headers.indexOf(key)] || "")
          const getNumVal = (key: string) => Number(row[headers.indexOf(key)] || 0)

          const request: ParsedLeaveRequest = {
            nik: getVal("nik"),
            nama: getVal("nama"),
            site: getVal("site"),
            jabatan: getVal("jabatan"),
            departemen: getVal("departemen"),
            poh: getVal("poh"),
            jenisPengajuanCuti: getVal("jenis_pengajuan_cuti"),
            jenisPengajuan: getVal("jenis_pengajuan") as JenisPengajuan,
            tanggalPengajuan: getVal("tanggal_pengajuan"),
            tanggalKeberangkatan: getVal("tanggal_keberangkatan"),
            tanggalMulai: getVal("tanggal_mulai"),
            tanggalSelesai: getVal("tanggal_selesai"),
            jumlahHari: getNumVal("jumlah_hari"),
            berangkatDari: getVal("berangkat_dari"),
            tujuan: getVal("tujuan"),
            sisaCutiTahunan: getNumVal("sisa_cuti_tahunan"),
            catatan: getVal("catatan"),
            alasan: getVal("alasan"),
            status: getVal("status") as LeaveStatus,
            submittedBy: getVal("submitted_by") || undefined,
            submittedByName: getVal("submitted_by_name") || undefined,
            lamaOnsite: getVal("lama_onsite") ? getNumVal("lama_onsite") : undefined,
          }

          parsedRequests.push(request)
        }

        resolve(parsedRequests)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Gagal membaca file"))
    reader.readAsBinaryString(file)
  })
}

const downloadTemplate = () => {
  const headers = [
    "nik",
    "nama",
    "site",
    "jabatan",
    "departemen",
    "poh",
    "jenis_pengajuan_cuti",
    "jenis_pengajuan",
    "tanggal_pengajuan",
    "tanggal_keberangkatan",
    "tanggal_mulai",
    "tanggal_selesai",
    "jumlah_hari",
    "berangkat_dari",
    "tujuan",
    "sisa_cuti_tahunan",
    "catatan",
    "alasan",
    "status",
    "submitted_by",
    "submitted_by_name",
    "lama_onsite",
  ]

  const exampleData = [
    "HR001",
    "John Doe",
    "Head Office",
    "Manager",
    "HCGA",
    "POH001",
    "Cuti Tahunan",
    "lokal",
    "2025-01-15",
    "2025-01-20",
    "2025-01-20",
    "2025-01-25",
    "5",
    "Head Office",
    "Bali",
    "12",
    "Liburan keluarga",
    "Cuti tahunan",
    "pending_dic",
    "",
    "",
    "",
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleData])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Template")

  // Set column widths
  ws["!cols"] = headers.map(() => ({ wch: 20 }))

  XLSX.writeFile(wb, "template_pengajuan_cuti.xlsx")
}

export function LeaveRequestImportDialog({ open, onOpenChange, onSuccess }: LeaveRequestImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedLeaveRequest[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const isXLSX = selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")

    if (!isXLSX) {
      setErrors(["File harus berformat XLSX atau XLS"])
      return
    }

    setFile(selectedFile)
    setErrors([])

    try {
      const parsedRequests = await parseXLSX(selectedFile)

      // Fetch existing users for validation
      const usersResponse = await fetch("/api/users")
      const existingUsers = usersResponse.ok ? await usersResponse.json() : []

      const validatedRequests: ParsedLeaveRequest[] = []
      const parseErrors: string[] = []

      for (let i = 0; i < parsedRequests.length; i++) {
        const request = parsedRequests[i]
        const row = i + 2

        try {
          if (!request.nik) throw new Error("NIK tidak boleh kosong")
          if (!request.nama) throw new Error("Nama tidak boleh kosong")
          if (!request.site) throw new Error("Site tidak boleh kosong")
          if (!request.jabatan) throw new Error("Jabatan tidak boleh kosong")
          if (!request.departemen) throw new Error("Departemen tidak boleh kosong")
          if (!request.poh) throw new Error("POH tidak boleh kosong")
          if (!request.jenisPengajuanCuti) throw new Error("Jenis pengajuan cuti tidak boleh kosong")
          if (!VALID_JENIS_PENGAJUAN.includes(request.jenisPengajuan))
            throw new Error(`Jenis pengajuan tidak valid: ${request.jenisPengajuan}`)
          if (!request.tanggalPengajuan) throw new Error("Tanggal pengajuan tidak boleh kosong")
          if (!request.tanggalMulai) throw new Error("Tanggal mulai tidak boleh kosong")
          if (!request.tanggalSelesai) throw new Error("Tanggal selesai tidak boleh kosong")
          if (request.jumlahHari <= 0) throw new Error("Jumlah hari harus lebih dari 0")
          if (!request.berangkatDari) throw new Error("Berangkat dari tidak boleh kosong")
          if (!request.tujuan) throw new Error("Tujuan tidak boleh kosong")
          if (!VALID_STATUSES.includes(request.status)) throw new Error(`Status tidak valid: ${request.status}`)

          // Check if user exists
          const userExists = existingUsers.some((u: any) => u.nik === request.nik)
          if (!userExists) throw new Error(`NIK tidak ditemukan di database: ${request.nik}`)

          // Validate dates
          const mulai = new Date(request.tanggalMulai)
          const selesai = new Date(request.tanggalSelesai)
          if (selesai < mulai) throw new Error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai")

          validatedRequests.push(request)
        } catch (error) {
          parseErrors.push(`Baris ${row}: ${error instanceof Error ? error.message : "Error tidak diketahui"}`)
        }
      }

      if (parseErrors.length > 0) {
        setErrors(parseErrors)
        return
      }

      setPreview(validatedRequests)
      setStep("preview")
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Gagal membaca file"])
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    for (let i = 0; i < preview.length; i++) {
      try {
        const request = preview[i]

        // Fetch user data
        const userResponse = await fetch(`/api/users?nik=${request.nik}`)
        const userData = userResponse.ok ? await userResponse.json() : null

        if (!userData) {
          throw new Error(`User tidak ditemukan: ${request.nik}`)
        }

        const newRequest = {
          userId: userData.id,
          userName: request.nama,
          userNik: request.nik,
          site: request.site,
          jabatan: request.jabatan,
          departemen: request.departemen,
          poh: request.poh,
          statusKaryawan: userData.status_karyawan || "Kontrak",
          noKtp: userData.no_ktp || "",
          noTelp: userData.no_telp || "",
          email: userData.email || "",
          tanggalLahir: userData.tanggal_lahir || "",
          jenisKelamin: userData.jenis_kelamin || "Laki-laki",
          jenisPengajuanCuti: request.jenisPengajuanCuti,
          jenisPengajuan: request.jenisPengajuan,
          tanggalPengajuan: request.tanggalPengajuan,
          tanggalKeberangkatan: request.tanggalKeberangkatan,
          tanggalMulai: request.tanggalMulai,
          tanggalSelesai: request.tanggalSelesai,
          jumlahHari: request.jumlahHari,
          berangkatDari: request.berangkatDari,
          tujuan: request.tujuan,
          sisaCutiTahunan: request.sisaCutiTahunan,
          catatan: request.catatan,
          alasan: request.alasan,
          status: request.status,
          submittedBy: request.submittedBy,
          submittedByName: request.submittedByName,
          lamaOnsite: request.lamaOnsite,
        }

        const response = await fetch("/api/leave-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            payload: newRequest,
          }),
        })

        if (!response.ok) {
          throw new Error("Gagal menambahkan pengajuan cuti")
        }

        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : "Error tidak diketahui",
        })
      }
    }

    setImportResult(result)
    setStep("result")
    setIsImporting(false)
  }

  const handleClose = () => {
    if (step === "result" && importResult && importResult.success > 0) {
      onSuccess()
    }
    setFile(null)
    setPreview([])
    setErrors([])
    setImportResult(null)
    setStep("upload")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Data Pengajuan Cuti dari Excel</DialogTitle>
          <DialogDescription>Upload file Excel untuk menambahkan data pengajuan cuti secara massal</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download Template Excel
              </Button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <Label htmlFor="excel-file" className="cursor-pointer">
                <div className="text-lg font-medium text-slate-700 mb-2">Pilih file Excel</div>
                <div className="text-sm text-slate-500">atau drag and drop file di sini</div>
              </Label>
              <Input id="excel-file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Error:</div>
                  <ul className="list-disc list-inside space-y-1 max-h-48 overflow-y-auto">
                    {errors.map((error, idx) => (
                      <li key={idx} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-3">Format Excel:</h4>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="font-mono overflow-x-auto">
                  <div className="font-semibold mb-1">Columns (Header):</div>
                  <div className="text-slate-500 text-[10px] leading-relaxed">
                    nik, nama, site, jabatan, departemen, poh, jenis_pengajuan_cuti, jenis_pengajuan, tanggal_pengajuan,
                    tanggal_keberangkatan, tanggal_mulai, tanggal_selesai, jumlah_hari, berangkat_dari, tujuan,
                    sisa_cuti_tahunan, catatan, alasan, status, submitted_by, submitted_by_name, lama_onsite
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 font-medium">Tips:</p>
                  <ul className="list-disc list-inside mt-1 text-blue-700 text-[11px]">
                    <li>NIK harus sudah terdaftar di database users</li>
                    <li>Jenis pengajuan: dengan_tiket atau lokal</li>
                    <li>Status valid: pending_dic, pending_pjo, pending_hr_ho, approved, dll</li>
                    <li>Tanggal format: YYYY-MM-DD (contoh: 2025-01-20)</li>
                    <li>Download template untuk melihat format lengkap</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                File berhasil diparse. Ditemukan {preview.length} data pengajuan cuti yang siap diimport.
              </AlertDescription>
            </Alert>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">NIK</th>
                      <th className="text-left p-2 font-medium">Nama</th>
                      <th className="text-left p-2 font-medium">Site</th>
                      <th className="text-left p-2 font-medium">Jenis Cuti</th>
                      <th className="text-left p-2 font-medium">Jenis Pengajuan</th>
                      <th className="text-left p-2 font-medium">Tanggal Mulai</th>
                      <th className="text-left p-2 font-medium">Tanggal Selesai</th>
                      <th className="text-left p-2 font-medium">Hari</th>
                      <th className="text-left p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((request, idx) => (
                      <tr key={idx} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-2">{request.nik}</td>
                        <td className="p-2">{request.nama}</td>
                        <td className="p-2">{request.site}</td>
                        <td className="p-2">{request.jenisPengajuanCuti}</td>
                        <td className="p-2">{request.jenisPengajuan}</td>
                        <td className="p-2">{request.tanggalMulai}</td>
                        <td className="p-2">{request.tanggalSelesai}</td>
                        <td className="p-2">{request.jumlahHari}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-slate-100 rounded text-[10px]">{request.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Kembali
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? "Mengimport..." : `Import ${preview.length} Data`}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && importResult && (
          <div className="space-y-4">
            <Alert variant={importResult.failed === 0 ? "default" : "destructive"}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Hasil Import:</div>
                <div className="space-y-1 text-sm">
                  <div>Berhasil: {importResult.success} data</div>
                  {importResult.failed > 0 && <div>Gagal: {importResult.failed} data</div>}
                </div>
              </AlertDescription>
            </Alert>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-sm text-red-900 mb-2">Error Detail:</h4>
                <div className="space-y-1 text-xs text-red-800 max-h-48 overflow-y-auto">
                  {importResult.errors.map((err, idx) => (
                    <div key={idx}>
                      Baris {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button onClick={handleClose}>{importResult.success > 0 ? "Selesai" : "Tutup"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
