"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, XCircle, Search, Calendar } from "lucide-react"
import { Database } from "@/lib/database"
import type { LeaveRequest } from "@/lib/types"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HRTicketingDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [activeTab, setActiveTab] = useState("all")

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

  const loadData = () => {
    const allRequests = Database.getLeaveRequests()
    const sortedRequests = allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setRequests(sortedRequests)
    setFilteredRequests(sortedRequests)

    const stats = {
      total: allRequests.length,
      pending: allRequests.filter(
        (r) => r.status === "pending_dic" || r.status === "pending_pjo" || r.status === "pending_hr_ho",
      ).length,
      approved: allRequests.filter((r) => r.status === "approved").length,
      rejected: allRequests.filter((r) => r.status === "rejected").length,
    }
    setStats(stats)
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
        (request.userNik?.toLowerCase() || "").includes(query) ||
        (request.userName?.toLowerCase() || "").includes(query) ||
        (request.jabatan?.toLowerCase() || "").includes(query) ||
        (request.departemen?.toLowerCase() || "").includes(query) ||
        (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query) ||
        getStatusLabel(request.status).toLowerCase().includes(query)
      )
    })
    setFilteredRequests(filtered)
  }, [searchQuery, requests, activeTab])

  if (!user) return null

  return (
    <DashboardLayout title="Dashboard HR Ticketing">
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

        {/* Main Content */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Riwayat Pengajuan Izin</h2>
          <p className="text-sm text-slate-600">Pantau semua pengajuan izin dari seluruh karyawan</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengajuan</CardTitle>
            <CardDescription>Klik pada pengajuan untuk melihat detail lengkap</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari berdasarkan NIK, nama, jabatan, departemen, atau status..."
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
                    <p className="text-slate-600">
                      {searchQuery ? "Tidak ada pengajuan yang sesuai dengan pencarian" : "Belum ada pengajuan izin"}
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

      {/* Detail Dialog */}
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

      <div className="pt-3 border-t border-slate-200">
        <Button variant="outline" size="sm" className="w-full bg-transparent">
          Lihat Detail Lengkap
        </Button>
      </div>
    </div>
  )
}
