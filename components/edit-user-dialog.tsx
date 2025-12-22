"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SITES } from "@/lib/mock-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { User, UserRole } from "@/lib/types"

const DEPARTMENTS = ["Operation", "Produksi", "Plant", "SCM", "HCGA", "HSE", "Finance", "Accounting", "BOD"]
const JABATAN = ["Admin Site", "GL", "SPV", "Head", "Deputy", "PJO", "Manager", "GM", "Direksi", "Operator", "Mekanik"]

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const [nik, setNik] = useState("")
  const [originalNik, setOriginalNik] = useState("")
  const [nama, setNama] = useState("")
  const [emailPrefix, setEmailPrefix] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("user")
  const [site, setSite] = useState("")
  const [jabatan, setJabatan] = useState("")
  const [departemen, setDepartemen] = useState("")
  const [poh, setPoh] = useState("")
  const [statusKaryawan, setStatusKaryawan] = useState<"Kontrak" | "Tetap">("Kontrak")
  const [noKtp, setNoKtp] = useState("")
  const [noTelp, setNoTelp] = useState("")
  const [tanggalLahir, setTanggalLahir] = useState("")
  const [tanggalBergabung, setTanggalBergabung] = useState("")
  const [jenisKelamin, setJenisKelamin] = useState<"Laki-laki" | "Perempuan">("Laki-laki")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string; details: string[] } | null>(
    null,
  )

  useEffect(() => {
    if (user && open) {
      console.log("[v0] EditUserDialog - Populating form with user data:", user)

      setNik(user.nik || "")
      setOriginalNik(user.nik || "")
      setNama(user.nama || "")
      setEmailPrefix(user.email ? user.email.split("@")[0] : "")
      setPassword("")
      setRole(user.role || "user")
      setSite(user.site || "")
      setJabatan(user.jabatan || "")
      setDepartemen(user.departemen || "")
      setPoh(user.poh || "")
      setStatusKaryawan(user.statusKaryawan || "Kontrak")
      setNoKtp(user.noKtp || "")
      setNoTelp(user.noTelp || "")

      // Format date to YYYY-MM-DD for input type="date"
      if (user.tanggalLahir) {
        const formattedDate = formatDateForInput(user.tanggalLahir)
        console.log("[v0] Formatting tanggalLahir:", user.tanggalLahir, "->", formattedDate)
        setTanggalLahir(formattedDate)
      } else {
        setTanggalLahir("")
      }

      if (user.tanggalBergabung) {
        const formattedDate = formatDateForInput(user.tanggalBergabung)
        setTanggalBergabung(formattedDate)
      } else {
        setTanggalBergabung("")
      }

      setJenisKelamin(user.jenisKelamin || "Laki-laki")
      setError("")
      setUpdateResult(null)

      console.log("[v0] Form populated with values:", {
        nik,
        nama,
        tanggalLahir: user.tanggalLahir,
        jabatan,
        departemen,
        site,
      })
    }
  }, [user, open])

  // Helper function to format date for input type="date"
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ""

    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // Try to parse and format
    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
      }
    } catch (e) {
      console.error("[v0] Error formatting date:", dateString, e)
    }

    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setUpdateResult(null)

    if (!user) {
      setError("Data pengguna tidak ditemukan")
      return
    }

    if (
      !nik ||
      !nama ||
      !emailPrefix ||
      !role ||
      !site ||
      !jabatan ||
      !departemen ||
      !poh ||
      !statusKaryawan ||
      !tanggalLahir ||
      !jenisKelamin
    ) {
      setError(
        "Field yang wajib diisi: NIK, Nama, Email, Role, Site, Jabatan, Departemen, POH, Status Karyawan, Tanggal Lahir, Jenis Kelamin",
      )
      return
    }

    setIsSubmitting(true)

    try {
      const email = `${emailPrefix}@3s-gsm.com`

      const updates: Record<string, any> = {
        nik,
        name: nama,
        email,
        role,
        site,
        jabatan,
        departemen,
        poh,
        statusKaryawan,
        tanggalLahir,
        jenisKelamin,
      }

      if (password) {
        updates.password = password
      }

      if (tanggalBergabung) {
        updates.tanggalBergabung = tanggalBergabung
      }

      if (noKtp) {
        updates.noKtp = noKtp
      }

      if (noTelp) {
        updates.noTelp = noTelp
      }

      console.log("[v0] Submitting update with data:", updates)

      const response = await fetch("/api/users/update-full", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          oldNik: originalNik,
          updates,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengupdate pengguna")
      }

      setUpdateResult({
        success: true,
        message: result.message,
        details: result.details || [],
      })

      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>Memuat data pengguna...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Edit Pengguna (Super Admin)</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Perbarui informasi pengguna. Perubahan akan otomatis ter-cascade ke semua data historical.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs md:text-sm text-amber-800">
            <strong>Perhatian:</strong> Perubahan data akan mempengaruhi semua historical record termasuk pengajuan cuti
            dan penilaian karyawan.
          </AlertDescription>
        </Alert>

        {updateResult && (
          <Alert className={updateResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
            <CheckCircle2 className={`h-4 w-4 ${updateResult.success ? "text-green-600" : "text-red-600"}`} />
            <AlertDescription
              className={`text-xs md:text-sm ${updateResult.success ? "text-green-800" : "text-red-800"}`}
            >
              <strong>{updateResult.message}</strong>
              {updateResult.details.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs">
                  {updateResult.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nik">NIK</Label>
              <Input
                id="edit-nik"
                type="text"
                placeholder="Masukkan NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                required
              />
              {nik !== originalNik && (
                <p className="text-xs text-amber-600">
                  NIK akan diubah dari {originalNik} → {nik}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Password Baru (opsional)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Kosongkan jika tidak ingin mengubah"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-nama">Nama Lengkap</Label>
            <Input
              id="edit-nama"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tanggalLahir">Tanggal Lahir</Label>
              <Input
                id="edit-tanggalLahir"
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-jenisKelamin">Jenis Kelamin</Label>
              <Select
                value={jenisKelamin}
                onValueChange={(value) => setJenisKelamin(value as "Laki-laki" | "Perempuan")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-jabatan">Jabatan</Label>
              <Select value={jabatan} onValueChange={setJabatan}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {JABATAN.map((jab) => (
                    <SelectItem key={jab} value={jab}>
                      {jab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-departemen">Departemen</Label>
              <Select value={departemen} onValueChange={setDepartemen}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin_site">Admin Site</SelectItem>
                  <SelectItem value="hr_site">HR Site</SelectItem>
                  <SelectItem value="dic">DIC</SelectItem>
                  <SelectItem value="pjo_site">PJO Site</SelectItem>
                  <SelectItem value="hr_ho">HR Head Office</SelectItem>
                  <SelectItem value="hr_ticketing">HR Ticketing</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-site">Site</Label>
              <Select value={site} onValueChange={setSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih site" />
                </SelectTrigger>
                <SelectContent>
                  {SITES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-poh">POH</Label>
              <Input
                id="edit-poh"
                type="text"
                placeholder="Masukkan POH"
                value={poh}
                onChange={(e) => setPoh(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-statusKaryawan">Status Karyawan</Label>
              <Select value={statusKaryawan} onValueChange={(value) => setStatusKaryawan(value as "Kontrak" | "Tetap")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kontrak">Kontrak</SelectItem>
                  <SelectItem value="Tetap">Tetap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-noKtp">
                No KTP <span className="text-xs text-muted-foreground">(Opsional)</span>
              </Label>
              <Input
                id="edit-noKtp"
                type="text"
                placeholder="Masukkan nomor KTP atau kosongkan"
                value={noKtp}
                onChange={(e) => setNoKtp(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-noTelp">
                No Telp (WhatsApp) <span className="text-xs text-muted-foreground">(Opsional)</span>
              </Label>
              <Input
                id="edit-noTelp"
                type="tel"
                placeholder="Masukkan nomor telepon atau kosongkan"
                value={noTelp}
                onChange={(e) => setNoTelp(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tanggalBergabung">Tanggal Bergabung (Opsional)</Label>
            <Input
              id="edit-tanggalBergabung"
              type="date"
              value={tanggalBergabung}
              onChange={(e) => setTanggalBergabung(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-email"
                type="text"
                placeholder="novia"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value)}
                required
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">@3s-gsm.com</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
