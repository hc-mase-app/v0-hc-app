"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { LeaveRequest } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PJOSiteCutiPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const loadData = useCallback(async () => {
    if (!user?.site) return

    try {
      setLoading(true)

      const [pendingRes, allRes, statsRes] = await Promise.all([
        fetch(`/api/workflow?action=pending&role=pjo_site&site=${encodeURIComponent(user.site)}`),
        fetch(`/api/workflow?action=all&role=pjo_site&site=${encodeURIComponent(user.site)}`),
        fetch(`/api/workflow?action=stats&role=pjo_site&site=${encodeURIComponent(user.site)}`),
      ])

      const [pending, all, statistics] = await Promise.all([pendingRes.json(), allRes.json(), statsRes.json()])

      const pendingData = pending?.success ? pending.data : pending
      const allData = all?.success ? all.data : all
      const statsData = statistics?.success ? statistics.data : statistics

      setPendingRequests(Array.isArray(pendingData) ? pendingData : [])
      setAllRequests(Array.isArray(allData) ? allData : [])
      setStats(statsData || { total: 0, pending: 0, approved: 0, rejected: 0 })
    } catch (error) {
      console.error("[PJO Site Cuti] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.site])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "pjo_site") {
      router.push("/login")
      return
    }
    loadData()
  }, [user?.role, isAuthenticated, router, loadData])

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
        <div>
          <Link href="/dashboard/pjo-site">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
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

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 gap-2 h-auto bg-muted p-1">
            <TabsTrigger value="pending" className="text-sm md:text-base h-auto py-2 whitespace-normal">
              Menunggu Persetujuan ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-sm md:text-base h-auto py-2 whitespace-normal">
              Semua Pengajuan ({stats.total})
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
                {allRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allRequests.map((request) => (
                      <ApprovalCard
                        key={request.id}
                        request={request}
                        onViewDetail={() => setSelectedRequest(request)}
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
