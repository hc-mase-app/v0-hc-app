"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText, Search, ArrowLeft } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DICCutiPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const loadData = useCallback(async () => {
    if (!user?.site || !user?.departemen) return

    try {
      setLoading(true)

      const [pendingRes, allRes] = await Promise.all([
        fetch(
          `/api/workflow?action=pending&role=dic&site=${encodeURIComponent(user.site)}&departemen=${encodeURIComponent(user.departemen)}`,
        ),
        fetch(
          `/api/workflow?action=all&role=dic&site=${encodeURIComponent(user.site)}&departemen=${encodeURIComponent(user.departemen)}`,
        ),
      ])

      const [pendingData, allData] = await Promise.all([pendingRes.json(), allRes.json()])

      const pendingRequests = Array.isArray(pendingData)
        ? pendingData
        : pendingData?.success && Array.isArray(pendingData.data)
          ? pendingData.data
          : []

      const allRequests = Array.isArray(allData)
        ? allData
        : allData?.success && Array.isArray(allData.data)
          ? allData.data
          : []

      setPendingRequests(pendingRequests)
      setAllRequests(allRequests)

      setStats({
        total: allRequests.length,
        pending: pendingRequests.length,
        approved: allRequests.filter(
          (r) =>
            r.status === "pending_pjo" ||
            r.status === "pending_hr_ho" ||
            r.status === "di_proses" ||
            r.status === "tiket_issued",
        ).length,
        rejected: allRequests.filter((r) => r.status === "ditolak_dic").length,
      })

      setFilteredRequests(pendingRequests)
    } catch (error) {
      console.error("[DIC Cuti] Error loading data:", error)
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
    if (!searchQuery.trim()) {
      if (activeTab === "pending") {
        setFilteredRequests(pendingRequests)
      } else if (activeTab === "all") {
        setFilteredRequests(allRequests)
      } else if (activeTab === "approved") {
        setFilteredRequests(
          allRequests.filter(
            (r) =>
              r.status === "pending_pjo" ||
              r.status === "pending_hr_ho" ||
              r.status === "di_proses" ||
              r.status === "tiket_issued",
          ),
        )
      } else if (activeTab === "rejected") {
        setFilteredRequests(allRequests.filter((r) => r.status === "ditolak_dic"))
      }
      return
    }

    const query = searchQuery.toLowerCase()
    let baseRequests = activeTab === "pending" ? pendingRequests : allRequests

    if (activeTab === "approved") {
      baseRequests = allRequests.filter(
        (r) =>
          r.status === "pending_pjo" ||
          r.status === "pending_hr_ho" ||
          r.status === "di_proses" ||
          r.status === "tiket_issued",
      )
    } else if (activeTab === "rejected") {
      baseRequests = allRequests.filter((r) => r.status === "ditolak_dic")
    }

    const filtered = baseRequests.filter((request) => {
      return (
        (request.userName?.toLowerCase() || "").includes(query) ||
        (request.userNik?.toLowerCase() || "").includes(query) ||
        (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query) ||
        (request.bookingCode?.toLowerCase() || "").includes(query)
      )
    })
    setFilteredRequests(filtered)
  }, [searchQuery, pendingRequests, allRequests, activeTab])

  if (loading) {
    return (
      <DashboardLayout title="Pengajuan Cuti">
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Pengajuan Cuti">
      <div className="space-y-6">
        {/* Back button */}
        <div>
          <Link href="/dashboard/dic">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengajuan Cuti</h1>
          <p className="text-muted-foreground mt-2">
            Kelola pengajuan cuti untuk departemen {user?.departemen} di site {user?.site}
          </p>
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
              <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
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

        {/* Tabs and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Daftar Pengajuan Cuti</CardTitle>
            <CardDescription className="text-sm">
              Klik pada pengajuan untuk melihat detail dan riwayat persetujuan
            </CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama, NIK, jenis cuti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 gap-2 h-auto bg-muted p-1">
                <TabsTrigger
                  value="pending"
                  className="text-xs whitespace-normal h-auto py-2 px-2 data-[state=active]:bg-background"
                >
                  <span className="block">Menunggu</span>
                  <span className="block">({stats.pending})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="text-xs whitespace-normal h-auto py-2 px-2 data-[state=active]:bg-background"
                >
                  <span className="block">Semua</span>
                  <span className="block">({stats.total})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="text-xs whitespace-normal h-auto py-2 px-2 data-[state=active]:bg-background"
                >
                  <span className="block">Disetujui</span>
                  <span className="block">({stats.approved})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="text-xs whitespace-normal h-auto py-2 px-2 data-[state=active]:bg-background"
                >
                  <span className="block">Ditolak</span>
                  <span className="block">({stats.rejected})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchQuery ? "Tidak ada pengajuan yang sesuai dengan pencarian" : "Tidak ada pengajuan"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <ApprovalCard
                        key={request.id}
                        request={request}
                        onApprove={() => loadData()}
                        onReject={() => loadData()}
                        onViewDetail={() => setSelectedRequest(request)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
