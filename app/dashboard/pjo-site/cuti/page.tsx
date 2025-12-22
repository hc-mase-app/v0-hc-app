"use client"

import { useMemo, useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText, ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import type { LeaveRequest } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApprovalActions } from "@/components/approval-actions-inline"
import useSWR from "swr"

export default function PJOSiteCutiPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [pendingPage, setPendingPage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const itemsPerPage = 10

  const {
    data: allRequests = [],
    isLoading,
    mutate,
  } = useSWR(
    user?.site && isAuthenticated && user?.role === "pjo_site"
      ? `/api/workflow?action=all&role=pjo_site&site=${encodeURIComponent(user.site)}`
      : null,
    (url: string) =>
      fetch(url)
        .then((res) => res.json())
        .then((data) => (data?.success ? data.data : data)),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    },
  )

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "pjo_site") {
      router.push("/login")
    }
  }, [isAuthenticated, user?.role, router])

  const pendingRequests = useMemo(() => {
    return allRequests.filter((req: LeaveRequest) => req.status === "pending_pjo")
  }, [allRequests])

  const stats = useMemo(() => {
    const pending = allRequests.filter((req: LeaveRequest) => req.status === "pending_pjo").length
    const approved = allRequests.filter(
      (req: LeaveRequest) => req.status === "approved" || req.status?.includes("approved"),
    ).length
    const rejected = allRequests.filter((req: LeaveRequest) => req.status?.includes("ditolak")).length

    return {
      total: allRequests.length,
      pending,
      approved,
      rejected,
    }
  }, [allRequests])

  const yearOptions = useMemo(() => {
    const yearMap = new Map<number, number>()

    allRequests.forEach((request: LeaveRequest) => {
      if (request.tanggalMulai) {
        const year = new Date(request.tanggalMulai).getFullYear()
        yearMap.set(year, (yearMap.get(year) || 0) + 1)
      }
    })

    const years = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year)

    return years
  }, [allRequests])

  const filterRequests = useMemo(() => {
    return (requests: LeaveRequest[]) => {
      let filtered = requests

      if (selectedYear !== "all") {
        filtered = filtered.filter((request) => {
          if (!request.tanggalMulai) return false
          const requestYear = new Date(request.tanggalMulai).getFullYear()
          return requestYear === Number.parseInt(selectedYear)
        })
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter((request) => {
          return (
            request.userNik?.toLowerCase().includes(query) ||
            request.userName?.toLowerCase().includes(query) ||
            request.bookingCode?.toLowerCase().includes(query) ||
            request.jenisPengajuanCuti?.toLowerCase().includes(query)
          )
        })
      }

      return filtered
    }
  }, [selectedYear, searchQuery])

  const filteredPendingRequests = useMemo(() => {
    return filterRequests(pendingRequests)
  }, [pendingRequests, filterRequests])

  const filteredAllRequests = useMemo(() => {
    return filterRequests(allRequests)
  }, [allRequests, filterRequests])

  const paginatedPendingRequests = useMemo(() => {
    const startIndex = (pendingPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredPendingRequests.slice(startIndex, endIndex)
  }, [filteredPendingRequests, pendingPage, itemsPerPage])

  const pendingTotalPages = Math.ceil(filteredPendingRequests.length / itemsPerPage)

  const paginatedAllRequests = useMemo(() => {
    const startIndex = (allPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAllRequests.slice(startIndex, endIndex)
  }, [filteredAllRequests, allPage, itemsPerPage])

  const allTotalPages = Math.ceil(filteredAllRequests.length / itemsPerPage)

  useEffect(() => {
    setPendingPage(1)
    setAllPage(1)
  }, [selectedYear, searchQuery])

  if (!isAuthenticated || !user?.role || user.role !== "pjo_site" || isLoading) {
    return (
      <DashboardLayout title="Pengajuan Cuti">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-24" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Pengajuan Cuti">
      <div className="space-y-6">
        <div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Menu Utama
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari NIK, nama, booking code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-sm font-medium whitespace-nowrap">Filter Tahun:</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Periode</SelectLabel>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {yearOptions.map(({ year, count }) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year} ({count} pengajuan)
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 gap-2 h-auto bg-muted p-1">
            <TabsTrigger value="pending" className="text-sm md:text-base h-auto py-2 whitespace-normal">
              Menunggu Persetujuan ({filteredPendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-sm md:text-base h-auto py-2 whitespace-normal">
              Semua Pengajuan ({filteredAllRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pengajuan Menunggu Persetujuan PJO</CardTitle>
                <CardDescription>
                  Pengajuan dari site {user?.site} (semua departemen) yang telah disetujui DIC
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredPendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchQuery || selectedYear !== "all"
                        ? "Tidak ada pengajuan yang sesuai dengan filter"
                        : "Tidak ada pengajuan yang menunggu persetujuan"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedPendingRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4 space-y-3">
                          <ApprovalCard request={request} onViewDetail={() => setSelectedRequest(request)} readOnly />
                          {request.status === "pending_pjo" && (
                            <ApprovalActions request={request} role="pjo" onSuccess={() => mutate()} />
                          )}
                        </div>
                      ))}
                    </div>
                    {pendingTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-muted-foreground">
                          Menampilkan {(pendingPage - 1) * itemsPerPage + 1} -{" "}
                          {Math.min(pendingPage * itemsPerPage, filteredPendingRequests.length)} dari{" "}
                          {filteredPendingRequests.length} pengajuan
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                            disabled={pendingPage === 1}
                          >
                            Sebelumnya
                          </Button>
                          <span className="text-sm">
                            Halaman {pendingPage} dari {pendingTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingPage((p) => Math.min(pendingTotalPages, p + 1))}
                            disabled={pendingPage === pendingTotalPages}
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
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Semua Pengajuan dari Site {user?.site}</CardTitle>
                <CardDescription>Histori semua pengajuan dari site Anda (semua departemen)</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAllRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchQuery || selectedYear !== "all"
                        ? "Tidak ada pengajuan yang sesuai dengan filter"
                        : "Tidak ada pengajuan"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedAllRequests.map((request) => (
                        <ApprovalCard
                          key={request.id}
                          request={request}
                          onViewDetail={() => setSelectedRequest(request)}
                          readOnly
                        />
                      ))}
                    </div>
                    {allTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-muted-foreground">
                          Menampilkan {(allPage - 1) * itemsPerPage + 1} -{" "}
                          {Math.min(allPage * itemsPerPage, filteredAllRequests.length)} dari{" "}
                          {filteredAllRequests.length} pengajuan
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAllPage((p) => Math.max(1, p - 1))}
                            disabled={allPage === 1}
                          >
                            Sebelumnya
                          </Button>
                          <span className="text-sm">
                            Halaman {allPage} dari {allTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAllPage((p) => Math.min(allTotalPages, p + 1))}
                            disabled={allPage === allTotalPages}
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
          </TabsContent>
        </Tabs>
      </div>

      {selectedRequest && (
        <LeaveRequestDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onUpdate={() => mutate()}
        />
      )}
    </DashboardLayout>
  )
}
