"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Plus,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import type { LeaveRequest, EmployeeAssessment } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import Link from "next/link"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string | null
  stats?: Record<string, any>
}

export default function DICDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [assessments, setAssessments] = useState<EmployeeAssessment[]>([])
  const [assessmentSearchQuery, setAssessmentSearchQuery] = useState("")
  const [loadingAssessments, setLoadingAssessments] = useState(true)

  const [cutiStats, setCutiStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [assessmentStats, setAssessmentStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })

  const loadData = useCallback(async () => {
    if (!user?.site || !user?.departemen) return

    try {
      setLoading(true)
      setError(null)

      const [pendingRes, allRes, assessmentsRes] = await Promise.all([
        fetch(
          `/api/workflow?action=pending&role=dic&site=${encodeURIComponent(user.site)}&departemen=${encodeURIComponent(user.departemen)}`,
        ),
        fetch(
          `/api/workflow?action=all&role=dic&site=${encodeURIComponent(user.site)}&departemen=${encodeURIComponent(user.departemen)}`,
        ),
        fetch(`/api/assessments?createdBy=${user.nik}`), // changed from user.id to user.nik
      ])

      if (!pendingRes.ok || !allRes.ok || !assessmentsRes.ok) {
        throw new Error("Failed to fetch data from server")
      }

      const pendingData = await pendingRes.json()
      const allData = await allRes.json()
      const assessmentsData = await assessmentsRes.json()

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

      const assessments = Array.isArray(assessmentsData)
        ? assessmentsData
        : assessmentsData?.success && Array.isArray(assessmentsData.data)
          ? assessmentsData.data
          : []

      setPendingRequests(pendingRequests)
      setAllRequests(allRequests)

      setCutiStats({
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

      setAssessments(assessments)

      setAssessmentStats({
        total: assessments.length,
        pending: assessments.filter((a) => a.status === "pending_pjo" || a.status === "pending_hr_site").length,
        approved: assessments.filter((a) => a.status === "approved").length,
        rejected: assessments.filter((a) => a.status === "rejected").length,
      })

      setError(null)
    } catch (error) {
      console.error("[DIC] Error loading data:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load dashboard data"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.site, user?.departemen, user?.nik]) // changed dependency from user.id to user.nik

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "dic") {
      router.push("/login")
      return
    }
    loadData()
  }, [user?.role, isAuthenticated, router, loadData])

  const totalPending = cutiStats.pending + assessmentStats.pending

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Overview">
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Memuat data dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard DIC">
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" onClick={loadData} className="ml-4 bg-transparent">
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 md:p-6 text-white">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Selamat Datang, {user?.nama}</h2>
          <p className="text-sm md:text-base text-green-100">
            DIC {user?.departemen} - {user?.site} • {totalPending} pending approval menunggu persetujuan Anda
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Pengajuan Cuti Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base md:text-lg">Pengajuan Cuti</CardTitle>
                </div>
                <Link href="/dashboard/dic/cuti">
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-sm">Kelola persetujuan cuti karyawan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-slate-600">Menunggu</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">{cutiStats.pending}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-600" />
                    <span className="text-sm text-slate-600">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{cutiStats.total}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-slate-600">Disetujui</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{cutiStats.approved}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-slate-600">Ditolak</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{cutiStats.rejected}</p>
                </div>
              </div>
              {cutiStats.pending > 0 && (
                <Link href="/dashboard/dic/cuti">
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-sm md:text-base">
                    Review {cutiStats.pending} Pengajuan Cuti
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Assessment Karyawan Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base md:text-lg">Assessment Karyawan</CardTitle>
                </div>
                <Link href="/dashboard/dic/assessment">
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-sm">Kelola penilaian kinerja karyawan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-slate-600">Pending</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">{assessmentStats.pending}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-slate-600" />
                    <span className="text-sm text-slate-600">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{assessmentStats.total}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-slate-600">Approved</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{assessmentStats.approved}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-slate-600">Rejected</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{assessmentStats.rejected}</p>
                </div>
              </div>
              <Link href="/assessment-karyawan">
                <Button className="w-full mt-4 bg-[#D4AF37] hover:bg-[#B8941F] text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Assessment Baru
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-sm">Akses cepat ke fitur yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <Link href="/dashboard/dic/cuti">
                <Button variant="outline" className="w-full h-auto py-3 md:py-4 justify-start bg-transparent">
                  <div className="flex items-start gap-3 w-full">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base mb-1">Kelola Pengajuan Cuti</p>
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                        Approve atau reject pengajuan cuti
                      </p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/dic/assessment">
                <Button variant="outline" className="w-full h-auto py-3 md:py-4 justify-start bg-transparent">
                  <div className="flex items-start gap-3 w-full">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <ClipboardList className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base mb-1">Lihat Assessment</p>
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                        Tracking assessment yang dibuat
                      </p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/assessment-karyawan">
                <Button variant="outline" className="w-full h-auto py-3 md:py-4 justify-start bg-transparent">
                  <div className="flex items-start gap-3 w-full">
                    <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                      <Plus className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base mb-1">Buat Assessment Baru</p>
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed">Penilaian kinerja karyawan</p>
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cutiStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cutiStats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cutiStats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cutiStats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Daftar Pengajuan Izin</CardTitle>
            <CardDescription className="text-sm">
              Tinjau pengajuan izin dari departemen {user?.departemen} di site {user?.site}
            </CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama, NIK, atau jenis cuti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 gap-2 h-auto bg-muted p-1">
                <TabsTrigger
                  value="pending"
                  className="text-xs whitespace-normal h-auto py-2 px-2 data-[state=active]:bg-background"
                >
                  <span className="block">Menunggu</span>
                  <span className="block">({cutiStats.pending})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="text-xs whitespace-normal h-auto py-2 px-2 data-[state=active]:bg-background"
                >
                  <span className="block">Semua</span>
                  <span className="block">({cutiStats.total})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="text-xs whitespace-normal h-auto py-2 px-2 data-[state=active]:bg-background"
                >
                  <span className="block">Disetujui</span>
                  <span className="block">({cutiStats.approved})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="text-xs whitespace-normal h-auto py-2 px-2 data-[state=active]:bg-background"
                >
                  <span className="block">Ditolak</span>
                  <span className="block">({cutiStats.rejected})</span>
                </TabsTrigger>
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
                {allRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allRequests.map((request) => (
                      <RequestRow key={request.id} request={request} onSelect={setSelectedRequest} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-4">
                {allRequests.filter((r) => r.status !== "pending_dic" && r.status !== "ditolak_dic").length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan yang disetujui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allRequests
                      .filter((r) => r.status !== "pending_dic" && r.status !== "ditolak_dic")
                      .map((request) => (
                        <RequestRow key={request.id} request={request} onSelect={setSelectedRequest} />
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-4">
                {allRequests.filter((r) => r.status === "ditolak_dic").length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan yang ditolak</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allRequests
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

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <ClipboardList className="h-5 w-5" />
                  Assessment Karyawan
                </CardTitle>
                <CardDescription className="text-sm">
                  Kelola penilaian kinerja karyawan di departemen Anda
                </CardDescription>
              </div>
              <Link href="/assessment-karyawan">
                <Button className="bg-[#D4AF37] hover:bg-[#B8941F] w-full sm:w-auto text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Assessment Baru
                </Button>
              </Link>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama karyawan, NIK, atau departemen..."
                value={assessmentSearchQuery}
                onChange={(e) => setAssessmentSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div className="border rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-slate-600 mb-1">Total</p>
                <p className="text-2xl md:text-3xl font-bold">{assessmentStats.total}</p>
              </div>
              <div className="border rounded-lg p-3 md:p-4 border-yellow-200 bg-yellow-50">
                <p className="text-xs md:text-sm text-yellow-700 mb-1">Pending</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-700">{assessmentStats.pending}</p>
              </div>
              <div className="border rounded-lg p-3 md:p-4 border-green-200 bg-green-50">
                <p className="text-xs md:text-sm text-green-700 mb-1">Approved</p>
                <p className="text-2xl md:text-3xl font-bold text-green-700">{assessmentStats.approved}</p>
              </div>
              <div className="border rounded-lg p-3 md:p-4 border-red-200 bg-red-50">
                <p className="text-xs md:text-sm text-red-700 mb-1">Rejected</p>
                <p className="text-2xl md:text-3xl font-bold text-red-700">{assessmentStats.rejected}</p>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  Semua ({assessmentStats.total})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm">
                  Pending ({assessmentStats.pending})
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm">
                  Approved ({assessmentStats.approved})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs sm:text-sm">
                  Rejected ({assessmentStats.rejected})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {loadingAssessments ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">Loading assessments...</p>
                  </div>
                ) : assessments.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">Belum ada assessment yang dibuat</p>
                    <Link href="/assessment-karyawan">
                      <Button className="bg-[#D4AF37] hover:bg-[#B8941F]">
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Assessment Pertama
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessments.map((assessment) => (
                      <AssessmentRow key={assessment.id} assessment={assessment} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                {assessments.filter((a) => a.status === "pending_pjo" || a.status === "pending_hr_site").length ===
                0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada assessment yang pending</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessments
                      .filter((a) => a.status === "pending_pjo" || a.status === "pending_hr_site")
                      .map((assessment) => (
                        <AssessmentRow key={assessment.id} assessment={assessment} />
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-4">
                {assessments.filter((a) => a.status === "approved").length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada assessment yang approved</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessments
                      .filter((a) => a.status === "approved")
                      .map((assessment) => (
                        <AssessmentRow key={assessment.id} assessment={assessment} />
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-4">
                {assessments.filter((a) => a.status === "rejected").length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada assessment yang rejected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessments
                      .filter((a) => a.status === "rejected")
                      .map((assessment) => (
                        <AssessmentRow key={assessment.id} assessment={assessment} />
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

function AssessmentRow({ assessment }: { assessment: EmployeeAssessment }) {
  const getAssessmentStatusBadge = (status: string) => {
    switch (status) {
      case "pending_pjo":
        return <Badge className="bg-yellow-500">Menunggu PJO</Badge>
      case "pending_hr_site":
        return <Badge className="bg-blue-500">Menunggu HR Site</Badge>
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-600">Rejected</Badge>
      default:
        return <Badge className="bg-slate-500">{status}</Badge>
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade === "Sangat Baik") return "text-green-600 font-bold"
    if (grade === "Baik") return "text-green-500 font-bold"
    if (grade === "Cukup") return "text-blue-500 font-bold"
    if (grade === "Kurang") return "text-yellow-500 font-bold"
    return "text-red-500 font-bold"
  }

  return (
    <div className="border rounded-lg p-3 md:p-4 hover:bg-slate-50 transition">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base md:text-lg">{assessment.employeeName}</h3>
          <p className="text-xs md:text-sm text-slate-600">
            NIK: {assessment.employeeNik} • {assessment.employeeJabatan} • {assessment.employeeDepartemen}
          </p>
          <p className="text-xs text-slate-500 mt-1">Periode: {assessment.assessmentPeriod}</p>
        </div>
        {getAssessmentStatusBadge(assessment.status)}
      </div>
      <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-2 border-t">
        <div>
          <p className="text-xs text-slate-500">Score</p>
          <p className="text-base md:text-lg font-bold">{assessment.totalScore?.toFixed(2) || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Grade</p>
          <p className={`text-base md:text-lg ${getGradeColor(assessment.grade)}`}>{assessment.grade || "N/A"}</p>
        </div>
        <div className="ml-auto">
          <p className="text-xs text-slate-500">Dibuat</p>
          <p className="text-xs md:text-sm">{new Date(assessment.createdAt).toLocaleDateString("id-ID")}</p>
        </div>
      </div>
    </div>
  )
}
