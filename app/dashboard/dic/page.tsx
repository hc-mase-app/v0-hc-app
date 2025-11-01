"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText, Search } from "lucide-react"
import { Database } from "@/lib/database"
import type { LeaveRequest } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"

export default function DICDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (user.role !== "dic") {
      router.push("/dashboard")
      return
    }

    loadData()
  }, [user, isAuthenticated, router])

  const loadData = () => {
    if (!user) return

    const pending = Database.getPendingRequestsForDICBySiteDept(user.site, user.departemen)
    setPendingRequests(pending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))

    const all = Database.getLeaveRequests().filter((r) => r.site === user.site && r.departemen === user.departemen)
    setAllRequests(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setFilteredRequests(all)

    const siteStats = {
      total: all.length,
      pending: all.filter(
        (r) => r.status === "pending_dic" || r.status === "pending_pjo" || r.status === "pending_hr_ho",
      ).length,
      approved: all.filter((r) => r.status === "approved").length,
      rejected: all.filter((r) => r.status === "rejected").length,
    }
    setStats(siteStats)
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      if (activeTab === "pending") {
        setFilteredRequests(pendingRequests)
      } else if (activeTab === "all") {
        setFilteredRequests(allRequests)
      } else if (activeTab === "approved") {
        setFilteredRequests(allRequests.filter((r) => r.status === "approved"))
      } else if (activeTab === "rejected") {
        setFilteredRequests(allRequests.filter((r) => r.status === "rejected"))
      } else if (activeTab === "submitted") {
        setFilteredRequests(
          allRequests.filter((r) => {
            const history = Database.getApprovalHistoryByRequestId(r.id)
            return history.some((h) => h.approverUserId === user?.id && h.approverRole === "dic")
          }),
        )
      }
      return
    }

    const query = searchQuery.toLowerCase()
    let baseRequests = allRequests

    if (activeTab === "pending") {
      baseRequests = pendingRequests
    } else if (activeTab === "approved") {
      baseRequests = allRequests.filter((r) => r.status === "approved")
    } else if (activeTab === "rejected") {
      baseRequests = allRequests.filter((r) => r.status === "rejected")
    } else if (activeTab === "submitted") {
      baseRequests = allRequests.filter((r) => {
        const history = Database.getApprovalHistoryByRequestId(r.id)
        return history.some((h) => h.approverUserId === user?.id && h.approverRole === "dic")
      })
    }

    const filtered = baseRequests.filter((request) => {
      return (
        (request.userName?.toLowerCase() || "").includes(query) ||
        (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query) ||
        getStatusLabel(request.status).toLowerCase().includes(query) ||
        (request.alasan?.toLowerCase() || "").includes(query)
      )
    })
    setFilteredRequests(filtered)
  }, [searchQuery, pendingRequests, allRequests, activeTab, user])

  const handleApprovalAction = () => {
    loadData()
    setSelectedRequest(null)
  }

  if (!user) return null

  return (
    <DashboardLayout title="Dashboard DIC">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Site: {user.site}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">Perlu ditindaklanjuti</p>
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

        {/* Requests with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengajuan Izin</CardTitle>
            <CardDescription>Tinjau dan kelola semua pengajuan izin dari karyawan di departemen Anda</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari berdasarkan nama, jenis izin, atau status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="pending">Menunggu ({pendingRequests.length})</TabsTrigger>
                <TabsTrigger value="all">Semua ({allRequests.length})</TabsTrigger>
                <TabsTrigger value="submitted">Saya Setujui</TabsTrigger>
                <TabsTrigger value="approved">Disetujui</TabsTrigger>
                <TabsTrigger value="rejected">Ditolak</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchQuery
                        ? "Tidak ada pengajuan yang sesuai dengan pencarian"
                        : "Tidak ada pengajuan yang menunggu persetujuan"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <ApprovalCard
                        key={request.id}
                        request={request}
                        onApprove={handleApprovalAction}
                        onReject={handleApprovalAction}
                        onViewDetail={() => setSelectedRequest(request)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchQuery ? "Tidak ada pengajuan yang sesuai dengan pencarian" : "Tidak ada pengajuan"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request) => (
                      <RequestCard key={request.id} request={request} onSelect={setSelectedRequest} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="submitted" className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchQuery
                        ? "Tidak ada pengajuan yang sesuai dengan pencarian"
                        : "Belum ada pengajuan yang Anda setujui"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request) => (
                      <RequestCard key={request.id} request={request} onSelect={setSelectedRequest} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan yang disetujui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request) => (
                      <RequestCard key={request.id} request={request} onSelect={setSelectedRequest} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan yang ditolak</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request) => (
                      <RequestCard key={request.id} request={request} onSelect={setSelectedRequest} />
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

function RequestCard({
  request,
  onSelect,
}: {
  request: LeaveRequest
  onSelect: (request: LeaveRequest) => void
}) {
  return (
    <div
      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={() => onSelect(request)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-slate-900 mb-1">{request.userName || "Nama tidak tersedia"}</h3>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {request.jenisPengajuanCuti}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            {formatDate(request.tanggalMulai)} - {formatDate(request.tanggalSelesai)} ({request.jumlahHari} hari)
          </p>
        </div>
        <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
      </div>
      <p className="text-sm text-slate-700 line-clamp-2">{request.alasan}</p>
    </div>
  )
}
