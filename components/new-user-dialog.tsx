"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database } from "@/lib/database"
import { SITES } from "@/lib/mock-data"
import { generateId } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { UserRole } from "@/lib/types"

const DEPARTMENTS = ["Operation", "Produksi", "Plant", "SCM", "HCGA", "HSE", "Finance", "Accounting", "BOD"]
const JABATAN = ["Admin Site", "GL", "SPV", "Head", "Deputy", "PJO", "Manager", "GM", "Direksi"]

interface NewUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NewUserDialog({ open, onOpenChange, onSuccess }: NewUserDialogProps) {
  const [nik, setNik] = useState("")
  const [nama, setNama] = useState("")
  const [emailPrefix, setEmailPrefix] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole | "">("")
  const [site, setSite] = useState("")
  const [jabatan, setJabatan] = useState("")
  const [departemen, setDepartemen] = useState("")
  const [poh, setPoh] = useState("")
  const [statusKaryawan, setStatusKaryawan] = useState<"Kontrak" | "Tetap" | "">("")
  const [noKtp, setNoKtp] = useState("")
  const [noTelp, setNoTelp] = useState("")
  const [tanggalLahir, setTanggalLahir] = useState("")
  const [jenisKelamin, setJenisKelamin] = useState<"Laki-laki" | "Perempuan" | "">("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

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

    const existingUsers = Database.getUsers()
    if (existingUsers.some((u) => u.nik === nik)) {
      setError("NIK sudah terdaftar")
      return
    }

    setIsSubmitting(true)

    const email = `${emailPrefix}@3s-gsm.com`

    const newUser = {
      id: generateId("user"),
      nik,
      nama,
      email,
      password,
      role: role as UserRole,
      site,
      jabatan,
      departemen,
      poh,
      statusKaryawan: statusKaryawan as "Kontrak" | "Tetap",
      noKtp,
      noTelp,
      tanggalBergabung: new Date().toISOString().split("T")[0],
      tanggalLahir,
      jenisKelamin: jenisKelamin as "Laki-laki" | "Perempuan",
    }

    Database.addUser(newUser)

    setNik("")
    setNama("")
    setEmailPrefix("")
    setPassword("")
    setRole("")
    setSite("")
    setJabatan("")
    setDepartemen("")
    setPoh("")
    setStatusKaryawan("")
    setNoKtp("")
    setNoTelp("")
    setTanggalLahir("")
    setJenisKelamin("")
    setIsSubmitting(false)

    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          <DialogDescription>Isi formulir di bawah ini untuk menambahkan pengguna baru</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nik">NIK</Label>
              <Input
                id="nik"
                type="text"
                placeholder="Masukkan NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
              <Input
                id="tanggalLahir"
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
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
              <Label htmlFor="jabatan">Jabatan</Label>
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
              <Label htmlFor="departemen">Departemen</Label>
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
              <Label htmlFor="role">Role</Label>
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
              <Label htmlFor="site">Site</Label>
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
              <Label htmlFor="poh">POH</Label>
              <Input
                id="poh"
                type="text"
                placeholder="Masukkan POH"
                value={poh}
                onChange={(e) => setPoh(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusKaryawan">Status Karyawan</Label>
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
              <Label htmlFor="noKtp">No KTP</Label>
              <Input
                id="noKtp"
                type="text"
                placeholder="Masukkan nomor KTP"
                value={noKtp}
                onChange={(e) => setNoKtp(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noTelp">No Telp (WhatsApp)</Label>
              <Input
                id="noTelp"
                type="tel"
                placeholder="Masukkan nomor telepon"
                value={noTelp}
                onChange={(e) => setNoTelp(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
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
              {isSubmitting ? "Menyimpan..." : "Tambah Pengguna"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
