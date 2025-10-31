"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database } from "@/lib/database"
import { SITES } from "@/lib/mock-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User, UserRole } from "@/lib/types"

const DEPARTMENTS = ["Operation", "Produksi", "Plant", "SCM", "HCGA", "HSE", "Finance", "Accounting", "BOD"]
const JABATAN = ["Admin Site", "GL", "SPV", "Head", "Deputy", "PJO", "Manager", "GM", "Direksi"]

interface EditUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const [nik, setNik] = useState(user.nik)
  const [nama, setNama] = useState(user.nama)
  const [emailPrefix, setEmailPrefix] = useState(user.email.split("@")[0])
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>(user.role)
  const [site, setSite] = useState(user.site)
  const [jabatan, setJabatan] = useState(user.jabatan)
  const [departemen, setDepartemen] = useState(user.departemen)
  const [poh, setPoh] = useState(user.poh || "")
  const [statusKaryawan, setStatusKaryawan] = useState<"Kontrak" | "Tetap">(user.statusKaryawan || "Kontrak")
  const [noKtp, setNoKtp] = useState(user.noKtp || "")
  const [noTelp, setNoTelp] = useState(user.noTelp || "")
  const [tanggalLahir, setTanggalLahir] = useState(user.tanggalLahir || "")
  const [jenisKelamin, setJenisKelamin] = useState<"Laki-laki" | "Perempuan">(user.jenisKelamin || "Laki-laki")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setNik(user.nik)
    setNama(user.nama)
    setEmailPrefix(user.email.split("@")[0])
    setPassword("")
    setRole(user.role)
    setSite(user.site)
    setJabatan(user.jabatan)
    setDepartemen(user.departemen)
    setPoh(user.poh || "")
    setStatusKaryawan(user.statusKaryawan || "Kontrak")
    setNoKtp(user.noKtp || "")
    setNoTelp(user.noTelp || "")
    setTanggalLahir(user.tanggalLahir || "")
    setJenisKelamin(user.jenisKelamin || "Laki-laki")
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

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
      !noKtp ||
      !noTelp ||
      !tanggalLahir ||
      !jenisKelamin
    ) {
      setError("Semua field harus diisi")
      return
    }

    const existingUsers = Database.getUsers()
    if (existingUsers.some((u) => u.nik === nik && u.id !== user.id)) {
      setError("NIK sudah terdaftar")
      return
    }

    setIsSubmitting(true)

    const email = `${emailPrefix}@3s-gsm.com`

    const updates: Partial<User> = {
      nik,
      nama,
      email,
      role,
      site,
      jabatan,
      departemen,
      poh,
      statusKaryawan,
      noKtp,
      noTelp,
      tanggalLahir,
      jenisKelamin,
    }

    Database.updateUser(user.id, updates)

    setIsSubmitting(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogDescription>Perbarui informasi pengguna</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-noKtp">No KTP</Label>
              <Input
                id="edit-noKtp"
                type="text"
                placeholder="Masukkan nomor KTP"
                value={noKtp}
                onChange={(e) => setNoKtp(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-noTelp">No Telp (WhatsApp)</Label>
              <Input
                id="edit-noTelp"
                type="tel"
                placeholder="Masukkan nomor telepon"
                value={noTelp}
                onChange={(e) => setNoTelp(e.target.value)}
                required
              />
            </div>
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
              <span className="text-muted-foreground">@3s-gsm.com</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
