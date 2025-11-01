"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database } from "@/lib/database"
import { generateId } from "@/lib/utils"
import type { User, UserRole } from "@/lib/types"
import { AlertCircle, CheckCircle2, Upload } from "lucide-react"

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

    if (!selectedFile.name.endsWith(".csv")) {
      setErrors(["File harus berformat CSV"])
      return
    }

    setFile(selectedFile)
    setErrors([])

    try {
      const text = await selectedFile.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        setErrors(["File CSV harus memiliki header dan minimal 1 baris data"])
        return
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase())
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
      ]

      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
      if (missingHeaders.length > 0) {
        setErrors([`Header yang hilang: ${missingHeaders.join(", ")}`])
        return
      }

      const parsedUsers: ParsedUser[] = []
      const parseErrors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        const row = i + 1

        try {
          const nikIndex = headers.indexOf("nik")
          const namaIndex = headers.indexOf("nama")
          const emailPrefixIndex = headers.indexOf("email_prefix")
          const passwordIndex = headers.indexOf("password")
          const roleIndex = headers.indexOf("role")
          const siteIndex = headers.indexOf("site")
          const jabatanIndex = headers.indexOf("jabatan")
          const departemenIndex = headers.indexOf("departemen")
          const pohIndex = headers.indexOf("poh")
          const statusKaryawanIndex = headers.indexOf("status_karyawan")
          const noKtpIndex = headers.indexOf("no_ktp")
          const noTelpIndex = headers.indexOf("no_telp")

          console.log(`[v0] Row ${row} values:`, {
            nik: values[nikIndex],
            password: values[passwordIndex],
            totalValues: values.length,
            totalHeaders: headers.length,
          })

          const user: ParsedUser = {
            nik: values[nikIndex] || "",
            nama: values[namaIndex] || "",
            emailPrefix: values[emailPrefixIndex] || "",
            password: values[passwordIndex] || "",
            role: (values[roleIndex] || "") as UserRole,
            site: values[siteIndex] || "",
            jabatan: values[jabatanIndex] || "",
            departemen: values[departemenIndex] || "",
            poh: values[pohIndex] || "",
            statusKaryawan: (values[statusKaryawanIndex] || "") as "Kontrak" | "Tetap",
            noKtp: values[noKtpIndex] || "",
            noTelp: values[noTelpIndex] || "",
          }

          // Validation
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

          // Check duplicate NIK
          const existingUsers = Database.getUsers()
          if (existingUsers.some((u) => u.nik === user.nik)) {
            throw new Error(`NIK sudah terdaftar: ${user.nik}`)
          }

          parsedUsers.push(user)
        } catch (error) {
          parseErrors.push(`Baris ${row}: ${error instanceof Error ? error.message : "Error tidak diketahui"}`)
        }
      }

      if (parseErrors.length > 0) {
        setErrors(parseErrors)
        return
      }

      setPreview(parsedUsers)
      setStep("preview")
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Gagal membaca file"])
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    try {
      const existingUsers = Database.getUsers()

      for (let i = 0; i < preview.length; i++) {
        try {
          const user = preview[i]

          // Double-check for duplicate NIK
          if (existingUsers.some((u) => u.nik === user.nik)) {
            throw new Error(`NIK sudah terdaftar`)
          }

          const newUser: User = {
            id: generateId("user"),
            nik: user.nik,
            nama: user.nama,
            email: `${user.emailPrefix}@3s-gsm.com`,
            password: user.password,
            role: user.role,
            site: user.site,
            jabatan: user.jabatan,
            departemen: user.departemen,
            poh: user.poh,
            statusKaryawan: user.statusKaryawan,
            noKtp: user.noKtp,
            noTelp: user.noTelp,
            tanggalBergabung: new Date().toISOString().split("T")[0],
          }

          Database.addUser(newUser)
          existingUsers.push(newUser)
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
    } finally {
      setIsImporting(false)
    }
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
          <DialogTitle>Import Data Karyawan dari CSV</DialogTitle>
          <DialogDescription>Upload file CSV untuk menambahkan data karyawan secara massal</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <Label htmlFor="csv-file" className="cursor-pointer">
                <div className="text-lg font-medium text-slate-700 mb-2">Pilih file CSV</div>
                <div className="text-sm text-slate-500">atau drag and drop file di sini</div>
              </Label>
              <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
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
              <h4 className="font-medium text-sm mb-3">Format CSV yang diharapkan:</h4>
              <div className="text-xs text-slate-600 font-mono overflow-x-auto">
                <div>
                  nik,nama,email_prefix,password,role,site,jabatan,departemen,poh,status_karyawan,no_ktp,no_telp
                </div>
                <div className="mt-2 text-slate-500">
                  HR002,Dina Kusuma,dina,pass123,hr_site,Head Office,GL,HCGA,POH007,Tetap,3201234567890129,081234567896
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
