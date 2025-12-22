"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { LeaveRequest, ApprovalHistory } from "@/lib/types"
import { formatDate, getStatusColor, getDetailedTicketStatus } from "@/lib/utils"
import { Calendar, FileText, Clock, MapPin, Plane, User, Download } from "lucide-react"
import { ApprovalTimeline } from "@/components/approval-timeline"
import { ApprovalProgress } from "@/components/approval-progress"
import { Button } from "@/components/ui/button"
import { downloadDepartureTicketPDF, downloadReturnTicketPDF } from "@/components/ticket-pdf-generator"
import { useAuth } from "@/lib/auth-context"

interface LeaveRequestDetailDialogProps {
  request: LeaveRequest
  open: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  onUpdate?: () => void
  isUserRole?: boolean
}

export function LeaveRequestDetailDialog({
  request,
  open,
  onOpenChange,
  onClose,
  isUserRole,
}: LeaveRequestDetailDialogProps) {
  const [history, setHistory] = useState<ApprovalHistory[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose?.()
    }
    onOpenChange?.(newOpen)
  }

  const canDownloadTickets = isUserRole || user?.role === "admin_site"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Detail Pengajuan Cuti</DialogTitle>
              <DialogDescription>Informasi lengkap dan riwayat persetujuan</DialogDescription>
            </div>
            {canDownloadTickets && (
              <div className="flex gap-2">
                {request.bookingCode && request.statusTiketBerangkat === "issued" && (
                  <Button
                    onClick={() => downloadDepartureTicketPDF(request)}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Tiket Berangkat</span>
                    <span className="sm:hidden">Berangkat</span>
                  </Button>
                )}
                {request.bookingCodeBalik && request.statusTiketBalik === "issued" && (
                  <Button
                    onClick={() => downloadReturnTicketPDF(request)}
                    className="gap-2 bg-green-600 hover:bg-green-700 whitespace-nowrap"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Tiket Balik</span>
                    <span className="sm:hidden">Balik</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Badge className={`${getStatusColor(request.status)} text-base px-3 py-1`}>
              {getDetailedTicketStatus(request.status, request.statusTiketBerangkat, request.statusTiketBalik)}
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
                <p className="font-medium">{request.noTelp || "Belum diisi"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-sm break-all">{request.email || "Belum diisi"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">No KTP</p>
                <p className="font-medium">{request.noKtp || "Belum diisi"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-3">Detail Pengajuan Cuti</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Jenis Cuti</p>
                  <p className="font-medium">{request.jenisPengajuanCuti}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Jenis Pengajuan</p>
                  <Badge variant={request.jenisPengajuan === "lokal" ? "secondary" : "default"} className="mt-1">
                    {request.jenisPengajuan === "lokal" ? "Cuti Lokal (Tanpa Tiket)" : "Dengan Tiket Perjalanan"}
                  </Badge>
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
                    {request.periodeAwal && request.periodeAkhir
                      ? `${formatDate(request.periodeAwal)} - ${formatDate(request.periodeAkhir)}`
                      : request.tanggalMulai && request.tanggalSelesai
                        ? `${formatDate(request.tanggalMulai)} - ${formatDate(request.tanggalSelesai)}`
                        : "-"}
                  </p>
                  <p className="text-sm text-slate-600">{request.jumlahHari} hari</p>
                </div>
              </div>

              {request.jenisPengajuan === "dengan_tiket" && (
                <>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Berangkat dari</p>
                      <p className="font-medium">{request.berangkatDari || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Plane className="h-4 w-4 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Tujuan</p>
                      <p className="font-medium">{request.tujuan || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">Tanggal Keberangkatan</p>
                      <p className="font-medium">
                        {request.tanggalKeberangkatan ? formatDate(request.tanggalKeberangkatan) : "-"}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {request.lamaOnsite && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Lama Onsite</p>
                    <p className="font-medium">{request.lamaOnsite} hari</p>
                  </div>
                </div>
              )}

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

          {(request.namaPesawat || request.jamKeberangkatan || request.bookingCode) && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Plane className="h-5 w-5 text-blue-700" />
                <h3 className="font-semibold text-blue-900">Informasi Tiket Berangkat</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.namaPesawat && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Nama Pesawat</p>
                      <p className="font-semibold text-blue-900">{request.namaPesawat}</p>
                    </div>
                  )}
                  {request.jamKeberangkatan && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Jam Keberangkatan</p>
                      <p className="font-semibold text-blue-900">{request.jamKeberangkatan}</p>
                    </div>
                  )}
                </div>
                {request.bookingCode && (
                  <div className="pt-2 border-t border-blue-300">
                    <p className="text-xs text-blue-600 font-medium mb-1">Kode Booking Berangkat:</p>
                    <p className="text-lg font-bold text-blue-900">{request.bookingCode}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(request.namaPesawatBalik || request.jamKeberangkatanBalik || request.bookingCodeBalik) && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Plane className="h-5 w-5 text-green-700 rotate-180" />
                <h3 className="font-semibold text-green-900">Informasi Tiket Balik</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.namaPesawatBalik && (
                    <div>
                      <p className="text-xs text-green-600 font-medium">Nama Pesawat</p>
                      <p className="font-semibold text-green-900">{request.namaPesawatBalik}</p>
                    </div>
                  )}
                  {request.jamKeberangkatanBalik && (
                    <div>
                      <p className="text-xs text-green-600 font-medium">Jam Keberangkatan</p>
                      <p className="font-semibold text-green-900">{request.jamKeberangkatanBalik}</p>
                    </div>
                  )}
                  {request.tanggalBerangkatBalik && (
                    <div>
                      <p className="text-xs text-green-600 font-medium">Tanggal Keberangkatan</p>
                      <p className="font-semibold text-green-900">{formatDate(request.tanggalBerangkatBalik)}</p>
                    </div>
                  )}
                  {request.berangkatDariBalik && (
                    <div>
                      <p className="text-xs text-green-600 font-medium">Berangkat Dari</p>
                      <p className="font-semibold text-green-900">{request.berangkatDariBalik}</p>
                    </div>
                  )}
                  {request.tujuanBalik && (
                    <div>
                      <p className="text-xs text-green-600 font-medium">Tujuan</p>
                      <p className="font-semibold text-green-900">{request.tujuanBalik}</p>
                    </div>
                  )}
                </div>
                {request.bookingCodeBalik && (
                  <div className="pt-2 border-t border-green-300">
                    <p className="text-xs text-green-600 font-medium mb-1">Kode Booking Balik:</p>
                    <p className="text-lg font-bold text-green-900">{request.bookingCodeBalik}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-4 text-slate-500">Memuat riwayat persetujuan...</div>
          ) : (
            <>
              <ApprovalProgress request={request} history={history} />
              <ApprovalTimeline
                history={history}
                currentStatus={request.status}
                statusTiketBerangkat={request.statusTiketBerangkat}
                statusTiketBalik={request.statusTiketBalik}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
