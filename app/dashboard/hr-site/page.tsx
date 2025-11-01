"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Clock, CheckCircle, XCircle, Search, Calendar } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { NewLeaveRequestDialog } from "@/components/new-leave-request-dialog"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HRSiteDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (user.role !== "hr_site") {
      router.push("/dashboard")
      return
    }

    loadData()
  }, [user, isAuthenticated, router])

  const loadData = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/leave-requests?type=submitted-by&userId=${user.id}`)
      const data = await response.json()

      const sortedRequests = data.sort(
        (a: LeaveRequest, b: LeaveRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      setRequests(sortedRequests)
      setFilteredRequests(sortedRequests)

      const stats = {
        total: data.length,
        pending: data.filter(
          (r: LeaveRequest) => r.status === "pending_dic" || r.status === "pending_pjo" || r.status === "pending_hr_ho",
        ).length,
        approved: data.filter((r: LeaveRequest) => r.status === "approved").length,
        rejected: data.filter((r: LeaveRequest) => r.status === "rejected").length,
      }
      setStats(stats)
    } catch (error) {
      console.error("Error loading leave requests:", error)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      if (activeTab === "all") {
        setFilteredRequests(requests)
      } else if (activeTab === "pending") {
        setFilteredRequests(
          requests.filter(
            (r) => r.status === "pending_dic" || r.status === "pending_pjo" || r.status === "pending_hr_ho",
          ),
        )
      } else if (activeTab === "approved") {
        setFilteredRequests(requests.filter((r) => r.status === "approved"))
      } else if (activeTab === "rejected") {
        setFilteredRequests(requests.filter((r) => r.status === "rejected"))
      }
      return
    }

    const query = searchQuery.toLowerCase()
    let baseRequests = requests

    if (activeTab === "pending") {
      baseRequests = requests.filter(
        (r) => r.status === "pending_dic" || r.status === "pending_pjo" || r.status === "pending_hr_ho",
      )
    } else if (activeTab === "approved") {
      baseRequests = requests.filter((r) => r.status === "approved")
    } else if (activeTab === "rejected") {
      baseRequests = requests.filter((r) => r.status === "rejected")
    }

    const filtered = baseRequests.filter((request) => {
      return (
        (request.userName?.toLowerCase() || "").includes(query) ||
        (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query) ||
        getStatusLabel(request.status).toLowerCase().includes(query) ||
        (request.alasan?.toLowerCase() || "").includes(query) ||
        (request.bookingCode?.toLowerCase() || "").includes(query)
      )
    })
    setFilteredRequests(filtered)
  }, [searchQuery, requests, activeTab])

  const handleRequestCreated = () => {
    loadData()
    setIsNewRequestOpen(false)
  }

  if (!user) return null

  return (
    <DashboardLayout title="Dashboard HR Site">
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

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pengajuan Izin Saya</h2>
            <p className="text-sm text-slate-600">Kelola dan pantau pengajuan izin yang Anda buat</p>
          </div>
          <Button onClick={() => setIsNewRequestOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajukan Izin Baru
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengajuan</CardTitle>
            <CardDescription>Klik pada pengajuan untuk melihat detail dan riwayat persetujuan</CardDescription>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Semua</TabsTrigger>
                <TabsTrigger value="pending">Menunggu</TabsTrigger>
                <TabsTrigger value="approved">Disetujui</TabsTrigger>
                <TabsTrigger value="rejected">Ditolak</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">
                      {searchQuery ? "Tidak ada pengajuan yang sesuai dengan pencarian" : "Belum ada pengajuan izin"}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setIsNewRequestOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Pengajuan Pertama
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request) => (
                      <RequestCard key={request.id} request={request} onSelect={setSelectedRequest} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan yang menunggu persetujuan</p>
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

      {/* Dialogs */}
      <NewLeaveRequestDialog
        open={isNewRequestOpen}
        onOpenChange={setIsNewRequestOpen}
        onSuccess={handleRequestCreated}
      />

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
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">NIK:</span>
            <span className="text-sm text-slate-900">{request.userNik || "-"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Nama:</span>
            <span className="text-sm font-semibold text-slate-900">{request.userName || "Nama tidak tersedia"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Jabatan:</span>
            <span className="text-sm text-slate-900">{request.jabatan || "-"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Departemen:</span>
            <span className="text-sm text-slate-900">{request.departemen || "-"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-600">Tanggal Keberangkatan:</span>
            <span className="text-sm text-slate-900">
              {request.tanggalKeberangkatan ? formatDate(request.tanggalKeberangkatan) : "-"}
            </span>
          </div>
        </div>
        <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200">
        <Button variant="outline" size="sm" className="w-full bg-transparent">
          Lihat Detail Lengkap
        </Button>
      </div>
    </div>
  )
}
