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
  jenisKelamin: string
}

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

const VALID_ROLES: UserRole[] = ["user", "hr_site", "dic", "pjo_site", "hr_ho", "hr_ticketing", "super_admin"]
const VALID_STATUSES = ["Kontrak", "Tetap"]

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
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

        if (jsonData.length < 2) {
          reject(new Error("File harus memiliki header dan minimal 1 baris data"))
          return
        }

        const headers = jsonData[0].map((h: string) => h.toLowerCase().trim())
        const parsedUsers: ParsedUser[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue

          const user: ParsedUser = {
            nik: String(row[headers.indexOf("nik")] || ""),
            nama: String(row[headers.indexOf("nama")] || ""),
            emailPrefix: String(row[headers.indexOf("email_prefix")] || ""),
            password: String(row[headers.indexOf("password")] || ""),
            role: String(row[headers.indexOf("role")] || "") as UserRole,
            site: String(row[headers.indexOf("site")] || ""),
            jabatan: String(row[headers.indexOf("jabatan")] || ""),
            departemen: String(row[headers.indexOf("departemen")] || ""),
            poh: String(row[headers.indexOf("poh")] || ""),
            statusKaryawan: String(row[headers.indexOf("status_karyawan")] || "") as "Kontrak" | "Tetap",
            noKtp: String(row[headers.indexOf("no_ktp")] || ""),
            noTelp: String(row[headers.indexOf("no_telp")] || ""),
            tanggalLahir: String(row[headers.indexOf("tanggal_lahir")] || "1970-01-01"),
            jenisKelamin: String(row[headers.indexOf("jenis_kelamin")] || "Laki-laki"),
          }

          parsedUsers.push(user)
        }

        resolve(parsedUsers)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Gagal membaca file"))
    reader.readAsBinaryString(file)
  })
}

export function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedUser[]>([])
  const [errors, setErrors] = useState<string[]>([])
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

          const user: ParsedUser = {
            nik: values[headers.indexOf("nik")] || "",
            nama: values[headers.indexOf("nama")] || "",
            emailPrefix: values[headers.indexOf("email_prefix")] || "",
            password: values[headers.indexOf("password")] || "",
            role: (values[headers.indexOf("role")] || "") as UserRole,
            site: values[headers.indexOf("site")] || "",
            jabatan: values[headers.indexOf("jabatan")] || "",
            departemen: values[headers.indexOf("departemen")] || "",
            poh: values[headers.indexOf("poh")] || "",
            statusKaryawan: (values[headers.indexOf("status_karyawan")] || "") as "Kontrak" | "Tetap",
            noKtp: values[headers.indexOf("no_ktp")] || "",
            noTelp: values[headers.indexOf("no_telp")] || "",
            tanggalLahir: values[headers.indexOf("tanggal_lahir")] || "1970-01-01",
            jenisKelamin: values[headers.indexOf("jenis_kelamin")] || "Laki-laki",
          }

          parsedUsers.push(user)
        }
      }

      const requiredHeaders = [
        "nik",
        "nama",
        "email_prefix",
        "password",
        "role",
        "site",
        "jabatan",
        "departemen",
        "poh",
        "status_karyawan",
        "no_ktp",
        "no_telp",
        "tanggal_lahir",
        "jenis_kelamin",
      ]

      const existingUsersResponse = await fetch("/api/users")
      const existingUsers = existingUsersResponse.ok ? await existingUsersResponse.json() : []

      const validatedUsers: ParsedUser[] = []
      const parseErrors: string[] = []

      for (let i = 0; i < parsedUsers.length; i++) {
        const user = parsedUsers[i]
        const row = i + 2

        try {
          if (!user.nik) throw new Error("NIK tidak boleh kosong")
          if (!user.nama) throw new Error("Nama tidak boleh kosong")
          if (!user.emailPrefix) throw new Error("Email prefix tidak boleh kosong")
          if (!user.password) throw new Error("Password tidak boleh kosong")
          if (!VALID_ROLES.includes(user.role)) throw new Error(`Role tidak valid: ${user.role}`)
          if (!user.site) throw new Error("Site tidak boleh kosong")
          if (!user.jabatan) throw new Error("Jabatan tidak boleh kosong")
          if (!user.departemen) throw new Error("Departemen tidak boleh kosong")
          if (!user.poh) throw new Error("POH tidak boleh kosong")
          if (!VALID_STATUSES.includes(user.statusKaryawan))
            throw new Error(`Status karyawan tidak valid: ${user.statusKaryawan}`)
          if (!user.noKtp) throw new Error("No KTP tidak boleh kosong")
          if (!user.noTelp) throw new Error("No Telp tidak boleh kosong")
          if (!user.tanggalLahir) throw new Error("Tanggal lahir tidak boleh kosong")
          if (!user.jenisKelamin) throw new Error("Jenis kelamin tidak boleh kosong")

          if (existingUsers.some((u: User) => u.nik === user.nik)) {
            throw new Error(`NIK sudah terdaftar: ${user.nik}`)
          }

          validatedUsers.push(user)
        } catch (error) {
          parseErrors.push(`Baris ${row}: ${error instanceof Error ? error.message : "Error tidak diketahui"}`)
        }
      }

      if (parseErrors.length > 0) {
        setErrors(parseErrors)
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
          email: `${user.emailPrefix}@3s-gsm.com`,
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
          throw new Error("Gagal menambahkan user")
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
                  <div className="font-medium mb-2">Error:</div>
                  <ul className="list-disc list-inside space-y-1">
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
              <h4 className="font-medium text-sm mb-3">Format yang diharapkan (CSV atau Excel):</h4>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="font-mono overflow-x-auto">
                  <div className="font-semibold mb-1">Header (baris pertama):</div>
                  <div>
                    nik,nama,email_prefix,password,role,site,jabatan,departemen,poh,status_karyawan,no_ktp,no_telp,tanggal_lahir,jenis_kelamin
                  </div>
                </div>
                <div className="font-mono overflow-x-auto">
                  <div className="font-semibold mb-1 mt-3">Contoh data:</div>
                  <div className="text-slate-500">
                    HR002,Dina Kusuma,dina,pass123,hr_site,Head
                    Office,GL,HCGA,POH007,Tetap,3201234567890129,081234567896,1990-05-15,Perempuan
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 font-medium">💡 Tips:</p>
                  <ul className="list-disc list-inside mt-1 text-blue-700">
                    <li>Untuk Excel: Pastikan data ada di sheet pertama</li>
                    <li>Header harus persis sama dengan format di atas</li>
                    <li>Role valid: user, hr_site, dic, pjo_site, hr_ho, hr_ticketing, super_admin</li>
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
              </AlertDescription>
            </Alert>

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
                      <th className="text-left p-2 font-medium">Jenis Kelamin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((user, idx) => (
                      <tr key={idx} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-2">{user.nik}</td>
                        <td className="p-2">{user.nama}</td>
                        <td className="p-2 text-slate-600">{user.emailPrefix}@3s-gsm.com</td>
                        <td className="p-2 text-slate-600">{"*".repeat(Math.min(user.password.length, 8))}</td>
                        <td className="p-2">{user.role}</td>
                        <td className="p-2">{user.site}</td>
                        <td className="p-2">{user.jabatan}</td>
                        <td className="p-2">{user.statusKaryawan}</td>
                        <td className="p-2">{user.tanggalLahir}</td>
                        <td className="p-2">{user.jenisKelamin}</td>
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
                  <div>✓ Berhasil: {importResult.success} data</div>
                  {importResult.failed > 0 && <div>✗ Gagal: {importResult.failed} data</div>}
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
