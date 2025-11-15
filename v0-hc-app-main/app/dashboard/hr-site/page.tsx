"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Clock, CheckCircle, XCircle, ArrowRight, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function HRSiteDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [assessmentStats, setAssessmentStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    if (!user?.site) return

    try {
      setLoading(true)

      const assessmentsRes = await fetch(`/api/assessments?site=${encodeURIComponent(user.site)}`)
      const assessmentsResult = await assessmentsRes.json()

      const assessmentsData =
        assessmentsResult?.success && Array.isArray(assessmentsResult.data)
          ? assessmentsResult.data
          : Array.isArray(assessmentsResult)
            ? assessmentsResult
            : []

      console.log("[v0] HR Site Dashboard loaded:", assessmentsData.length, "assessments")

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

  if (!user || loading) return null

  return (
    <DashboardLayout title="Dashboard HR Site">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 md:p-6 text-white">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Selamat Datang, {user?.nama}</h2>
          <p className="text-sm md:text-base text-purple-100">
            HR Site {user?.site} • {assessmentStats.pending} assessment menunggu final approval Anda
          </p>
        </div>

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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
