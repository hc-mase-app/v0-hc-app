"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, FileText, Search, Plus, ClipboardList, AlertCircle, ArrowRight } from "lucide-react"
import type { LeaveRequest, EmployeeAssessment } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

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
  const [filteredPendingRequests, setFilteredPendingRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingCuti, setLoadingCuti] = useState(true)
  const [loadingAssessments, setLoadingAssessments] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [assessments, setAssessments] = useState<EmployeeAssessment[]>([])

  const loadCutiData = useCallback(async () => {
    if (!user?.site || !user?.departemen) return

    try {
      setLoadingCuti(true)
      setError(null)

      const pendingRes = await fetch(
        `/api/workflow?action=pending&role=dic&site=${encodeURIComponent(user.site)}&departemen=${encodeURIComponent(user.departemen)}`,
      )

      if (!pendingRes.ok) {
        throw new Error("Failed to fetch pending requests")
      }

      const pendingData = await pendingRes.json()

      const pendingRequests = Array.isArray(pendingData)
        ? pendingData
        : pendingData?.success && Array.isArray(pendingData.data)
          ? pendingData.data
          : []

      setPendingRequests(pendingRequests)
      setFilteredPendingRequests(pendingRequests)
      setError(null)
    } catch (error) {
      console.error("Error loading cuti data:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load cuti data"
      setError(errorMessage)
    } finally {
      setLoadingCuti(false)
    }
  }, [user?.site, user?.departemen])

  const loadAssessmentData = useCallback(async () => {
    if (!user?.nik) return

    try {
      setLoadingAssessments(true)

      const assessmentsRes = await fetch(`/api/assessments?createdBy=${user.nik}&limit=5`)

      if (!assessmentsRes.ok) {
        throw new Error("Failed to fetch assessments")
      }

      const assessmentsData = await assessmentsRes.json()

      const assessments = Array.isArray(assessmentsData)
        ? assessmentsData
        : assessmentsData?.success && Array.isArray(assessmentsData.data)
          ? assessmentsData.data
          : []

      setAssessments(assessments)
    } catch (error) {
      console.error("Error loading assessment data:", error)
    } finally {
      setLoadingAssessments(false)
    }
  }, [user?.nik])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "dic") {
      router.push("/login")
      return
    }

    loadCutiData()
    loadAssessmentData()
  }, [user?.role, isAuthenticated, router, loadCutiData, loadAssessmentData])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredPendingRequests(pendingRequests)
        return
      }

      const query = searchQuery.toLowerCase()
      const filtered = pendingRequests.filter((request) => {
        return (
          (request.userName?.toLowerCase() || "").includes(query) ||
          (request.userNik?.toLowerCase() || "").includes(query) ||
          (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query) ||
          (request.bookingCode?.toLowerCase() || "").includes(query)
        )
      })
      setFilteredPendingRequests(filtered)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, pendingRequests])

  return (
    <DashboardLayout title="Dashboard DIC">
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" onClick={loadCutiData} className="ml-4 bg-transparent">
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{user?.nama || "Loading..."}</h1>
            <p className="text-sm text-slate-600 mt-1">
              DIC {user?.departemen || ""} - {user?.site || ""}
            </p>
          </div>
          {!loadingCuti && pendingRequests.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
                <p className="text-xs text-yellow-700">Pending Approval</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Pengajuan Cuti</CardTitle>
                    <CardDescription className="text-xs mt-1">Approval persetujuan cuti</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari nama, NIK, jenis cuti..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                    disabled={loadingCuti}
                  />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {loadingCuti ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-sm text-slate-600">Memuat pengajuan cuti...</p>
                    </div>
                  ) : filteredPendingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">
                        {searchQuery ? "Tidak ada hasil pencarian" : "Tidak ada pengajuan yang menunggu"}
                      </p>
                    </div>
                  ) : (
                    filteredPendingRequests
                      .slice(0, 5)
                      .map((request) => (
                        <ApprovalCard
                          key={request.id}
                          request={request}
                          onApprove={() => loadCutiData()}
                          onReject={() => loadCutiData()}
                          onViewDetail={() => setSelectedRequest(request)}
                        />
                      ))
                  )}
                </div>

                <Link href="/dashboard/dic/cuti">
                  <Button variant="outline" className="w-full bg-transparent">
                    {pendingRequests.length > 0
                      ? `Lihat Semua (${pendingRequests.length} Pengajuan)`
                      : "Lihat Riwayat Persetujuan"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Assessment Karyawan</CardTitle>
                    <CardDescription className="text-xs mt-1">Buat dan kelola penilaian kinerja</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <Link href="/assessment-karyawan">
                  <Button className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-white h-12">
                    <Plus className="h-5 w-5 mr-2" />
                    Buat Assessment Baru
                  </Button>
                </Link>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Riwayat Assessment (5 Terakhir)</h4>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {loadingAssessments ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                        <p className="text-sm text-slate-600">Memuat assessment...</p>
                      </div>
                    ) : assessments.length === 0 ? (
                      <div className="text-center py-8">
                        <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-600">Belum ada assessment yang dibuat</p>
                      </div>
                    ) : (
                      assessments
                        .slice(0, 5)
                        .map((assessment) => <AssessmentRow key={assessment.id} assessment={assessment} />)
                    )}
                  </div>

                  <Link href="/dashboard/dic/assessment">
                    <Button variant="outline" className="w-full mt-3 bg-transparent">
                      Lihat Semua Assessment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedRequest && (
        <LeaveRequestDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onUpdate={loadCutiData}
        />
      )}
    </DashboardLayout>
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
            Nik: {assessment.employeeNik} • {assessment.employeeJabatan} • {assessment.employeeDepartemen}
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
