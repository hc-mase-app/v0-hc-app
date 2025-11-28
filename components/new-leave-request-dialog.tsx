"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LEAVE_TYPES } from "@/lib/mock-data"
import { calculateDaysBetween } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User } from "@/lib/types"
import type { LeaveRequest } from "@/lib/types"

interface NewLeaveRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NewLeaveRequestDialog({ open, onOpenChange, onSuccess }: NewLeaveRequestDialogProps) {
  const { user } = useAuth()
  const [nik, setNik] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [nikError, setNikError] = useState("")
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [previousPeriodicLeave, setPreviousPeriodicLeave] = useState<LeaveRequest | null>(null)
  const [isLoadingPreviousLeave, setIsLoadingPreviousLeave] = useState(false)
  const [jenisPengajuanCuti, setJenisPengajuanCuti] = useState("")
  const [jenisPengajuan, setJenisPengajuan] = useState<"dengan_tiket" | "lokal">("dengan_tiket")
  const [tanggalPengajuan, setTanggalPengajuan] = useState(new Date().toISOString().split("T")[0])
  const [tanggalMulai, setTanggalMulai] = useState("")
  const [tanggalSelesai, setTanggalSelesai] = useState("")
  const [berangkatDari, setBerangkatDari] = useState("")
  const [tujuan, setTujuan] = useState("")
  const [tanggalKeberangkatan, setTanggalKeberangkatan] = useState("")
  const [tanggalCutiPeriodikBerikutnya, setTanggalCutiPeriodikBerikutnya] = useState("")
  const [daysUntilNextLeave, setDaysUntilNextLeave] = useState<number | null>(null)
  const [calculatedLamaOnsite, setCalculatedLamaOnsite] = useState<number | null>(null)
  const [catatan, setCatatan] = useState("")
  const [lamaOnsite, setLamaOnsite] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const allowedRoles = ["hr_site", "admin_site", "hr_ticketing"]

  useEffect(() => {
    if (open && user && !allowedRoles.includes(user.role)) {
      setError("Hanya Admin Site, HR Site, atau HR Ticketing yang dapat membuat pengajuan cuti")
      return
    }
  }, [open, user])

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        try {
          const response = await fetch("/api/users")
          if (response.ok) {
            const users = await response.json()
            if (user?.role === "admin_site") {
              const filteredUsers = users.filter((u: User) => u.site === user.site && u.departemen === user.departemen)
              setAllUsers(filteredUsers)
            } else if (user?.role === "hr_site") {
              const filteredUsers = users.filter((u: User) => u.site === user.site)
              setAllUsers(filteredUsers)
            } else if (user?.role === "hr_ticketing") {
              const userSite = user.site?.toUpperCase()
              if (userSite === "HO" || userSite === "ALL") {
                setAllUsers(users)
              } else {
                const filteredUsers = users.filter((u: User) => u.site === user.site)
                setAllUsers(filteredUsers)
              }
            } else {
              setAllUsers(users)
            }
          }
        } catch (error) {
          console.error("Error fetching users:", error)
        }
      }
      fetchUsers()
    }
  }, [open, user])

  useEffect(() => {
    const lookupUser = async () => {
      if (nik.trim()) {
        setIsLoadingUser(true)
        setNikError("")

        try {
          const trimmedNik = nik.trim().toUpperCase()
          const foundUser = allUsers.find((u) => u.nik.trim().toUpperCase() === trimmedNik)

          if (foundUser) {
            setSelectedUser(foundUser)
            setNikError("")
          } else {
            const response = await fetch(`/api/users?nik=${encodeURIComponent(nik.trim())}`)
            if (response.ok) {
              const users = await response.json()
              if (users.length > 0) {
                setSelectedUser(users[0])
                setNikError("")
              } else {
                setSelectedUser(null)
                setNikError("NIK tidak ditemukan")
              }
            } else {
              setSelectedUser(null)
              setNikError("NIK tidak ditemukan")
            }
          }
        } catch (error) {
          console.error("Error looking up user:", error)
          setSelectedUser(null)
          setNikError("Terjadi kesalahan saat mencari NIK")
        } finally {
          setIsLoadingUser(false)
        }
      } else {
        setSelectedUser(null)
        setNikError("")
      }
    }

    const timeoutId = setTimeout(lookupUser, 500)
    return () => clearTimeout(timeoutId)
  }, [nik, allUsers])

  useEffect(() => {
    const fetchPreviousLeave = async () => {
      if (selectedUser && jenisPengajuanCuti === "Cuti Periodik") {
        setIsLoadingPreviousLeave(true)
        try {
          const response = await fetch(`/api/leave-requests/previous?nik=${encodeURIComponent(selectedUser.nik)}`)
          if (response.ok) {
            const result = await response.json()
            setPreviousPeriodicLeave(result.data)
          } else {
            setPreviousPeriodicLeave(null)
          }
        } catch (error) {
          console.error("Error fetching previous leave:", error)
          setPreviousPeriodicLeave(null)
        } finally {
          setIsLoadingPreviousLeave(false)
        }
      } else {
        setPreviousPeriodicLeave(null)
      }
    }

    fetchPreviousLeave()
  }, [selectedUser, jenisPengajuanCuti])

  useEffect(() => {
    if (previousPeriodicLeave && tanggalMulai) {
      const previousEndDate = new Date(previousPeriodicLeave.periodeAkhir)
      const currentStartDate = new Date(tanggalMulai)

      const diffTime = currentStartDate.getTime() - previousEndDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 0) {
        setCalculatedLamaOnsite(diffDays)
        setLamaOnsite(diffDays.toString())
      } else {
        setCalculatedLamaOnsite(null)
        setLamaOnsite("")
      }
    } else {
      setCalculatedLamaOnsite(null)
    }
  }, [previousPeriodicLeave, tanggalMulai])

  useEffect(() => {
    if (previousPeriodicLeave && selectedUser && jenisPengajuanCuti === "Cuti Periodik") {
      const previousEndDate = new Date(previousPeriodicLeave.periodeAkhir)
      const jabatan = selectedUser.jabatan.toLowerCase()

      let daysToAdd = 70 // Default for Admin, GL, SPV

      // Check if position is Head or PJO (56 days)
      if (jabatan.includes("head") || jabatan.includes("pjo")) {
        daysToAdd = 56
      }

      const nextLeaveDate = new Date(previousEndDate)
      nextLeaveDate.setDate(nextLeaveDate.getDate() + daysToAdd)

      const formattedDate = nextLeaveDate.toISOString().split("T")[0]
      setTanggalCutiPeriodikBerikutnya(formattedDate)
    } else {
      setTanggalCutiPeriodikBerikutnya("")
    }
  }, [previousPeriodicLeave, selectedUser, jenisPengajuanCuti])

  useEffect(() => {
    if (tanggalCutiPeriodikBerikutnya) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const nextLeaveDate = new Date(tanggalCutiPeriodikBerikutnya)
      nextLeaveDate.setHours(0, 0, 0, 0)

      const diffTime = nextLeaveDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      setDaysUntilNextLeave(diffDays)
    } else {
      setDaysUntilNextLeave(null)
    }
  }, [tanggalCutiPeriodikBerikutnya])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!user || !allowedRoles.includes(user.role)) {
      setError("Hanya Admin Site, HR Site, atau HR Ticketing yang dapat membuat pengajuan cuti")
      return
    }

    if (!selectedUser) {
      setError("NIK tidak valid atau tidak ditemukan")
      return
    }

    if (!nik || !jenisPengajuanCuti || !tanggalPengajuan || !tanggalMulai || !tanggalSelesai) {
      setError("Semua field wajib harus diisi")
      return
    }

    if (jenisPengajuan === "dengan_tiket") {
      if (!berangkatDari || !tujuan || !tanggalKeberangkatan) {
        setError("Untuk pengajuan dengan tiket, field berangkat dari, tujuan, dan tanggal keberangkatan wajib diisi")
        return
      }
    }

    if (user.role === "hr_ticketing") {
      const userSite = user.site?.toUpperCase()
      if (userSite !== "HO" && userSite !== "ALL" && selectedUser.site !== user.site) {
        setError(`Anda hanya dapat membuat pengajuan untuk site ${user.site}`)
        return
      }
    } else if (selectedUser.site !== user.site) {
      setError(`Anda hanya dapat membuat pengajuan untuk site ${user.site}`)
      return
    }

    if (user.role === "admin_site" && selectedUser.departemen !== user.departemen) {
      setError(`Anda hanya dapat membuat pengajuan untuk departemen ${user.departemen}`)
      return
    }

    if (new Date(tanggalSelesai) < new Date(tanggalMulai)) {
      setError("Tanggal selesai harus setelah tanggal mulai")
      return
    }

    setIsSubmitting(true)

    try {
      const jumlahHari = calculateDaysBetween(tanggalMulai, tanggalSelesai)

      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          nik: selectedUser.nik,
          jenisCuti: jenisPengajuanCuti,
          jenisPengajuan,
          tanggalPengajuan,
          periodeAwal: tanggalMulai,
          periodeAkhir: tanggalSelesai,
          jumlahHari,
          berangkatDari: jenisPengajuan === "dengan_tiket" ? berangkatDari : null,
          tujuan: jenisPengajuan === "dengan_tiket" ? tujuan : null,
          tanggalKeberangkatan: jenisPengajuan === "dengan_tiket" ? tanggalKeberangkatan : null,
          cutiPeriodikBerikutnya: tanggalCutiPeriodikBerikutnya || null,
          catatan: catatan || null,
          lamaOnsite: calculatedLamaOnsite || null,
          submittedBy: user.nik,
          site: selectedUser.site,
          departemen: selectedUser.departemen,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal membuat pengajuan cuti")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Gagal membuat pengajuan cuti")
      }

      console.log("[v0] Leave request created successfully:", result.data)

      setNik("")
      setSelectedUser(null)
      setNikError("")
      setJenisPengajuanCuti("")
      setJenisPengajuan("dengan_tiket")
      setTanggalPengajuan(new Date().toISOString().split("T")[0])
      setTanggalMulai("")
      setTanggalSelesai("")
      setBerangkatDari("")
      setTujuan("")
      setTanggalKeberangkatan("")
      setTanggalCutiPeriodikBerikutnya("")
      setCatatan("")
      setLamaOnsite("")
      setCalculatedLamaOnsite(null)

      onSuccess()
    } catch (error) {
      console.error("[v0] Error creating leave request:", error)
      setError(error instanceof Error ? error.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajukan Pengajuan Cuti Baru</DialogTitle>
          <DialogDescription>Isi formulir di bawah ini untuk mengajukan cuti</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nik">NIK</Label>
            <Input
              id="nik"
              type="text"
              placeholder="Masukkan NIK karyawan (huruf atau angka)"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              required
              className={nikError ? "border-red-500" : ""}
            />
            {isLoadingUser && <p className="text-sm text-blue-500">Mencari NIK...</p>}
            {nikError && <p className="text-sm text-red-500">{nikError}</p>}
            {selectedUser && <p className="text-sm text-green-600">✓ NIK ditemukan</p>}
          </div>

          {selectedUser && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border-2 border-primary/20">
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Nama</Label>
                <p className="text-sm font-medium">{selectedUser.nama}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Jabatan</Label>
                <p className="text-sm font-medium">{selectedUser.jabatan}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Departemen</Label>
                <p className="text-sm font-medium">{selectedUser.departemen}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Tanggal Lahir</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedUser.tanggalLahir).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Jenis Kelamin</Label>
                <p className="text-sm font-medium">{selectedUser.jenisKelamin}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">POH</Label>
                <p className="text-sm font-medium">{selectedUser.poh}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Site / Lokasi Kerja</Label>
                <p className="text-sm font-medium">{selectedUser.site}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Status Karyawan</Label>
                <p className="text-sm font-medium">{selectedUser.statusKaryawan}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">No KTP</Label>
                <p className="text-sm font-medium">{selectedUser.noKtp}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">No Telp</Label>
                <p className="text-sm font-medium">{selectedUser.noTelp}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-600">Email</Label>
                <p className="text-sm font-medium">{selectedUser.email}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jenisPengajuanCuti">Jenis Cuti</Label>
              <Select value={jenisPengajuanCuti} onValueChange={setJenisPengajuanCuti}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis cuti" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggalPengajuan">Tanggal Pengajuan</Label>
              <Input
                id="tanggalPengajuan"
                type="date"
                value={tanggalPengajuan}
                onChange={(e) => setTanggalPengajuan(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenisTiket">Jenis Pengajuan</Label>
            <Select
              value={jenisPengajuan}
              onValueChange={(value) => setJenisPengajuan(value as "dengan_tiket" | "lokal")}
            >
              <SelectTrigger id="jenisTiket">
                <SelectValue placeholder="Pilih jenis pengajuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dengan_tiket">Dengan Tiket Perjalanan</SelectItem>
                <SelectItem value="lokal">Cuti Lokal (Tanpa Tiket)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggalMulai">Tanggal Mulai Cuti</Label>
              <Input
                id="tanggalMulai"
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggalSelesai">Tanggal Akhir Cuti</Label>
              <Input
                id="tanggalSelesai"
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                required
              />
            </div>
          </div>

          {tanggalMulai && tanggalSelesai && new Date(tanggalSelesai) >= new Date(tanggalMulai) && (
            <div className="space-y-1">
              <div className="text-sm text-slate-600">
                Durasi: {calculateDaysBetween(tanggalMulai, tanggalSelesai)} hari
              </div>
              {jenisPengajuanCuti === "Cuti Periodik" && calculatedLamaOnsite !== null && (
                <div className="text-sm text-slate-600">Lama Onsite: {calculatedLamaOnsite} hari</div>
              )}
            </div>
          )}

          {jenisPengajuanCuti === "Cuti Periodik" && selectedUser && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-2">
              <h3 className="font-semibold text-blue-900">Informasi Cuti Periodik</h3>

              {isLoadingPreviousLeave ? (
                <p className="text-sm text-blue-700">Memuat data cuti sebelumnya...</p>
              ) : previousPeriodicLeave ? (
                <div className="text-sm">
                  <p className="text-blue-700">
                    <span className="font-medium">Cuti Periodik Terakhir:</span>{" "}
                    {new Date(previousPeriodicLeave.periodeAwal).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(previousPeriodicLeave.periodeAkhir).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-blue-700">Tidak ada data cuti periodik sebelumnya.</p>
              )}
            </div>
          )}

          {jenisPengajuan === "dengan_tiket" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="berangkatDari">Berangkat dari</Label>
                  <Input
                    id="berangkatDari"
                    type="text"
                    placeholder="Lokasi keberangkatan"
                    value={berangkatDari}
                    onChange={(e) => setBerangkatDari(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tujuan">Tujuan</Label>
                  <Input
                    id="tujuan"
                    type="text"
                    placeholder="Lokasi tujuan"
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggalKeberangkatan" className="font-bold uppercase">
                  Tanggal Keberangkatan
                </Label>
                <Input
                  id="tanggalKeberangkatan"
                  type="date"
                  value={tanggalKeberangkatan}
                  onChange={(e) => setTanggalKeberangkatan(e.target.value)}
                />
              </div>
            </>
          )}

          {jenisPengajuanCuti !== "Cuti Periodik" && (
            <div className="space-y-2">
              <Label htmlFor="lamaOnsite">Lama Onsite (dalam hari)</Label>
              <Input
                id="lamaOnsite"
                type="number"
                min="0"
                placeholder="Masukkan lama onsite dalam hari"
                value={lamaOnsite}
                onChange={(e) => setLamaOnsite(e.target.value)}
              />
              <p className="text-xs text-slate-500">Opsional: Isi jika karyawan akan onsite</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan Khusus (Bila Pengajuan tidak sesuai Roster atau tidak sesuai POH)</Label>
            <Textarea
              id="catatan"
              placeholder="Catatan tambahan jika ada"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
            />
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
            <Button type="submit" disabled={isSubmitting || !selectedUser}>
              {isSubmitting ? "Mengirim..." : "Ajukan Cuti"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
