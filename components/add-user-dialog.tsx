"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SITES } from "@/lib/mock-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { UserRole } from "@/lib/types"

const DEPARTMENTS = ["Operation", "Produksi", "Plant", "SCM", "HCGA", "HSE", "Finance", "Accounting", "BOD"]
const JABATAN = ["Admin Site", "GL", "SPV", "Head", "Deputy", "PJO", "Manager", "GM", "Direksi"]

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const [nik, setNik] = useState("")
  const [nama, setNama] = useState("")
  const [emailPrefix, setEmailPrefix] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("user")
  const [site, setSite] = useState("HO")
  const [jabatan, setJabatan] = useState("Staff")
  const [departemen, setDepartemen] = useState("General")
  const [poh, setPoh] = useState("Head Office")
  const [statusKaryawan, setStatusKaryawan] = useState<"Kontrak" | "Tetap">("Kontrak")
  const [noKtp, setNoKtp] = useState("")
  const [noTelp, setNoTelp] = useState("")
  const [tanggalLahir, setTanggalLahir] = useState("")
  const [tanggalBergabung, setTanggalBergabung] = useState("")
  const [jenisKelamin, setJenisKelamin] = useState<"Laki-laki" | "Perempuan">("Laki-laki")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createResult, setCreateResult] = useState<{ success: boolean; message: string } | null>(null)

  const resetForm = () => {
    setNik("")
    setNama("")
    setEmailPrefix("")
    setPassword("")
    setRole("user")
    setSite("HO")
    setJabatan("Staff")
    setDepartemen("General")
    setPoh("Head Office")
    setStatusKaryawan("Kontrak")
    setNoKtp("")
    setNoTelp("")
    setTanggalLahir("")
    setTanggalBergabung("")
    setJenisKelamin("Laki-laki")
    setError("")
    setCreateResult(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setCreateResult(null)

    if (
      !nik ||
      !nama ||
      !emailPrefix ||
      !password ||
      !role ||
      !site ||
      !jabatan ||
      !departemen ||
      !poh ||
      !statusKaryawan ||
      !noKtp ||
      !noTelp ||
      !tanggalLahir ||
      !jenisKelamin
    ) {
      setError("Semua field harus diisi")
      return
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter")
      return
    }

    setIsSubmitting(true)

    try {
      const email = `${emailPrefix}@3s-gsm.com`

      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nik,
          name: nama,
          email,
          password,
          role,
          site,
          jabatan,
          departemen,
          poh,
          statusKaryawan,
          noKtp,
          noTelp,
          tanggalLahir,
          tanggalBergabung: tanggalBergabung || undefined,
          jenisKelamin,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Gagal menambahkan pengguna")
      }

      setCreateResult({
        success: true,
        message: `User ${nama} (${nik}) berhasil ditambahkan!`,
      })

      setTimeout(() => {
        resetForm()
        onSuccess()
      }, 1500)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Tambah User Baru</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Masukkan informasi lengkap untuk menambahkan pengguna baru ke database.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-blue-500 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs md:text-sm text-blue-800">
            <strong>Info:</strong> Pastikan NIK unik dan belum terdaftar di sistem. Email akan otomatis menggunakan
            domain @3s-gsm.com
          </AlertDescription>
        </Alert>

        {createResult && createResult.success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs md:text-sm text-green-800">
              <strong>{createResult.message}</strong>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-nik" className="text-xs md:text-sm">
                NIK <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-nik"
                type="text"
                placeholder="1234567890"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password" className="text-xs md:text-sm">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-nama" className="text-xs md:text-sm">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-nama"
              type="text"
              placeholder="Abdul Rahman"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-tanggalLahir" className="text-xs md:text-sm">
                Tanggal Lahir <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-tanggalLahir"
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-jenisKelamin" className="text-xs md:text-sm">
                Jenis Kelamin <span className="text-red-500">*</span>
              </Label>
              <Select
                value={jenisKelamin}
                onValueChange={(value) => setJenisKelamin(value as "Laki-laki" | "Perempuan")}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-jabatan" className="text-xs md:text-sm">
                Jabatan <span className="text-red-500">*</span>
              </Label>
              <Select value={jabatan} onValueChange={setJabatan}>
                <SelectTrigger className="text-sm">
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
              <Label htmlFor="add-departemen" className="text-xs md:text-sm">
                Departemen <span className="text-red-500">*</span>
              </Label>
              <Select value={departemen} onValueChange={setDepartemen}>
                <SelectTrigger className="text-sm">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-role" className="text-xs md:text-sm">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger className="text-sm">
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
              <Label htmlFor="add-site" className="text-xs md:text-sm">
                Site <span className="text-red-500">*</span>
              </Label>
              <Select value={site} onValueChange={setSite}>
                <SelectTrigger className="text-sm">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-poh" className="text-xs md:text-sm">
                POH <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-poh"
                type="text"
                placeholder="Makassar"
                value={poh}
                onChange={(e) => setPoh(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-statusKaryawan" className="text-xs md:text-sm">
                Status Karyawan <span className="text-red-500">*</span>
              </Label>
              <Select value={statusKaryawan} onValueChange={(value) => setStatusKaryawan(value as "Kontrak" | "Tetap")}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kontrak">Kontrak</SelectItem>
                  <SelectItem value="Tetap">Tetap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-noKtp" className="text-xs md:text-sm">
                No KTP <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-noKtp"
                type="text"
                placeholder="7314033112800076"
                value={noKtp}
                onChange={(e) => setNoKtp(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-noTelp" className="text-xs md:text-sm">
                No Telp (WhatsApp) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-noTelp"
                type="tel"
                placeholder="082227048965"
                value={noTelp}
                onChange={(e) => setNoTelp(e.target.value)}
                required
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-tanggalBergabung" className="text-xs md:text-sm">
              Tanggal Bergabung (Opsional)
            </Label>
            <Input
              id="add-tanggalBergabung"
              type="date"
              value={tanggalBergabung}
              onChange={(e) => setTanggalBergabung(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-email" className="text-xs md:text-sm">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="add-email"
                type="text"
                placeholder="abdul.rahman"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value)}
                required
                className="flex-1 text-sm"
              />
              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">@3s-gsm.com</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="text-sm"
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="text-sm">
              {isSubmitting ? "Menambahkan..." : "Tambah User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
