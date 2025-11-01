"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { LeaveRequest, ApprovalHistory } from "@/lib/types"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { Calendar, FileText, Clock, MapPin, Plane, User } from "lucide-react"
import { ApprovalTimeline } from "@/components/approval-timeline"
import { ApprovalProgress } from "@/components/approval-progress"

interface LeaveRequestDetailDialogProps {
  request: LeaveRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function LeaveRequestDetailDialog({ request, open, onOpenChange }: LeaveRequestDetailDialogProps) {
  const [history, setHistory] = useState<ApprovalHistory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && request.id) {
      loadApprovalHistory()
    }
  }, [request.id, open])

  const loadApprovalHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/approvals?type=by-request&requestId=${request.id}`)
      const data = await response.json()
      setHistory(
        data.sort(
          (a: ApprovalHistory, b: ApprovalHistory) =>
            new Date(a.createdAt || a.timestamp).getTime() - new Date(b.createdAt || b.timestamp).getTime(),
        ),
      )
    } catch (error) {
      console.error("Error loading approval history:", error)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Cuti</DialogTitle>
          <DialogDescription>Informasi lengkap dan riwayat persetujuan</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Badge className={`${getStatusColor(request.status)} text-base px-3 py-1`}>
              {getStatusLabel(request.status)}
            </Badge>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-slate-700" />
              <h3 className="font-semibold text-slate-900">Data Karyawan</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">NIK</p>
                <p className="font-medium">{request.userNik}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nama</p>
                <p className="font-medium">{request.userName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Jabatan</p>
                <p className="font-medium">{request.jabatan}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Departemen</p>
                <p className="font-medium">{request.departemen}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tanggal Lahir</p>
                <p className="font-medium">
                  {request.tanggalLahir
                    ? new Date(request.tanggalLahir).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Jenis Kelamin</p>
                <p className="font-medium">{request.jenisKelamin || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Site / Lokasi Kerja</p>
                <p className="font-medium">{request.site}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">POH</p>
                <p className="font-medium">{request.poh}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status Karyawan</p>
                <p className="font-medium">{request.statusKaryawan}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">No Telp</p>
                <p className="font-medium">{request.noTelp}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-sm break-all">{request.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">No KTP</p>
                <p className="font-medium">{request.noKtp}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-3">Detail Pengajuan Cuti</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Jenis Pengajuan Cuti</p>
                  <p className="font-medium">{request.jenisPengajuanCuti}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Tanggal Pengajuan</p>
                  <p className="font-medium">{formatDate(request.tanggalPengajuan)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Periode Cuti</p>
                  <p className="font-medium">
                    {formatDate(request.tanggalMulai)} - {formatDate(request.tanggalSelesai)}
                  </p>
                  <p className="text-sm text-slate-600">{request.jumlahHari} hari</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Berangkat dari</p>
                  <p className="font-medium">{request.berangkatDari}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Plane className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Tujuan</p>
                  <p className="font-medium">{request.tujuan}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Tanggal Keberangkatan</p>
                  <p className="font-medium">{formatDate(request.tanggalKeberangkatan)}</p>
                </div>
              </div>

              {request.tanggalCutiPeriodikBerikutnya && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Cuti Periodik Berikutnya</p>
                    <p className="font-medium">{formatDate(request.tanggalCutiPeriodikBerikutnya)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {request.catatan && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 mb-2">Catatan:</p>
              <p className="text-sm text-amber-800">{request.catatan}</p>
            </div>
          )}

          {request.bookingCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 mb-1">Kode Booking:</p>
              <p className="text-base font-medium text-green-800">{request.bookingCode}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-4 text-slate-500">Memuat riwayat persetujuan...</div>
          ) : (
            <>
              <ApprovalProgress request={request} history={history} />
              <ApprovalTimeline history={history} currentStatus={request.status} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
