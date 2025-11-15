"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, Search, Calendar, Ticket, Download, Edit } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { exportToExcel } from "@/lib/excel-export"

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
  const [namaPesawat, setNamaPesawat] = useState("")
  const [jamKeberangkatan, setJamKeberangkatan] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [isEditMode, setIsEditMode] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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
      const pendingRes = await fetch("/api/workflow?action=pending&role=hr_ticketing&site=all")
      const pending = await pendingRes.json()
      const pendingData = Array.isArray(pending) ? pending : pending?.data || []
      const enhancedPending = await enrichRequestsWithBookingDate(pendingData)
      setpendingRequests(enhancedPending)
      setFilteredRequests(enhancedPending)

      const allRes = await fetch("/api/workflow?action=all&role=hr_ticketing&site=all")
      const all = await allRes.json()
      const allData = Array.isArray(all) ? all : all?.data || []
      const enhancedAll = await enrichRequestsWithBookingDate(allData)
      setAllRequests(enhancedAll)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data pengajuan",
        variant: "destructive",
      })
    }
  }

  const enrichRequestsWithBookingDate = async (requests: LeaveRequest[]) => {
    return Promise.all(
      requests.map(async (request) => {
        try {
          const res = await fetch(`/api/approvals?requestId=${request.id}`)
          const history = await res.json()
          const bookingIssueEntry = Array.isArray(history)
            ? history.find((entry: any) => entry.action === "tiket_issued")
            : null
          return {
            ...request,
            bookingCodeIssuedAt: bookingIssueEntry?.timestamp || request.updatedAt,
          }
        } catch {
          return {
            ...request,
            bookingCodeIssuedAt: request.updatedAt,
          }
        }
      }),
    )
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRequests(activeTab === "pending" ? pendingRequests : allRequests)
      return
    }

    const query = searchQuery.toLowerCase()
    const source = activeTab === "pending" ? pendingRequests : allRequests
    const filtered = source.filter((request) => {
      return (
        (request.userNik?.toLowerCase() || "").includes(query) ||
        (request.userName?.toLowerCase() || "").includes(query) ||
        (request.jabatan?.toLowerCase() || "").includes(query) ||
        (request.departemen?.toLowerCase() || "").includes(query) ||
        (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query)
      )
    })
    setFilteredRequests(filtered)
  }, [searchQuery, pendingRequests, allRequests, activeTab])

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
          action: "update-booking",
          requestId: bookingRequest.id,
          bookingCode: bookingCode.trim(),
          namaPesawat: namaPesawat.trim() || null,
          jamKeberangkatan: jamKeberangkatan || null,
          updatedBy: user?.nik,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Gagal memproses tiket")
      }

      toast({
        title: "Berhasil",
        description: isEditMode
          ? "Informasi tiket berhasil diperbarui"
          : "Tiket berhasil diproses dan informasi telah ditambahkan",
      })

      setBookingDialogOpen(false)
      setBookingRequest(null)
      setBookingCode("")
      setNamaPesawat("")
      setJamKeberangkatan("")
      setIsEditMode(false)
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

  const handleEditTicket = (request: LeaveRequest) => {
    setBookingRequest(request)
    setBookingCode(request.bookingCode || "")
    setNamaPesawat(request.namaPesawat || "")
    setJamKeberangkatan(request.jamKeberangkatan || "")
    setIsEditMode(true)
    setBookingDialogOpen(true)
  }

  const handleExportToExcel = () => {
    try {
      console.log("[v0] Export started")
      console.log("[v0] Start date:", startDate)
      console.log("[v0] End date:", endDate)
      console.log("[v0] All requests count:", allRequests.length)

      let dataToExport = allRequests

      if (startDate || endDate) {
        console.log("[v0] Applying date filter...")
        dataToExport = allRequests.filter((request) => {
          if (!request.bookingCodeIssuedAt) return false

          const issuedDate = new Date(request.bookingCodeIssuedAt)
          issuedDate.setHours(0, 0, 0, 0)

          if (startDate && endDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            const included = issuedDate >= start && issuedDate <= end
            console.log("[v0] Request", request.id, "issued:", issuedDate, "included:", included)
            return included
          } else if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            return issuedDate >= start
          } else if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            return issuedDate <= end
          }
          return true
        })
        console.log("[v0] Filtered data count:", dataToExport.length)
      }

      if (dataToExport.length === 0) {
        console.log("[v0] No data to export")
        const dateRangeMsg =
          startDate && endDate
            ? `antara ${new Date(startDate).toLocaleDateString("id-ID")} dan ${new Date(endDate).toLocaleDateString("id-ID")}`
            : startDate
              ? `dari ${new Date(startDate).toLocaleDateString("id-ID")}`
              : `sampai ${new Date(endDate).toLocaleDateString("id-ID")}`

        toast({
          title: "Tidak Ada Data",
          description:
            startDate || endDate
              ? `Tidak ada tiket yang diproses ${dateRangeMsg}. Coba pilih rentang tanggal yang berbeda.`
              : "Tidak ada data untuk di-export",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Building employee data map...")
      const employeeDataMap = new Map<string, { namaPesawat?: string; lamaOnsite?: number }>()

      const sortedRequests = [...allRequests].sort((a, b) => {
        const dateA = new Date(a.bookingCodeIssuedAt || a.updatedAt || 0).getTime()
        const dateB = new Date(b.bookingCodeIssuedAt || b.updatedAt || 0).getTime()
        return dateB - dateA
      })

      for (const request of sortedRequests) {
        if (!request.userNik) continue
        if (!employeeDataMap.has(request.userNik)) {
          if (request.namaPesawat || request.lamaOnsite) {
            employeeDataMap.set(request.userNik, {
              namaPesawat: request.namaPesawat,
              lamaOnsite: request.lamaOnsite,
            })
          }
        }
      }

      console.log("[v0] Employee data map size:", employeeDataMap.size)

      const enrichedDataToExport = dataToExport.map((request) => {
        const employeeData = request.userNik ? employeeDataMap.get(request.userNik) : null
        return {
          ...request,
          namaPesawat: request.namaPesawat || employeeData?.namaPesawat,
          lamaOnsite: request.lamaOnsite || employeeData?.lamaOnsite,
        }
      })

      const dateRangeText =
        startDate && endDate
          ? `${startDate}_sampai_${endDate}`
          : startDate
            ? `dari_${startDate}`
            : endDate
              ? `sampai_${endDate}`
              : new Date().toISOString().split("T")[0]

      const fileName = `Riwayat_Pengajuan_Cuti_${activeTab}_${dateRangeText}`

      console.log("[v0] Calling exportToExcel with", enrichedDataToExport.length, "records")
      exportToExcel(enrichedDataToExport, fileName)

      toast({
        title: "Berhasil",
        description: `${enrichedDataToExport.length} data berhasil di-export ke Excel`,
      })
    } catch (error) {
      console.error("[v0] Error in handleExportToExcel:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal export Excel",
        variant: "destructive",
      })
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

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Informasi Export Excel</h3>
                <p className="text-sm text-blue-800">
                  Kolom <strong>NAMA PESAWAT</strong> dan <strong>LAMA ONSITE</strong> akan menampilkan data dari
                  database jika tersedia. Untuk record lama yang belum memiliki data ini, gunakan tombol{" "}
                  <strong>"Edit Tiket"</strong> di tab Riwayat untuk melengkapi informasi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Pengajuan Cuti</CardTitle>
                <CardDescription>
                  {activeTab === "pending"
                    ? 'Klik "Proses Tiket" untuk menambahkan kode booking'
                    : "Riwayat semua pengajuan cuti yang sudah diproses"}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="startDate" className="text-xs">
                      Dari Tanggal
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate" className="text-xs">
                      Sampai Tanggal
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportToExcel} className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
                {(startDate || endDate) && (
                  <p className="text-xs text-slate-500 text-right">
                    {startDate && endDate
                      ? `Filter: ${startDate} s/d ${endDate}`
                      : startDate
                        ? `Filter: Dari ${startDate}`
                        : `Filter: Sampai ${endDate}`}
                  </p>
                )}
              </div>
            </div>
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Perlu Diproses ({pendingRequests.length})</TabsTrigger>
                <TabsTrigger value="history">Riwayat ({allRequests.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
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
                                <p className="font-medium text-slate-900">
                                  {request.userName || "Nama tidak tersedia"}
                                </p>
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
              </TabsContent>

              <TabsContent value="history">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchQuery ? "Tidak ada riwayat yang sesuai dengan pencarian" : "Belum ada riwayat pengajuan"}
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
                              {request.status === "tiket_issued" && (!request.namaPesawat || !request.lamaOnsite) && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                  Data Belum Lengkap
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-slate-500">NIK</p>
                                <p className="font-medium text-slate-900">{request.userNik || "-"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Nama</p>
                                <p className="font-medium text-slate-900">
                                  {request.userName || "Nama tidak tersedia"}
                                </p>
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
                          {request.status === "tiket_issued" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTicket(request)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Tiket
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
            <DialogTitle>{isEditMode ? "Edit Informasi Tiket" : "Input Informasi Tiket"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Perbarui" : "Masukkan"} informasi tiket untuk pengajuan cuti {bookingRequest?.userName}
            </DialogDescription>
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
              <Label htmlFor="bookingCode">Kode Booking *</Label>
              <Input
                id="bookingCode"
                placeholder="Masukkan kode booking"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="namaPesawat">
                Nama Pesawat
                <span className="text-xs text-slate-500 ml-2">(akan muncul di Excel)</span>
              </Label>
              <Input
                id="namaPesawat"
                placeholder="Contoh: Garuda Indonesia, Lion Air, dll"
                value={namaPesawat}
                onChange={(e) => setNamaPesawat(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jamKeberangkatan">Jam Keberangkatan</Label>
              <Input
                id="jamKeberangkatan"
                type="time"
                value={jamKeberangkatan}
                onChange={(e) => setJamKeberangkatan(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            {isEditMode && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Catatan:</strong> Data yang Anda input di sini akan otomatis muncul di kolom NAMA PESAWAT pada
                  export Excel.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBookingDialogOpen(false)
                  setBookingRequest(null)
                  setBookingCode("")
                  setNamaPesawat("")
                  setJamKeberangkatan("")
                  setIsEditMode(false)
                }}
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button onClick={handleProcessTicket} disabled={isProcessing || !bookingCode.trim()}>
                {isProcessing ? "Memproses..." : isEditMode ? "Perbarui Informasi Tiket" : "Simpan Informasi Tiket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
