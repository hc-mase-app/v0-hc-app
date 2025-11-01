"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, Search, Calendar, Ticket } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function HRTicketingDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [pendingRequests, setpendingRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingRequest, setBookingRequest] = useState<LeaveRequest | null>(null)
  const [bookingCode, setBookingCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (user.role !== "hr_ticketing") {
      router.push("/dashboard")
      return
    }

    loadData()
  }, [user, isAuthenticated, router])

  const loadData = async () => {
    try {
      const pendingRes = await fetch("/api/workflow?action=pending")
      const pending = await pendingRes.json()
      setpendingRequests(Array.isArray(pending) ? pending : [])
      setFilteredRequests(Array.isArray(pending) ? pending : [])

      const allRes = await fetch("/api/workflow?action=all")
      const all = await allRes.json()
      setAllRequests(Array.isArray(all) ? all : [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data pengajuan",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRequests(pendingRequests)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = pendingRequests.filter((request) => {
      return (
        (request.userNik?.toLowerCase() || "").includes(query) ||
        (request.userName?.toLowerCase() || "").includes(query) ||
        (request.jabatan?.toLowerCase() || "").includes(query) ||
        (request.departemen?.toLowerCase() || "").includes(query) ||
        (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query)
      )
    })
    setFilteredRequests(filtered)
  }, [searchQuery, pendingRequests])

  const handleProcessTicket = async () => {
    if (!bookingRequest || !bookingCode.trim()) {
      toast({
        title: "Error",
        description: "Kode booking harus diisi",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process-ticket",
          requestId: bookingRequest.id,
          bookingCode: bookingCode.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Gagal memproses tiket")
      }

      toast({
        title: "Berhasil",
        description: "Tiket berhasil diproses dan kode booking telah ditambahkan",
      })

      setBookingDialogOpen(false)
      setBookingRequest(null)
      setBookingCode("")
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memproses tiket",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!user) return null

  return (
    <DashboardLayout title="Dashboard HR Ticketing">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perlu Diproses</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">Status: Di Proses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiket Issued</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allRequests.filter((r) => r.status === "tiket_issued").length}</div>
              <p className="text-xs text-muted-foreground">Sudah ada kode booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Riwayat</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allRequests.length}</div>
              <p className="text-xs text-muted-foreground">Semua pengajuan</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Proses Tiket & Input Booking</h2>
          <p className="text-sm text-slate-600">
            Tambahkan kode booking untuk pengajuan yang sudah disetujui (status: Di Proses)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pengajuan Perlu Diproses</CardTitle>
            <CardDescription>Klik "Proses Tiket" untuk menambahkan kode booking</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari berdasarkan NIK, nama, jabatan, atau departemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">
                  {searchQuery
                    ? "Tidak ada pengajuan yang sesuai dengan pencarian"
                    : "Tidak ada tiket yang perlu diproses"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{request.jenisPengajuanCuti}</h3>
                          <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-slate-500">NIK</p>
                            <p className="font-medium text-slate-900">{request.userNik || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Nama</p>
                            <p className="font-medium text-slate-900">{request.userName || "Nama tidak tersedia"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Jabatan</p>
                            <p className="font-medium text-slate-900">{request.jabatan || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Departemen</p>
                            <p className="font-medium text-slate-900">{request.departemen || "-"}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-slate-500 font-bold uppercase">Tanggal Keberangkatan</p>
                              <p className="font-medium text-slate-900">
                                {request.tanggalKeberangkatan ? formatDate(request.tanggalKeberangkatan) : "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                        className="flex-1"
                      >
                        Lihat Detail
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setBookingRequest(request)
                          setBookingDialogOpen(true)
                        }}
                        className="flex-1"
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        Proses Tiket
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      {selectedRequest && (
        <LeaveRequestDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onUpdate={loadData}
        />
      )}

      {/* Booking Code Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Kode Booking</DialogTitle>
            <DialogDescription>Masukkan kode booking untuk pengajuan cuti {bookingRequest?.userName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {bookingRequest && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">NIK:</span>
                  <span className="font-medium">{bookingRequest.userNik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nama:</span>
                  <span className="font-medium">{bookingRequest.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Jenis Cuti:</span>
                  <span className="font-medium">{bookingRequest.jenisPengajuanCuti}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tanggal Keberangkatan:</span>
                  <span className="font-medium">
                    {bookingRequest.tanggalKeberangkatan ? formatDate(bookingRequest.tanggalKeberangkatan) : "-"}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bookingCode">Kode Booking</Label>
              <Input
                id="bookingCode"
                placeholder="Masukkan kode booking"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBookingDialogOpen(false)
                  setBookingRequest(null)
                  setBookingCode("")
                }}
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button onClick={handleProcessTicket} disabled={isProcessing || !bookingCode.trim()}>
                {isProcessing ? "Memproses..." : "Simpan Kode Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
