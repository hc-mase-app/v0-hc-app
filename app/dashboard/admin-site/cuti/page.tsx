"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  FileText,
  Clock,
  XCircle,
  Search,
  Calendar,
  ArrowLeft,
  Edit,
  Plane,
  Ticket,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { formatDate, getStatusLabel, getStatusColor, getDetailedTicketStatus } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NewLeaveRequestDialog } from "@/components/new-leave-request-dialog"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { EditLeaveRequestDialog } from "@/components/edit-leave-request-dialog"
import Link from "next/link"

const ITEMS_PER_PAGE = 5

export default function AdminSiteCutiPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    menunggu: 0,
    tiketBerangkat: 0,
    tiketLengkap: 0,
    cutiLokal: 0,
    diProses: 0,
    ditolak: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const loadData = useCallback(async () => {
    if (!user?.site) return

    try {
      setLoading(true)

      const response = await fetch(
        `/api/workflow?action=all&role=admin_site&site=${encodeURIComponent(user.site)}&departemen=${encodeURIComponent(user.departemen || "")}`,
      )
      const result = await response.json()

      const data = result?.success && Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : []

      console.log("[v0] Admin Site Cuti loaded data:", data.length, "requests")

      if (!response.ok) {
        console.error("[Admin Site Cuti] API error:", result)
        setRequests([])
        setFilteredRequests([])
        return
      }

      const sortedRequests = data.sort(
        (a: LeaveRequest, b: LeaveRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      setRequests(sortedRequests)
      setFilteredRequests(sortedRequests)

      const menunggu = sortedRequests.filter(
        (r: LeaveRequest) =>
          r.status === "pending_dic" ||
          r.status === "pending_pjo" ||
          r.status === "pending_manager_ho" ||
          r.status === "pending_hr_ho",
      ).length

      const tiketLengkap = sortedRequests.filter(
        (r: LeaveRequest) =>
          (r.bookingCode && r.bookingCodeBalik) ||
          (r.statusTiketBerangkat === "issued" && r.statusTiketBalik === "issued"),
      ).length

      const tiketBerangkat = sortedRequests.filter(
        (r: LeaveRequest) =>
          (r.bookingCode && !r.bookingCodeBalik) ||
          (r.statusTiketBerangkat === "issued" && r.statusTiketBalik !== "issued"),
      ).length

      const cutiLokal = sortedRequests.filter(
        (r: LeaveRequest) => r.jenisPengajuanCuti?.toLowerCase().includes("lokal") || r.status === "approved",
      ).length

      const ditolak = sortedRequests.filter((r: LeaveRequest) => r.status?.includes("ditolak")).length

      const diProses = sortedRequests.filter((r: LeaveRequest) => {
        const needsTicket = !r.jenisPengajuanCuti?.toLowerCase().includes("lokal")
        const noTicketsYet =
          !r.bookingCode &&
          !r.bookingCodeBalik &&
          r.statusTiketBerangkat !== "issued" &&
          r.statusTiketBalik !== "issued"
        const isInProcess = r.status === "di_proses" || r.status === "tiket_issued"

        return needsTicket && noTicketsYet && isInProcess
      }).length

      setStats({
        total: sortedRequests.length,
        menunggu,
        tiketBerangkat,
        tiketLengkap,
        cutiLokal,
        diProses,
        ditolak,
      })

      console.log(
        "[v0] Stats breakdown:",
        "Total:",
        sortedRequests.length,
        "Menunggu:",
        menunggu,
        "Tiket Berangkat:",
        tiketBerangkat,
        "Tiket Lengkap:",
        tiketLengkap,
        "Cuti Lokal:",
        cutiLokal,
        "Di Proses:",
        diProses,
        "Ditolak:",
        ditolak,
      )
    } catch (error) {
      console.error("[Admin Site Cuti] Error loading data:", error)
      setRequests([])
      setFilteredRequests([])
    } finally {
      setLoading(false)
    }
  }, [user?.site, user?.departemen])

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "admin_site") {
      router.push("/login")
      return
    }
    loadData()
  }, [user, isAuthenticated, router, loadData])

  useEffect(() => {
    let filtered = requests

    if (statusFilter === "menunggu") {
      filtered = filtered.filter(
        (r) =>
          r.status === "pending_dic" ||
          r.status === "pending_pjo" ||
          r.status === "pending_manager_ho" ||
          r.status === "pending_hr_ho",
      )
    } else if (statusFilter === "tiket_berangkat") {
      filtered = filtered.filter(
        (r) =>
          (r.bookingCode && !r.bookingCodeBalik) ||
          (r.statusTiketBerangkat === "issued" && r.statusTiketBalik !== "issued"),
      )
    } else if (statusFilter === "tiket_lengkap") {
      filtered = filtered.filter(
        (r) =>
          (r.bookingCode && r.bookingCodeBalik) ||
          (r.statusTiketBerangkat === "issued" && r.statusTiketBalik === "issued"),
      )
    } else if (statusFilter === "cuti_lokal") {
      filtered = filtered.filter(
        (r) => r.jenisPengajuanCuti?.toLowerCase().includes("lokal") || r.status === "approved",
      )
    } else if (statusFilter === "diProses") {
      filtered = filtered.filter((r) => {
        const needsTicket = !r.jenisPengajuanCuti?.toLowerCase().includes("lokal")
        const noTicketsYet =
          !r.bookingCode &&
          !r.bookingCodeBalik &&
          r.statusTiketBerangkat !== "issued" &&
          r.statusTiketBalik !== "issued"
        const isInProcess = r.status === "di_proses" || r.status === "tiket_issued"

        return needsTicket && noTicketsYet && isInProcess
      })
    } else if (statusFilter === "ditolak") {
      filtered = filtered.filter((r) => r.status?.includes("ditolak"))
    }

    filtered = filtered.filter((r) => {
      const requestDate = new Date(r.tanggalKeberangkatan || r.createdAt)

      const monthMatch = selectedMonth === "all" || requestDate.getMonth().toString() === selectedMonth
      const yearMatch = selectedYear === "all" || requestDate.getFullYear().toString() === selectedYear

      return monthMatch && yearMatch
    })

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((request) => {
        return (
          (request.userName?.toLowerCase() || "").includes(query) ||
          (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query) ||
          getStatusLabel(request.status).toLowerCase().includes(query) ||
          (request.alasan?.toLowerCase() || "").includes(query) ||
          (request.bookingCode?.toLowerCase() || "").includes(query)
        )
      })
    }

    setFilteredRequests(filtered)
  }, [searchQuery, requests, statusFilter, selectedMonth, selectedYear])

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, selectedMonth, selectedYear])

  if (loading) {
    return (
      <DashboardLayout title="Pengajuan Cuti">
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    )
  }

  const months = [
    { value: "all", label: "Semua Bulan" },
    { value: "0", label: "Januari" },
    { value: "1", label: "Februari" },
    { value: "2", label: "Maret" },
    { value: "3", label: "April" },
    { value: "4", label: "Mei" },
    { value: "5", label: "Juni" },
    { value: "6", label: "Juli" },
    { value: "7", label: "Agustus" },
    { value: "8", label: "September" },
    { value: "9", label: "Oktober" },
    { value: "10", label: "November" },
    { value: "11", label: "Desember" },
  ]

  const currentYear = new Date().getFullYear()
  const years = [
    { value: "all", label: "Semua Tahun" },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: (currentYear - 2 + i).toString(),
      label: (currentYear - 2 + i).toString(),
    })),
  ]

  return (
    <DashboardLayout title="Pengajuan Cuti">
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/admin-site">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pengajuan Cuti</h1>
            <p className="text-muted-foreground mt-2">Admin Site</p>
          </div>
          <Button onClick={() => setShowNewRequestDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajukan Izin Baru
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Menunggu</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.menunggu}</div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Di Proses</CardTitle>
              <Settings className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.diProses}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Tiket Berangkat</CardTitle>
              <Plane className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.tiketBerangkat}</div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Tiket Lengkap</CardTitle>
              <Ticket className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.tiketLengkap}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Cuti Lokal</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.cutiLokal}</div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.ditolak}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengajuan</CardTitle>
            <CardDescription>Klik pada pengajuan untuk melihat detail dan riwayat persetujuan</CardDescription>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Pengajuan</SelectItem>
                  <SelectItem value="menunggu">Menunggu Approval</SelectItem>
                  <SelectItem value="diProses">Di Proses HR Ticketing</SelectItem>
                  <SelectItem value="tiket_berangkat">Tiket Berangkat Terbit</SelectItem>
                  <SelectItem value="tiket_lengkap">Tiket Lengkap</SelectItem>
                  <SelectItem value="cuti_lokal">Cuti Lokal (Tanpa Tiket)</SelectItem>
                  <SelectItem value="ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari berdasarkan nama, jenis izin, status, atau kode booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Tidak ada pengajuan yang sesuai dengan filter"
                    : "Belum ada pengajuan izin"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button onClick={() => setShowNewRequestDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Pengajuan Pertama
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} dari{" "}
                  {filteredRequests.length} pengajuan
                </p>

                <div className="space-y-3">
                  {paginatedRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onSelect={() => setSelectedRequest(request)}
                      onEdit={(e) => {
                        e.stopPropagation()
                        setEditingRequest(request)
                      }}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-blue-600" : ""}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Berikutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NewLeaveRequestDialog
        open={showNewRequestDialog}
        onOpenChange={setShowNewRequestDialog}
        onSuccess={() => {
          setShowNewRequestDialog(false)
          loadData()
        }}
      />

      {selectedRequest && (
        <LeaveRequestDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onUpdate={loadData}
        />
      )}

      {editingRequest && (
        <EditLeaveRequestDialog
          open={!!editingRequest}
          onOpenChange={(open) => !open && setEditingRequest(null)}
          onSuccess={() => {
            setEditingRequest(null)
            loadData()
          }}
          leaveRequest={editingRequest}
        />
      )}
    </DashboardLayout>
  )
}

function RequestCard({
  request,
  onSelect,
  onEdit,
}: {
  request: LeaveRequest
  onSelect: () => void
  onEdit: (e: React.MouseEvent) => void
}) {
  const canEdit = !request.bookingCode && !request.bookingCodeBalik

  const displayStatus = getDetailedTicketStatus(
    request.status,
    request.statusTiketBerangkat,
    request.statusTiketBalik,
    request.jenisPengajuanCuti, // Updated to pass jenisPengajuanCuti parameter
  )

  const getEnhancedStatusColor = (status: string, displayStatus: string): string => {
    if (displayStatus === "Tiket Lengkap") {
      return "bg-green-500 text-white"
    } else if (displayStatus === "Tiket Berangkat Terbit") {
      return "bg-blue-500 text-white"
    } else if (displayStatus === "Tiket Balik Terbit") {
      return "bg-cyan-500 text-white"
    }

    return getStatusColor(status)
  }

  return (
    <div
      className="border border-slate-200 rounded-lg p-6 hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex justify-between items-start gap-8">
        <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-3">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-slate-500 min-w-[90px]">NIK:</span>
              <span className="text-sm text-slate-900 font-medium">{request.userNik || "-"}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-slate-500 min-w-[90px]">Jabatan:</span>
              <span className="text-sm text-slate-900">{request.jabatan || "-"}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-slate-500 min-w-[90px]">Tanggal Cuti:</span>
              <span className="text-sm text-slate-900">{formatDate(request.tanggalKeberangkatan)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-slate-500 min-w-[90px]">Nama:</span>
              <span className="text-sm text-slate-900 font-semibold">{request.userName || "-"}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-slate-500 min-w-[90px]">Departemen:</span>
              <span className="text-sm text-slate-900">{request.departemen || "-"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <Badge className={`${getEnhancedStatusColor(request.status, displayStatus)} px-4 py-1.5 text-sm`}>
            {displayStatus}
          </Badge>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8">
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
