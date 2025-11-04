"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  ClipboardList,
  ArrowRight,
  TrendingUp,
} from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function HRSiteDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [cutiStats, setCutiStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [assessmentStats, setAssessmentStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  const loadStats = useCallback(async () => {
    if (!user?.site) return

    try {
      setLoading(true)

      const [cutiRes, assessmentsRes] = await Promise.all([
        fetch(`/api/workflow?action=all&role=hr_site&site=${encodeURIComponent(user.site)}`),
        fetch(`/api/assessments?site=${encodeURIComponent(user.site)}`),
      ])

      const [cutiResult, assessmentsResult] = await Promise.all([cutiRes.json(), assessmentsRes.json()])

      const cutiData =
        cutiResult?.success && Array.isArray(cutiResult.data)
          ? cutiResult.data
          : Array.isArray(cutiResult)
            ? cutiResult
            : []
      const assessmentsData =
        assessmentsResult?.success && Array.isArray(assessmentsResult.data)
          ? assessmentsResult.data
          : Array.isArray(assessmentsResult)
            ? assessmentsResult
            : []

      console.log("[v0] HR Site Dashboard loaded:", cutiData.length, "cuti,", assessmentsData.length, "assessments")

      setCutiStats({
        total: cutiData.length,
        pending: cutiData.filter(
          (r: any) => r.status === "pending_dic" || r.status === "pending_pjo" || r.status === "pending_hr_ho",
        ).length,
        approved: cutiData.filter((r: any) => r.status === "di_proses" || r.status === "tiket_issued").length,
        rejected: cutiData.filter((r: any) => r.status?.includes("ditolak")).length,
      })

      setAssessmentStats({
        total: assessmentsData.length,
        pending: assessmentsData.filter((a: any) => a.status === "pending_hr_site").length,
        approved: assessmentsData.filter((a: any) => a.status === "approved").length,
        rejected: assessmentsData.filter((a: any) => a.status === "rejected").length,
      })
    } catch (error) {
      console.error("[HR Site Overview] Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.site])

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "hr_site") {
      router.push("/login")
      return
    }
    loadStats()
  }, [user, isAuthenticated, router, loadStats])

  const loadData = async () => {
    if (!user) return

    try {
      console.log("[v0] HR Site loading data for:", { role: user.role, site: user.site })

      const response = await fetch(`/api/workflow?action=all&role=hr_site&site=${encodeURIComponent(user.site)}`)
      const data = await response.json()

      console.log("[v0] HR Site received data:", data)

      if (!response.ok || !Array.isArray(data)) {
        console.error("[v0] HR Site API error:", data)
        setRequests([])
        setFilteredRequests([])
        return
      }

      const sortedRequests = data.sort(
        (a: LeaveRequest, b: LeaveRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      setRequests(sortedRequests)
      setFilteredRequests(sortedRequests)
    } catch (error) {
      console.error("[v0] Error loading leave requests:", error)
      setRequests([])
      setFilteredRequests([])
    }
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

  const totalPending = cutiStats.pending + assessmentStats.pending

  if (!user || loading) return null

  return (
    <DashboardLayout title="Dashboard HR Site">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-4 md:p-6 text-white">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Selamat Datang, {user?.nama}</h2>
          <p className="text-sm md:text-base text-indigo-100">
            HR Site {user?.site} • {totalPending} pending approval menunggu persetujuan Anda
          </p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Pengajuan Cuti Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base md:text-lg">Pengajuan Cuti</CardTitle>
                </div>
                <Link href="/dashboard/hr-site/cuti">
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-sm">Kelola pengajuan cuti karyawan</CardDescription>
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
              <Link href="/dashboard/hr-site/cuti">
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-sm md:text-base">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajukan Izin Baru
                </Button>
              </Link>
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
                <Link href="/dashboard/hr-site/assessment">
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-sm">Final approval assessment karyawan</CardDescription>
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
                    <span className="text-sm text-slate-600">Approved</span>
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
                <Link href="/dashboard/hr-site/assessment">
                  <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-sm md:text-base">
                    Review {assessmentStats.pending} Assessment
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Card */}
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
              <Link href="/dashboard/hr-site/cuti">
                <Button variant="outline" className="w-full h-auto py-3 md:py-4 justify-start bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm md:text-base">Kelola Pengajuan Cuti</p>
                      <p className="text-xs md:text-sm text-slate-600">Lihat dan kelola semua pengajuan cuti</p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/hr-site/assessment">
                <Button variant="outline" className="w-full h-auto py-3 md:py-4 justify-start bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm md:text-base">Final Approval Assessment</p>
                      <p className="text-xs md:text-sm text-slate-600">Review dan approve assessment karyawan</p>
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

function RequestCard({
  request,
}: {
  request: LeaveRequest
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors">
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
