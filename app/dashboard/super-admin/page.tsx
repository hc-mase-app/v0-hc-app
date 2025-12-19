"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, FileText, Building2, Shield, Upload, Database } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { LeaveRequestImportDialog } from "@/components/leave-request-import-dialog"
import { SITES } from "@/lib/mock-data"

export default function SuperAdminDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/workflow?action=all&role=hr_ho&site=all`)
      const data = await res.json()
      const allData = Array.isArray(data) ? data : data?.data || []
      setAllRequests(allData)
    } catch (error) {
      console.error("[Super Admin] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "super_admin") {
      router.push("/login")
      return
    }
    loadData()
  }, [user?.role, isAuthenticated, router, loadData])

  const stats = {
    total: allRequests.length,
    pending: allRequests.filter(
      (r) => r.status?.includes("pending") || r.status === "di_proses" || r.status === "tiket_issued",
    ).length,
    approved: allRequests.filter((r) => r.status === "approved" || r.status === "tiket_issued").length,
    rejected: allRequests.filter((r) => r.status?.includes("ditolak")).length,
  }

  const filteredRequests = allRequests
    .filter((r) => selectedSite === "all" || r.site === selectedSite)
    .filter((r) => {
      if (selectedStatus === "all") return true
      if (selectedStatus === "pending") return r.status?.includes("pending") || r.status === "di_proses"
      if (selectedStatus === "approved") return r.status === "approved" || r.status === "tiket_issued"
      if (selectedStatus === "rejected") return r.status?.includes("ditolak")
      return true
    })

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout title="Dashboard Super Admin">
      <div className="space-y-6">
        {/* Admin Info Banner */}
        <Card className="border-gold-500/30 bg-gradient-to-r from-gold-500/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-gold-500" />
              <div>
                <CardTitle className="text-gold-500">Super Administrator</CardTitle>
                <CardDescription>Anda memiliki akses penuh ke semua data dan fitur sistem</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-transparent">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <Database className="h-7 w-7 text-blue-600" />
                <div>
                  <CardTitle className="text-blue-700">Manajemen Database Pengajuan Cuti</CardTitle>
                  <CardDescription>Import data pengajuan cuti secara massal dari file Excel</CardDescription>
                </div>
              </div>
              <Button onClick={() => setShowImportDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4" />
                Upload Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Bulk Import</div>
                  <div className="text-xs">Upload file Excel untuk import data secara massal</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Validasi Otomatis</div>
                  <div className="text-xs">System akan memvalidasi data sebelum import</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Template Tersedia</div>
                  <div className="text-xs">Download template Excel dengan format yang benar</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Semua site & departemen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Menunggu approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Selesai diproses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Tidak disetujui</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Semua Pengajuan Cuti</CardTitle>
                <CardDescription>Monitor semua pengajuan cuti dari seluruh site dan departemen</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
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
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <select
                    className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Dalam Proses</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Tidak ada pengajuan sesuai filter</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
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
      </div>

      {selectedRequest && (
        <LeaveRequestDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onUpdate={loadData}
        />
      )}

      <LeaveRequestImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => {
          loadData()
          setShowImportDialog(false)
        }}
      />
    </DashboardLayout>
  )
}
