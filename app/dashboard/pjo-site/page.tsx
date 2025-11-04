"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText, ClipboardList, ArrowRight, TrendingUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string | null
  stats?: Record<string, any>
}

export default function PJOSiteOverview() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [cutiStats, setCutiStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [assessmentStats, setAssessmentStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    if (!user?.site) return

    try {
      setLoading(true)
      setError(null)

      const [cutiStatsRes, assessmentsRes] = await Promise.all([
        fetch(`/api/workflow?action=stats&role=pjo_site&site=${encodeURIComponent(user.site)}`),
        fetch(`/api/assessments?site=${encodeURIComponent(user.site)}`),
      ])

      if (!cutiStatsRes.ok || !assessmentsRes.ok) {
        throw new Error("Failed to fetch data from server")
      }

      const cutiData = await cutiStatsRes.json()
      const assessmentsData = await assessmentsRes.json()

      const cutiStatsData = cutiData?.success ? cutiData.data : cutiData
      const assessmentsDataList = assessmentsData?.success ? assessmentsData.data : assessmentsData

      if (cutiData?.success === false) {
        console.error("[PJO] Cuti stats error:", cutiData.error)
        setError(cutiData.error || "Failed to load cuti stats")
        return
      }

      if (assessmentsData?.success === false) {
        console.error("[PJO] Assessments error:", assessmentsData.error)
        setError(assessmentsData.error || "Failed to load assessments")
        return
      }

      setCutiStats(cutiStatsData || { total: 0, pending: 0, approved: 0, rejected: 0 })

      // Calculate assessment stats
      const assessmentsList = Array.isArray(assessmentsDataList) ? assessmentsDataList : []
      setAssessmentStats({
        total: assessmentsList.length,
        pending: assessmentsList.filter((a: any) => a.status === "pending_pjo").length,
        approved: assessmentsList.filter((a: any) => a.status === "approved" || a.status === "pending_hr_site").length,
        rejected: assessmentsList.filter((a: any) => a.status === "rejected").length,
      })

      setError(null)
    } catch (error) {
      console.error("[PJO Overview] Error loading stats:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load dashboard data"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.site])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "pjo_site") {
      router.push("/login")
      return
    }
    loadStats()
  }, [user?.role, isAuthenticated, router, loadStats])

  if (loading) {
    return (
      <DashboardLayout title="Approval Dashboard">
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Memuat data dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const totalPending = cutiStats.pending + assessmentStats.pending

  return (
    <DashboardLayout title="Approval Dashboard">
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" onClick={loadStats} className="ml-4 bg-transparent">
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 md:p-6 text-white">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Selamat Datang, {user?.nama}</h2>
          <p className="text-sm md:text-base text-blue-100">
            PJO Site {user?.site} • {totalPending} pending approval menunggu persetujuan Anda
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
                <Link href="/dashboard/pjo-site/cuti">
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
                <Link href="/dashboard/pjo-site/cuti">
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
                <Link href="/dashboard/pjo-site/assessment">
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-sm">Review penilaian kinerja karyawan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-slate-600">Menunggu</span>
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
                    <span className="text-sm text-slate-600">Disetujui</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{assessmentStats.approved}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-slate-600">Ditolak</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{assessmentStats.rejected}</p>
                </div>
              </div>
              {assessmentStats.pending > 0 && (
                <Link href="/dashboard/pjo-site/assessment">
                  <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-sm md:text-base">
                    Review {assessmentStats.pending} Assessment
                  </Button>
                </Link>
              )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Link href="/dashboard/pjo-site/cuti">
                <Button variant="outline" className="w-full h-auto py-3 md:py-4 justify-start bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm md:text-base">Kelola Pengajuan Cuti</p>
                      <p className="text-xs md:text-sm text-slate-600">Approve atau reject pengajuan cuti</p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/pjo-site/assessment">
                <Button variant="outline" className="w-full h-auto py-3 md:py-4 justify-start bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm md:text-base">Review Assessment</p>
                      <p className="text-xs md:text-sm text-slate-600">Tinjau penilaian kinerja karyawan</p>
                    </div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
