"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ArrowLeft, Calendar, FileText, Filter } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatDate, getStatusColor, getDetailedTicketStatus } from "@/lib/utils"
import { ApprovalActions } from "@/components/approval-actions-inline"

const ITEMS_PER_PAGE = 5
const MONTHS = [
  { value: "all", label: "Semua Bulan" },
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
]

export default function DICCutiPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const [showFilters, setShowFilters] = useState(false)

  const loadData = useCallback(async () => {
    if (!user?.site || !user?.departemen) return

    try {
      setLoading(true)

      const response = await fetch(
        `/api/workflow?action=all&role=dic&site=${encodeURIComponent(user.site)}&departemen=${encodeURIComponent(user.departemen)}`,
      )
      const result = await response.json()

      const data = Array.isArray(result) ? result : result?.success && Array.isArray(result.data) ? result.data : []

      const sorted = data.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      setAllRequests(sorted)
      setFilteredRequests(sorted)
    } catch (error) {
      console.error("Error loading data:", error)
      setAllRequests([])
      setFilteredRequests([])
    } finally {
      setLoading(false)
    }
  }, [user?.site, user?.departemen])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "dic") {
      router.push("/login")
      return
    }
    loadData()
  }, [user?.role, isAuthenticated, router, loadData])

  useEffect(() => {
    let filtered = [...allRequests]

    if (selectedStatus !== "all") {
      if (selectedStatus === "pending") {
        filtered = filtered.filter((r) => r.status === "pending_dic")
      } else if (selectedStatus === "approved") {
        filtered = filtered.filter(
          (r) =>
            r.status !== "pending_dic" &&
            r.status !== "ditolak_dic" &&
            r.status !== "ditolak_pjo" &&
            r.status !== "ditolak_hr_ho",
        )
      } else if (selectedStatus === "rejected") {
        filtered = filtered.filter(
          (r) => r.status === "ditolak_dic" || r.status === "ditolak_pjo" || r.status === "ditolak_hr_ho",
        )
      }
    }

    if (selectedMonth !== "all" || selectedYear !== "all") {
      filtered = filtered.filter((r) => {
        if (!r.tanggalMulai) return false
        const date = new Date(r.tanggalMulai)
        const matchMonth = selectedMonth === "all" || String(date.getMonth() + 1).padStart(2, "0") === selectedMonth
        const matchYear = selectedYear === "all" || String(date.getFullYear()) === selectedYear
        return matchMonth && matchYear
      })
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((request) => {
        return (
          (request.userName?.toLowerCase() || "").includes(query) ||
          (request.userNik?.toLowerCase() || "").includes(query) ||
          (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query) ||
          (request.bookingCode?.toLowerCase() || "").includes(query) ||
          (request.jabatan?.toLowerCase() || "").includes(query)
        )
      })
    }

    setFilteredRequests(filtered)
    setCurrentPage(1)
  }, [searchQuery, allRequests, selectedStatus, selectedMonth, selectedYear])

  const stats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.status === "pending_dic").length,
    approved: allRequests.filter(
      (r) =>
        r.status !== "pending_dic" &&
        r.status !== "ditolak_dic" &&
        r.status !== "ditolak_pjo" &&
        r.status !== "ditolak_hr_ho",
    ).length,
    rejected: allRequests.filter(
      (r) => r.status === "ditolak_dic" || r.status === "ditolak_pjo" || r.status === "ditolak_hr_ho",
    ).length,
  }

  const yearOptions = (() => {
    console.log("[v0] Calculating year options from data")
    console.time("[v0] Extract years")

    // Extract unique years from data
    const yearsInData = [
      ...new Set(allRequests.filter((r) => r.tanggalMulai).map((r) => new Date(r.tanggalMulai).getFullYear())),
    ].sort((a, b) => b - a) // Sort descending (newest first)

    console.timeEnd("[v0] Extract years")
    console.log("[v0] Years found:", yearsInData)

    // Count requests per year
    console.time("[v0] Count per year")
    const yearCounts: Record<number, number> = {}
    allRequests.forEach((r) => {
      if (r.tanggalMulai) {
        const year = new Date(r.tanggalMulai).getFullYear()
        yearCounts[year] = (yearCounts[year] || 0) + 1
      }
    })
    console.timeEnd("[v0] Count per year")
    console.log("[v0] Year counts:", yearCounts)

    // Build options with "Semua Tahun" first
    const options = [{ value: "all", label: "Semua Tahun" }]

    // Add years with count
    yearsInData.forEach((year) => {
      const count = yearCounts[year] || 0
      options.push({
        value: String(year),
        label: `${year} (${count} pengajuan)`,
      })
    })

    return options
  })()

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

  if (loading) {
    return (
      <DashboardLayout title="Pengajuan Cuti">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Pengajuan Cuti">
      <div className="space-y-4 md:space-y-6">
        <div>
          <Link href="/">
            <Button variant="outline" size="sm" className="text-xs md:text-sm bg-transparent">
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Kembali ke Menu Utama</span>
              <span className="sm:hidden">Kembali</span>
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Approval Pengajuan Cuti</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
            Departemen {user?.departemen} - Site {user?.site}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 md:gap-2 bg-slate-100 px-3 md:px-4 py-1.5 md:py-2 rounded-lg">
            <FileText className="h-3 w-3 md:h-4 md:w-4 text-slate-600" />
            <span className="text-xs md:text-sm font-medium">Total: {stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 bg-yellow-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg">
            <span className="text-xs md:text-sm font-medium text-yellow-800">Menunggu: {stats.pending}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 bg-green-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg">
            <span className="text-xs md:text-sm font-medium text-green-800">Disetujui: {stats.approved}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 bg-red-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg">
            <span className="text-xs md:text-sm font-medium text-red-800">Ditolak: {stats.rejected}</span>
          </div>
        </div>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="h-4 w-4 md:h-5 md:w-5" />
              Daftar Pengajuan Cuti
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              <span className="hidden md:inline">Klik pengajuan untuk melihat detail dan melakukan approval</span>
              <span className="md:hidden">Tap untuk detail</span>
            </CardDescription>

            <div className="space-y-3 mt-4">
              {/* Search bar - always visible */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama, NIK..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              <div className="md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full justify-center text-sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
                </Button>
              </div>

              <div className={`${showFilters ? "grid" : "hidden"} md:grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3`}>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="text-sm">
                    <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu Approval</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="text-sm">
                    <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <FileText className="h-10 w-10 md:h-12 md:w-12 text-slate-300 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-slate-600">
                  {searchQuery || selectedStatus !== "all" || selectedMonth !== "all" || selectedYear !== "all"
                    ? "Tidak ada pengajuan yang sesuai"
                    : "Tidak ada pengajuan cuti"}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 md:space-y-3">
                  {paginatedRequests.map((request) => (
                    <RequestCard key={request.id} request={request} onSelect={() => setSelectedRequest(request)} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 md:mt-6 pt-4 border-t space-y-3 md:space-y-0">
                    {/* Info text - centered on mobile */}
                    <p className="text-xs md:text-sm text-slate-600 text-center md:text-left">
                      Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} dari{" "}
                      {filteredRequests.length}
                    </p>

                    {/* Pagination controls - centered */}
                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-full md:w-auto text-xs md:text-sm"
                      >
                        Sebelumnya
                      </Button>

                      <div className="flex items-center gap-1">
                        {totalPages <= 5 ? (
                          // Show all pages if 5 or less
                          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 md:w-9 md:h-9 p-0 text-xs md:text-sm"
                            >
                              {page}
                            </Button>
                          ))
                        ) : (
                          // Show current page and neighbors on mobile
                          <>
                            {currentPage > 2 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(1)}
                                  className="w-8 h-8 md:w-9 md:h-9 p-0 text-xs md:text-sm"
                                >
                                  1
                                </Button>
                                {currentPage > 3 && <span className="text-slate-400">...</span>}
                              </>
                            )}
                            {[currentPage - 1, currentPage, currentPage + 1]
                              .filter((p) => p >= 1 && p <= totalPages)
                              .map((page) => (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="w-8 h-8 md:w-9 md:h-9 p-0 text-xs md:text-sm"
                                >
                                  {page}
                                </Button>
                              ))}
                            {currentPage < totalPages - 1 && (
                              <>
                                {currentPage < totalPages - 2 && <span className="text-slate-400">...</span>}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(totalPages)}
                                  className="w-8 h-8 md:w-9 md:h-9 p-0 text-xs md:text-sm"
                                >
                                  {totalPages}
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-full md:w-auto text-xs md:text-sm"
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedRequest && (
        <LeaveRequestDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onUpdate={loadData}
        />
      )}
    </DashboardLayout>
  )
}

function RequestCard({ request, onSelect }: { request: LeaveRequest; onSelect: () => void }) {
  const actualStatus = getDetailedTicketStatus(
    request.status,
    request.statusTiketBerangkat,
    request.statusTiketBalik,
    request.jenisPengajuan,
  )

  const isPendingDicApproval = request.status === "pending_dic"

  return (
    <div
      className="border border-slate-200 rounded-lg p-3 md:p-4 hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="space-y-2">
        {/* Row 1: Status badge and Detail button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Badge className={`${getStatusColor(request.status)} text-xs whitespace-normal`}>{actualStatus}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs h-8 bg-transparent"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            Detail
          </Button>
        </div>

        {/* Row 2: Employee name and cuti type */}
        <div className="space-y-1">
          <p className="font-semibold text-sm md:text-base text-slate-900 truncate">
            {request.userName || "Tidak diketahui"}
          </p>
          <p className="text-xs md:text-sm text-slate-600">{request.jenisPengajuanCuti || "Cuti"}</p>
        </div>

        {/* Row 3: Date - simplified on mobile */}
        <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-600">
          <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
          <span className="truncate">
            {request.tanggalMulai && request.tanggalSelesai
              ? `${formatDate(request.tanggalMulai)} - ${formatDate(request.tanggalSelesai)}`
              : request.periodeAwal && request.periodeAkhir
                ? `${formatDate(request.periodeAwal)} - ${formatDate(request.periodeAkhir)}`
                : "Tanggal tidak tersedia"}
          </span>
        </div>

        {isPendingDicApproval && (
          <div className="pt-2 border-t border-slate-200" onClick={(e) => e.stopPropagation()}>
            <ApprovalActions request={request} role="dic" onSuccess={onSelect} />
          </div>
        )}
      </div>
    </div>
  )
}
