"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Clock, CheckCircle, XCircle, Search, Calendar, ArrowLeft } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewLeaveRequestDialog } from "@/components/new-leave-request-dialog"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import Link from "next/link"

export default function HRSiteCutiPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const loadData = useCallback(async () => {
    if (!user?.site) return

    try {
      setLoading(true)

      const response = await fetch(`/api/workflow?action=all&role=hr_site&site=${encodeURIComponent(user.site)}`)
      const result = await response.json()

      const data = result?.success && Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : []

      console.log("[v0] HR Site Cuti loaded data:", data.length, "requests")

      if (!response.ok) {
        console.error("[HR Site Cuti] API error:", result)
        setRequests([])
        setFilteredRequests([])
        return
      }

      const sortedRequests = data.sort(
        (a: LeaveRequest, b: LeaveRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      setRequests(sortedRequests)
      setFilteredRequests(sortedRequests)

      setStats({
        total: sortedRequests.length,
        pending: sortedRequests.filter(
          (r: LeaveRequest) => r.status === "pending_dic" || r.status === "pending_pjo" || r.status === "pending_hr_ho",
        ).length,
        approved: sortedRequests.filter((r: LeaveRequest) => r.status === "di_proses" || r.status === "tiket_issued")
          .length,
        rejected: sortedRequests.filter((r: LeaveRequest) => r.status?.includes("ditolak")).length,
      })
    } catch (error) {
      console.error("[HR Site Cuti] Error loading data:", error)
      setRequests([])
      setFilteredRequests([])
    } finally {
      setLoading(false)
    }
  }, [user?.site])

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "hr_site") {
      router.push("/login")
      return
    }
    loadData()
  }, [user, isAuthenticated, router, loadData])

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
        setFilteredRequests(requests.filter((r) => r.status === "di_proses" || r.status === "tiket_issued"))
      } else if (activeTab === "rejected") {
        setFilteredRequests(requests.filter((r) => r.status?.includes("ditolak")))
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
      baseRequests = requests.filter((r) => r.status === "di_proses" || r.status === "tiket_issued")
    } else if (activeTab === "rejected") {
      baseRequests = requests.filter((r) => r.status?.includes("ditolak"))
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
          <Link href="/dashboard/hr-site">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        {/* Header with action button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pengajuan Cuti</h1>
            <p className="text-muted-foreground mt-2">Kelola pengajuan cuti untuk site {user?.site}</p>
          </div>
          <Button onClick={() => setShowNewRequestDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajukan Izin Baru
          </Button>
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

        {/* Tabs with search */}
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
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 h-auto bg-muted p-1">
                <TabsTrigger value="all" className="text-xs md:text-sm px-2 md:px-4 h-auto py-2 whitespace-normal">
                  Semua ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs md:text-sm px-2 md:px-4 h-auto py-2 whitespace-normal">
                  Menunggu ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs md:text-sm px-2 md:px-4 h-auto py-2 whitespace-normal">
                  Disetujui ({stats.approved})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs md:text-sm px-2 md:px-4 h-auto py-2 whitespace-normal">
                  Ditolak ({stats.rejected})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">
                      {searchQuery ? "Tidak ada pengajuan yang sesuai dengan pencarian" : "Belum ada pengajuan izin"}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowNewRequestDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Pengajuan Pertama
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request) => (
                      <RequestCard key={request.id} request={request} onSelect={() => setSelectedRequest(request)} />
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
        open={showNewRequestDialog}
        onOpenChange={setShowNewRequestDialog}
        onSuccess={() => {
          setShowNewRequestDialog(false)
          loadData()
        }}
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

function RequestCard({ request, onSelect }: { request: LeaveRequest; onSelect: () => void }) {
  return (
    <div
      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={onSelect}
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
    </div>
  )
}
