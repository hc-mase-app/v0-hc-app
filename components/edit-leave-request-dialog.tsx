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
import type { LeaveRequest } from "@/lib/types"

interface EditLeaveRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  leaveRequest: LeaveRequest
}

export function EditLeaveRequestDialog({ open, onOpenChange, onSuccess, leaveRequest }: EditLeaveRequestDialogProps) {
  const { user } = useAuth()
  const [previousPeriodicLeave, setPreviousPeriodicLeave] = useState<LeaveRequest | null>(null)
  const [isLoadingPreviousLeave, setIsLoadingPreviousLeave] = useState(false)
  const [jenisPengajuanCuti, setJenisPengajuanCuti] = useState(leaveRequest.jenisCuti)
  const [jenisPengajuan, setJenisPengajuan] = useState<"dengan_tiket" | "lokal">(leaveRequest.jenisPengajuan)
  const [tanggalPengajuan, setTanggalPengajuan] = useState(leaveRequest.tanggalPengajuan.split("T")[0])
  const [tanggalMulai, setTanggalMulai] = useState(leaveRequest.periodeAwal.split("T")[0])
  const [tanggalSelesai, setTanggalSelesai] = useState(leaveRequest.periodeAkhir.split("T")[0])
  const [berangkatDari, setBerangkatDari] = useState(leaveRequest.berangkatDari || "")
  const [tujuan, setTujuan] = useState(leaveRequest.tujuan || "")
  const [tanggalKeberangkatan, setTanggalKeberangkatan] = useState(
    leaveRequest.tanggalKeberangkatan ? leaveRequest.tanggalKeberangkatan.split("T")[0] : "",
  )
  const [tanggalCutiPeriodikBerikutnya, setTanggalCutiPeriodikBerikutnya] = useState(
    leaveRequest.cutiPeriodikBerikutnya ? leaveRequest.cutiPeriodikBerikutnya.split("T")[0] : "",
  )
  const [daysUntilNextLeave, setDaysUntilNextLeave] = useState<number | null>(null)
  const [calculatedLamaOnsite, setCalculatedLamaOnsite] = useState<number | null>(null)
  const [catatan, setCatatan] = useState(leaveRequest.catatan || "")
  const [lamaOnsite, setLamaOnsite] = useState(leaveRequest.lamaOnsite?.toString() || "")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchPreviousLeave = async () => {
      if (leaveRequest && jenisPengajuanCuti === "Cuti Periodik") {
        setIsLoadingPreviousLeave(true)
        try {
          const response = await fetch(`/api/leave-requests/previous?nik=${encodeURIComponent(leaveRequest.nik)}`)
          if (response.ok) {
            const result = await response.json()
            if (result.data && result.data.id !== leaveRequest.id) {
              setPreviousPeriodicLeave(result.data)
            } else {
              setPreviousPeriodicLeave(null)
            }
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
  }, [leaveRequest, jenisPengajuanCuti])

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
    if (previousPeriodicLeave && leaveRequest && jenisPengajuanCuti === "Cuti Periodik") {
      const previousEndDate = new Date(previousPeriodicLeave.periodeAkhir)
      const jabatan = leaveRequest.jabatan.toLowerCase()

      let daysToAdd = 70

      if (jabatan.includes("head") || jabatan.includes("pjo")) {
        daysToAdd = 56
      }

      const nextLeaveDate = new Date(previousEndDate)
      nextLeaveDate.setDate(nextLeaveDate.getDate() + daysToAdd)

      const formattedDate = nextLeaveDate.toISOString().split("T")[0]
      setTanggalCutiPeriodikBerikutnya(formattedDate)
    }
  }, [previousPeriodicLeave, leaveRequest, jenisPengajuanCuti])

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

    if (!user || (user.role !== "hr_site" && user.role !== "admin_site")) {
      setError("Hanya Admin Site atau HR Site yang dapat mengedit pengajuan cuti")
      return
    }

    if (leaveRequest.bookingCode) {
      setError("Pengajuan yang sudah diproses HR Ticketing (memiliki booking code) tidak dapat diedit")
      return
    }

    if (!jenisPengajuanCuti || !tanggalPengajuan || !tanggalMulai || !tanggalSelesai) {
      setError("Semua field wajib harus diisi")
      return
    }

    if (jenisPengajuan === "dengan_tiket") {
      if (!berangkatDari || !tujuan || !tanggalKeberangkatan) {
        setError("Untuk pengajuan dengan tiket, field berangkat dari, tujuan, dan tanggal keberangkatan wajib diisi")
        return
      }
    }

    if (new Date(tanggalSelesai) < new Date(tanggalMulai)) {
      setError("Tanggal selesai harus setelah tanggal mulai")
      return
    }

    setIsSubmitting(true)

    try {
      const jumlahHari = calculateDaysBetween(tanggalMulai, tanggalSelesai)

      const response = await fetch(`/api/leave-requests`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: leaveRequest.id,
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
          lamaOnsite: lamaOnsite ? Number.parseInt(lamaOnsite) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal mengupdate pengajuan cuti")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Gagal mengupdate pengajuan cuti")
      }

      console.log("[v0] Leave request updated successfully:", result.data)

      onSuccess()
    } catch (error) {
      console.error("[v0] Error updating leave request:", error)
      setError(error instanceof Error ? error.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pengajuan Cuti</DialogTitle>
          <DialogDescription>
            Edit data pengajuan cuti untuk {leaveRequest.nama} ({leaveRequest.nik})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border-2 border-primary/20">
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">NIK</Label>
              <p className="text-sm font-medium">{leaveRequest.nik}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Nama</Label>
              <p className="text-sm font-medium">{leaveRequest.nama}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Jabatan</Label>
              <p className="text-sm font-medium">{leaveRequest.jabatan}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Departemen</Label>
              <p className="text-sm font-medium">{leaveRequest.departemen}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Site</Label>
              <p className="text-sm font-medium">{leaveRequest.site}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Status</Label>
              <p className="text-sm font-medium">{leaveRequest.status}</p>
            </div>
          </div>

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

          {jenisPengajuanCuti === "Cuti Periodik" && leaveRequest && (
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

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="tanggalCutiPeriodikBerikutnya">Tanggal Cuti Periodik Berikutnya</Label>
                  <Input
                    id="tanggalCutiPeriodikBerikutnya"
                    type="date"
                    value={tanggalCutiPeriodikBerikutnya}
                    onChange={(e) => setTanggalCutiPeriodikBerikutnya(e.target.value)}
                  />
                  {daysUntilNextLeave !== null && (
                    <p className="text-sm text-slate-600 mt-1">
                      {daysUntilNextLeave > 0 ? (
                        <span className="font-medium text-blue-600">
                          {daysUntilNextLeave} hari lagi menjelang cuti berikutnya
                        </span>
                      ) : daysUntilNextLeave === 0 ? (
                        <span className="font-medium text-green-600">Cuti periodik hari ini</span>
                      ) : (
                        <span className="font-medium text-orange-600">
                          Tanggal cuti periodik sudah terlewat ({Math.abs(daysUntilNextLeave)} hari yang lalu)
                        </span>
                      )}
                    </p>
                  )}
                </div>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
