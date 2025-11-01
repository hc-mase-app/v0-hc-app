"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText, Search } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
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

      const [pending, all] = await Promise.all([pendingRes.json(), allRes.json()])

      setPendingRequests(Array.isArray(pending) ? pending : [])
      setAllRequests(Array.isArray(all) ? all : [])
    } catch (error) {
      console.error("[DIC] Error loading data:", error)
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

  const stats = {
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
  }

  const filteredRequests = searchQuery
    ? allRequests.filter(
        (r) =>
          r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.jenisCuti?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.userNik?.includes(searchQuery),
      )
    : allRequests

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout title="Dashboard DIC">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengajuan Izin</CardTitle>
            <CardDescription>
              Tinjau pengajuan izin dari departemen {user?.departemen} di site {user?.site}
            </CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama, NIK, atau jenis cuti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending">Menunggu ({stats.pending})</TabsTrigger>
                <TabsTrigger value="all">Semua ({stats.total})</TabsTrigger>
                <TabsTrigger value="approved">Disetujui ({stats.approved})</TabsTrigger>
                <TabsTrigger value="rejected">Ditolak ({stats.rejected})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan yang menunggu persetujuan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
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

              <TabsContent value="all" className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request) => (
                      <RequestRow key={request.id} request={request} onSelect={setSelectedRequest} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-4">
                {filteredRequests.filter((r) => r.status !== "pending_dic" && r.status !== "ditolak_dic").length ===
                0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan yang disetujui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests
                      .filter((r) => r.status !== "pending_dic" && r.status !== "ditolak_dic")
                      .map((request) => (
                        <RequestRow key={request.id} request={request} onSelect={setSelectedRequest} />
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-4">
                {filteredRequests.filter((r) => r.status === "ditolak_dic").length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan yang ditolak</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests
                      .filter((r) => r.status === "ditolak_dic")
                      .map((request) => (
                        <RequestRow key={request.id} request={request} onSelect={setSelectedRequest} />
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

function RequestRow({ request, onSelect }: { request: LeaveRequest; onSelect: (r: LeaveRequest) => void }) {
  return (
    <div
      className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition"
      onClick={() => onSelect(request)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{request.userName}</h3>
        <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
      </div>
      <p className="text-sm text-slate-600">
        {formatDate(request.periodeAwal)} - {formatDate(request.periodeAkhir)} ({request.jumlahHari} hari)
      </p>
    </div>
  )
}
