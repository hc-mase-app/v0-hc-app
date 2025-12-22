"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User, UserRole } from "@/lib/types"
import { AlertCircle, CheckCircle2, Upload } from "lucide-react"
import * as XLSX from "xlsx"

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ParsedUser {
  nik: string
  nama: string
  emailPrefix: string
  password: string
  role: UserRole
  site: string
  jabatan: string
  departemen: string
  poh: string
  statusKaryawan: "Kontrak" | "Tetap"
  noKtp: string
  noTelp: string
  tanggalLahir: string
  tanggalMasuk: string
  jenisKelamin: string
}

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

const VALID_ROLES: UserRole[] = [
  "user",
  "admin_site",
  "hr_site",
  "dic",
  "pjo_site",
  "hr_ho",
  "hr_ticketing",
  "super_admin",
]
const VALID_STATUSES = ["Kontrak", "Tetap"]

const getDefaultValue = (value: string | undefined | null, fieldName: string): string => {
  const trimmed = String(value || "").trim()
  if (trimmed && trimmed !== "undefined" && trimmed !== "null") return trimmed

  // Default values for each field
  const defaults: Record<string, string> = {
    nik: "",
    nama: "-",
    emailPrefix: "-",
    password: "password123",
    role: "user",
    site: "-",
    jabatan: "-",
    departemen: "-",
    poh: "-",
    statusKaryawan: "Kontrak",
    noKtp: "",
    noTelp: "",
    tanggalLahir: "1970-01-01",
    tanggalMasuk: new Date().toISOString().split("T")[0],
    jenisKelamin: "Laki-laki",
  }

  return defaults[fieldName] || "-"
}

function parseDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === "" || dateStr === "-") {
    return new Date().toISOString().split("T")[0] // Return today's date if empty
  }

  // Try parsing various date formats
  const formats = [
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // MM/DD/YYYY (US format)
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ]

  // Try YYYY-MM-DD first
  if (formats[0].test(dateStr)) {
    return dateStr
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyyMatch = dateStr.match(formats[1]) || dateStr.match(formats[2])
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, "0")
    const month = ddmmyyyyMatch[2].padStart(2, "0")
    const year = ddmmyyyyMatch[3]
    return `${year}-${month}-${day}`
  }

  // If Excel serial date number
  if (!isNaN(Number(dateStr))) {
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + Number(dateStr) * 86400000)
    return date.toISOString().split("T")[0]
  }

  // Return today's date if parsing fails
  return new Date().toISOString().split("T")[0]
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

const parseXLSX = async (file: File): Promise<ParsedUser[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][]

        if (rows.length < 2) {
          reject(new Error("File harus memiliki header dan minimal 1 baris data"))
          return
        }

        const headers = rows[0].map((h) => String(h).toLowerCase().trim())
        const parsedUsers: ParsedUser[] = []

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (row.every((cell) => !cell || String(cell).trim() === "")) continue

          const user: ParsedUser = {
            nik: getDefaultValue(row[headers.indexOf("nik")], "nik"),
            nama: getDefaultValue(row[headers.indexOf("nama")], "nama"),
            emailPrefix: getDefaultValue(row[headers.indexOf("email_prefix")], "emailPrefix"),
            password: getDefaultValue(row[headers.indexOf("password")], "password"),
            role: getDefaultValue(row[headers.indexOf("role")], "role") as UserRole,
            site: getDefaultValue(row[headers.indexOf("site")], "site"),
            jabatan: getDefaultValue(row[headers.indexOf("jabatan")], "jabatan"),
            departemen: getDefaultValue(row[headers.indexOf("departemen")], "departemen"),
            poh: getDefaultValue(row[headers.indexOf("poh")], "poh"),
            statusKaryawan: getDefaultValue(row[headers.indexOf("status_karyawan")], "statusKaryawan") as
              | "Kontrak"
              | "Tetap",
            noKtp: getDefaultValue(row[headers.indexOf("no_ktp")], "noKtp"),
            noTelp: getDefaultValue(row[headers.indexOf("no_telp")], "noTelp"),
            tanggalLahir: parseDate(getDefaultValue(row[headers.indexOf("tanggal_lahir")], "tanggalLahir")),
            tanggalMasuk: parseDate(getDefaultValue(row[headers.indexOf("tanggal_masuk")], "tanggalMasuk")),
            jenisKelamin: getDefaultValue(row[headers.indexOf("jenis_kelamin")], "jenisKelamin"),
          }

          parsedUsers.push(user)
        }

        resolve(parsedUsers)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Gagal membaca file"))
    reader.readAsArrayBuffer(file)
  })
}

export function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedUser[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [skippedRows, setSkippedRows] = useState<number>(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const isCSV = selectedFile.name.endsWith(".csv")
    const isXLSX = selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")

    if (!isCSV && !isXLSX) {
      setErrors(["File harus berformat CSV atau XLSX"])
      return
    }

    setFile(selectedFile)
    setErrors([])
    setSkippedRows(0)

    try {
      let parsedUsers: ParsedUser[] = []

      if (isXLSX) {
        parsedUsers = await parseXLSX(selectedFile)
      } else {
        const text = await selectedFile.text()
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
          setErrors(["File CSV harus memiliki header dan minimal 1 baris data"])
          return
        }

        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase())

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])

          if (values.every((v) => !v.trim())) continue

          const user: ParsedUser = {
            nik: getDefaultValue(values[headers.indexOf("nik")], "nik"),
            nama: getDefaultValue(values[headers.indexOf("nama")], "nama"),
            emailPrefix: getDefaultValue(values[headers.indexOf("email_prefix")], "emailPrefix"),
            password: getDefaultValue(values[headers.indexOf("password")], "password"),
            role: getDefaultValue(values[headers.indexOf("role")], "role") as UserRole,
            site: getDefaultValue(values[headers.indexOf("site")], "site"),
            jabatan: getDefaultValue(values[headers.indexOf("jabatan")], "jabatan"),
            departemen: getDefaultValue(values[headers.indexOf("departemen")], "departemen"),
            poh: getDefaultValue(values[headers.indexOf("poh")], "poh"),
            statusKaryawan: getDefaultValue(values[headers.indexOf("status_karyawan")], "statusKaryawan") as
              | "Kontrak"
              | "Tetap",
            noKtp: getDefaultValue(values[headers.indexOf("no_ktp")], "noKtp"),
            noTelp: getDefaultValue(values[headers.indexOf("no_telp")], "noTelp"),
            tanggalLahir: parseDate(getDefaultValue(values[headers.indexOf("tanggal_lahir")], "tanggalLahir")),
            tanggalMasuk: parseDate(getDefaultValue(values[headers.indexOf("tanggal_masuk")], "tanggalMasuk")),
            jenisKelamin: getDefaultValue(values[headers.indexOf("jenis_kelamin")], "jenisKelamin"),
          }

          parsedUsers.push(user)
        }
      }

      const existingUsersResponse = await fetch("/api/users")
      const existingUsers = existingUsersResponse.ok ? await existingUsersResponse.json() : []

      const validatedUsers: ParsedUser[] = []
      const parseErrors: string[] = []

      for (let i = 0; i < parsedUsers.length; i++) {
        const user = parsedUsers[i]
        const row = i + 2

        try {
          if (!user.nik || user.nik === "-") throw new Error("NIK tidak boleh kosong")

          if (user.role && !VALID_ROLES.includes(user.role)) {
            user.role = "user" as UserRole // Default to user if invalid
          }

          if (user.statusKaryawan && !VALID_STATUSES.includes(user.statusKaryawan)) {
            user.statusKaryawan = "Kontrak" // Default to Kontrak if invalid
          }

          if (existingUsers.some((u: User) => u.nik === user.nik)) {
            throw new Error(`NIK sudah terdaftar: ${user.nik}`)
          }

          validatedUsers.push(user)
        } catch (error) {
          parseErrors.push(`Baris ${row}: ${error instanceof Error ? error.message : "Error tidak diketahui"}`)
        }
      }

      setSkippedRows(parseErrors.length)

      if (parseErrors.length > 0) {
        setErrors(parseErrors)
        if (validatedUsers.length > 0) {
          setPreview(validatedUsers)
          setStep("preview")
        }
        return
      }

      setPreview(validatedUsers)
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
        const user = preview[i]

        const newUser = {
          nik: user.nik,
          name: user.nama,
          email: user.emailPrefix === "-" ? `${user.nik}@3s-gsm.com` : `${user.emailPrefix}@3s-gsm.com`,
          password: user.password,
          role: user.role,
          site: user.site,
          jabatan: user.jabatan,
          departemen: user.departemen,
          poh: user.poh,
          status_karyawan: user.statusKaryawan,
          no_ktp: user.noKtp,
          no_telp: user.noTelp,
          tanggal_lahir: user.tanggalLahir,
          tanggal_masuk: user.tanggalMasuk,
          jenis_kelamin: user.jenisKelamin,
        }

        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUser),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Gagal menambahkan user")
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

    if (result.success > 0) {
      onSuccess()
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setErrors([])
    setSkippedRows(0)
    setImportResult(null)
    setStep("upload")
    onOpenChange(false)

    if (importResult && importResult.success > 0) {
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Data Karyawan dari CSV/Excel</DialogTitle>
          <DialogDescription>Upload file CSV atau XLSX untuk menambahkan data karyawan secara massal</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <Label htmlFor="csv-file" className="cursor-pointer">
                <div className="text-lg font-medium text-slate-700 mb-2">Pilih file CSV atau Excel</div>
                <div className="text-sm text-slate-500">atau drag and drop file di sini</div>
              </Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Error (data valid tetap bisa diimport):</div>
                  <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                    {errors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="text-sm">
                        {error}
                      </li>
                    ))}
                    {errors.length > 10 && (
                      <li className="text-sm font-medium">...dan {errors.length - 10} error lainnya</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-3">Format yang diharapkan (CSV atau Excel):</h4>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="font-mono overflow-x-auto">
                  <div className="font-semibold mb-1">Header (baris pertama):</div>
                  <div>
                    nik,nama,email_prefix,password,role,site,jabatan,departemen,poh,status_karyawan,no_ktp,no_telp,tanggal_lahir,tanggal_masuk,jenis_kelamin
                  </div>
                </div>
                <div className="font-mono overflow-x-auto">
                  <div className="font-semibold mb-1 mt-3">Contoh data:</div>
                  <div className="text-slate-500">
                    HR002,Dina Kusuma,dina,pass123,hr_site,Head
                    Office,GL,HCGA,POH007,Tetap,3201234567890129,081234567896,1990-05-15,1990-05-15,Perempuan
                  </div>
                </div>
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 font-medium">Field yang wajib diisi:</p>
                  <ul className="list-disc list-inside mt-1 text-green-700">
                    <li>
                      <strong>NIK</strong> - Harus unik dan tidak boleh kosong
                    </li>
                  </ul>
                  <p className="text-green-700 mt-2 text-xs">Field lain jika kosong akan diisi dengan default value</p>
                </div>
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 font-medium">Tips:</p>
                  <ul className="list-disc list-inside mt-1 text-blue-700">
                    <li>Untuk Excel: Pastikan data ada di sheet pertama</li>
                    <li>Role valid: user, admin_site, hr_site, dic, pjo_site, hr_ho, hr_ticketing, super_admin</li>
                    <li>Status valid: Kontrak, Tetap</li>
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
                File berhasil diparse. Ditemukan {preview.length} data karyawan yang siap diimport.
                {skippedRows > 0 && (
                  <span className="text-amber-600 ml-1">({skippedRows} baris dilewati karena error)</span>
                )}
              </AlertDescription>
            </Alert>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Baris yang dilewati karena error:</div>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-48 overflow-y-auto">
                    <ul className="space-y-2 text-sm">
                      {errors.map((error, idx) => (
                        <li key={idx} className="text-red-800 font-mono text-xs">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-2 text-sm text-amber-700">
                    ℹ️ Baris yang valid tetap akan diimport. Perbaiki baris error dan upload ulang jika diperlukan.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2 font-medium">NIK</th>
                      <th className="text-left p-2 font-medium">Nama</th>
                      <th className="text-left p-2 font-medium">Email</th>
                      <th className="text-left p-2 font-medium">Password</th>
                      <th className="text-left p-2 font-medium">Role</th>
                      <th className="text-left p-2 font-medium">Site</th>
                      <th className="text-left p-2 font-medium">Jabatan</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Tanggal Lahir</th>
                      <th className="text-left p-2 font-medium">Tgl Masuk</th>
                      <th className="text-left p-2 font-medium">Jenis Kelamin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 50).map((user, idx) => (
                      <tr key={idx} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-2">{user.nik}</td>
                        <td className="p-2">{user.nama}</td>
                        <td className="p-2 text-slate-600">
                          {user.emailPrefix === "-" ? `${user.nik}@3s-gsm.com` : `${user.emailPrefix}@3s-gsm.com`}
                        </td>
                        <td className="p-2 text-slate-600">{"*".repeat(Math.min(user.password.length, 8))}</td>
                        <td className="p-2">{user.role}</td>
                        <td className="p-2">{user.site}</td>
                        <td className="p-2">{user.jabatan}</td>
                        <td className="p-2">{user.statusKaryawan}</td>
                        <td className="p-2">{user.tanggalLahir}</td>
                        <td className="p-2">{user.tanggalMasuk}</td>
                        <td className="p-2">{user.jenisKelamin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 50 && (
                  <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 border-t">
                    Menampilkan 50 dari {preview.length} data. Semua data akan diimport.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Kembali
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? "Mengimport..." : "Import Data"}
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
