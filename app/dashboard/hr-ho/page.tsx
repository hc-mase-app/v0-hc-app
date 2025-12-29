"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText, Building2 } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SITES } from "@/lib/mock-data"

export default function HRHODashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/workflow?action=all&role=hr_ho&site=all`)
      const result = await response.json()

      const data = Array.isArray(result) ? result : result?.data || []
      setAllRequests(data)
    } catch (error) {
      console.error("[HR HO] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "hr_ho") {
      router.push("/login")
      return
    }
    loadData()
  }, [user?.role, isAuthenticated, router, loadData])

  const pendingRequests = allRequests.filter((r) => r.status === "pending_hr_ho")

  const stats = {
    total: allRequests.length,
    pending: pendingRequests.length,
    approved: allRequests.filter((r) => r.status === "di_proses" || r.status === "tiket_issued").length,
    rejected: allRequests.filter((r) => r.status?.includes("ditolak")).length,
  }

  const filteredAll = selectedSite === "all" ? allRequests : allRequests.filter((r) => r.site === selectedSite)

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout title="Dashboard HR Head Office">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Menunggu Persetujuan ({stats.pending})</TabsTrigger>
            <TabsTrigger value="all">Semua Pengajuan ({stats.total})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pengajuan Menunggu Persetujuan Final</CardTitle>
                <CardDescription>
                  Pengajuan yang telah disetujui DIC dan PJO, menunggu persetujuan HR HO
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
                        onApprove={() => loadData()}
                        onReject={() => loadData()}
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
                {filteredAll.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAll.map((request) => (
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
