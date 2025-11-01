"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText, Building2 } from "lucide-react"
import { Database } from "@/lib/database"
import type { LeaveRequest } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SITES } from "@/lib/mock-data"

export default function HRHODashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pendingAtasan: 0,
    pendingPJO: 0,
    pendingHRHO: 0,
    approved: 0,
    rejected: 0,
  })
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [selectedSite, setSelectedSite] = useState<string>("all")

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (user.role !== "hr_ho") {
      router.push("/dashboard")
      return
    }

    loadData()
  }, [user, isAuthenticated, router])

  const loadData = () => {
    const pending = Database.getPendingRequestsForHRHO()
    setPendingRequests(pending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))

    const all = Database.getLeaveRequests()
    setAllRequests(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))

    const allStats = Database.getAllStats()
    setStats(allStats)
  }

  const handleApprovalAction = () => {
    loadData()
    setSelectedRequest(null)
  }

  const filteredAllRequests = selectedSite === "all" ? allRequests : allRequests.filter((r) => r.site === selectedSite)

  if (!user) return null

  return (
    <DashboardLayout title="Dashboard HR Head Office">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <CardTitle className="text-sm font-medium">Pending Atasan</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAtasan}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending PJO</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPJO}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending HR HO</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
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

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Menunggu Persetujuan ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="all">Semua Pengajuan ({allRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pengajuan Menunggu Persetujuan HR HO</CardTitle>
                <CardDescription>
                  Pengajuan yang telah disetujui Atasan dan PJO, menunggu persetujuan final dari HR HO
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                        onApprove={handleApprovalAction}
                        onReject={handleApprovalAction}
                        onViewDetail={() => setSelectedRequest(request)}
                        showSite
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Semua Pengajuan</CardTitle>
                    <CardDescription>Lihat semua pengajuan dari seluruh site</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    <select
                      className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                    >
                      <option value="all">Semua Site</option>
                      {SITES.map((site) => (
                        <option key={site} value={site}>
                          {site}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAllRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAllRequests.map((request) => (
                      <ApprovalCard
                        key={request.id}
                        request={request}
                        onViewDetail={() => setSelectedRequest(request)}
                        showSite
                        readOnly
                      />
                    ))}
                  </div>
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
          onUpdate={loadData}
        />
      )}
    </DashboardLayout>
  )
}
