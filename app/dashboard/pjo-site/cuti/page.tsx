"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { ApprovalCard } from "@/components/approval-card"
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

export default function PJOSiteCutiPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const [selectedStatus, setSelectedStatus] = useState<string>("pending")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const [showFilters, setShowFilters] = useState(false)

  const loadData = useCallback(async () => {
    if (!user?.site) return

    try {
      setLoading(true)

      let apiUrl = `/api/workflow?action=all&role=pjo_site&site=${encodeURIComponent(user.site)}`

      // Add status filter to API call
      if (selectedStatus === "pending") {
        apiUrl += "&status=pending_pjo"
      } else if (selectedStatus === "approved") {
        // Include both di_proses and approved statuses for "Disetujui" filter
        apiUrl += "&status=di_proses,approved"
      } else if (selectedStatus === "rejected") {
        apiUrl += "&status=rejected"
      } else if (selectedStatus === "all") {
        apiUrl += "&status=all"
      }

      const response = await fetch(apiUrl)
      const result = await response.json()

      const data = Array.isArray(result) ? result : result?.success && Array.isArray(result.data) ? result.data : []

      setAllRequests(
        data.sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }),
      )
    } catch (error) {
      console.error("Error loading data:", error)
      setAllRequests([])
    } finally {
      setLoading(false)
    }
  }, [user?.site, selectedStatus])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "pjo_site") {
      router.push("/login")
      return
    }
    loadData()
  }, [user?.role, isAuthenticated, router, loadData])

  const { yearOptions, filteredRequests } = useMemo(() => {
    const yearCounts: Record<number, number> = {}

    allRequests.forEach((r) => {
      if (r.tanggalMulai) {
        const year = new Date(r.tanggalMulai).getFullYear()
        yearCounts[year] = (yearCounts[year] || 0) + 1
      }
    })

    const yearsInData = Object.keys(yearCounts)
      .map(Number)
      .sort((a, b) => b - a)

    const yearOpts = [{ value: "all", label: "Semua Tahun" }]
    yearsInData.forEach((year) => {
      yearOpts.push({
        value: String(year),
        label: `${year} (${yearCounts[year]} pengajuan)`,
      })
    })

    // Apply month/year/search filters
    let filtered = allRequests

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
          (request.jabatan?.toLowerCase() || "").includes(query) ||
          (request.departemen?.toLowerCase() || "").includes(query)
        )
      })
    }

    return {
      yearOptions: yearOpts,
      filteredRequests: filtered,
    }
  }, [allRequests, selectedMonth, selectedYear, searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedStatus, selectedMonth, selectedYear, searchQuery])

  const { totalPages, paginatedRequests, startIndex, endIndex } = useMemo(() => {
    const total = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    const paginated = filteredRequests.slice(start, end)

    return {
      totalPages: total,
      paginatedRequests: paginated,
      startIndex: start,
      endIndex: end,
    }
  }, [filteredRequests, currentPage])

  const pendingCount = useMemo(() => {
    return allRequests.filter((r) => r.status === "pending_pjo").length
  }, [allRequests])

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
          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">Site {user?.site} - Semua Departemen</p>
        </div>

        {selectedStatus === "pending" && pendingCount > 0 && (
          <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3 md:p-4 shadow-sm">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-200/30 blur-2xl"></div>
            <div className="relative flex items-center gap-2 md:gap-3">
              <div className="flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                <svg className="h-6 w-6 md:h-7 md:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base lg:text-lg font-semibold text-slate-900 truncate">
                  {pendingCount} Pengajuan Butuh Approval
                </h3>
              </div>
            </div>
          </div>
        )}

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
                  placeholder="Cari nama, NIK, departemen..."
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
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <ApprovalCard request={request} onViewDetail={() => setSelectedRequest(request)} readOnly />
                      {request.status === "pending_pjo" && (
                        <ApprovalActions
                          request={request}
                          role="pjo_site"
                          approverNik={user?.nik}
                          onSuccess={loadData}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 md:mt-6 pt-4 border-t space-y-3 md:space-y-0">
                    <p className="text-xs md:text-sm text-slate-600 text-center md:text-left">
                      Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} dari{" "}
                      {filteredRequests.length}
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-full md:w-auto text-xs md:text-sm h-11 md:h-9"
                      >
                        Sebelumnya
                      </Button>

                      <div className="flex items-center gap-1">
                        {totalPages <= 5 ? (
                          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-11 h-11 md:w-9 md:h-9 p-0 text-xs md:text-sm"
                            >
                              {page}
                            </Button>
                          ))
                        ) : (
                          <>
                            {currentPage > 2 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage(1)}
                                  className="w-11 h-11 md:w-9 md:h-9 p-0 text-xs md:text-sm"
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
                                  className="w-11 h-11 md:w-9 md:h-9 p-0 text-xs md:text-sm"
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
                                  className="w-11 h-11 md:w-9 md:h-9 p-0 text-xs md:text-sm"
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
                        className="w-full md:w-auto text-xs md:text-sm h-11 md:h-9"
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
