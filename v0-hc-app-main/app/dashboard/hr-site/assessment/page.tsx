"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Search, CheckCircle, ArrowLeft, Clock } from "lucide-react"
import type { EmployeeAssessment } from "@/lib/types"
import { AssessmentApprovalCard } from "@/components/assessment-approval-card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function HRSiteAssessmentPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [pendingAssessments, setPendingAssessments] = useState<EmployeeAssessment[]>([])
  const [historyAssessments, setHistoryAssessments] = useState<EmployeeAssessment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending")

  const loadPendingAssessments = useCallback(async () => {
    if (!user?.site) return

    try {
      const response = await fetch(`/api/assessments?site=${encodeURIComponent(user.site)}&status=pending_hr_site`)
      if (response.ok) {
        const result = await response.json()
        const data = result?.success && Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : []
        console.log("[v0] HR Site Assessment loaded pending:", data.length)
        setPendingAssessments(data)
      }
    } catch (error) {
      console.error("[HR Site Assessment] Error loading pending assessments:", error)
    }
  }, [user?.site])

  const loadHistoryAssessments = useCallback(async () => {
    if (!user?.site) return

    try {
      const response = await fetch(`/api/assessments?site=${encodeURIComponent(user.site)}`)
      if (response.ok) {
        const result = await response.json()
        const data = result?.success && Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : []
        const history = data.filter((a: any) => a.status === "approved" || a.status === "rejected")
        console.log("[v0] HR Site Assessment loaded history:", history.length)
        setHistoryAssessments(history)
      }
    } catch (error) {
      console.error("[HR Site Assessment] Error loading history assessments:", error)
    }
  }, [user?.site])

  const loadAllAssessments = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadPendingAssessments(), loadHistoryAssessments()])
    setLoading(false)
  }, [loadPendingAssessments, loadHistoryAssessments])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "hr_site") {
      router.push("/login")
      return
    }
    loadAllAssessments()
  }, [user?.role, isAuthenticated, router, loadAllAssessments])

  const filterAssessments = (assessments: EmployeeAssessment[]) => {
    if (!searchQuery) return assessments
    return assessments.filter(
      (a) =>
        a.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.employeeNik?.includes(searchQuery) ||
        a.employeeDepartemen?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  const filteredPending = filterAssessments(pendingAssessments)
  const filteredHistory = filterAssessments(historyAssessments)

  if (loading) {
    return (
      <DashboardLayout title="Assessment Karyawan">
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Assessment Karyawan">
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/hr-site">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Menu Utama
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5" />
              <CardTitle>
                {activeTab === "pending"
                  ? "Assessment Karyawan - Final Approval HR Site"
                  : "Assessment Karyawan - Riwayat"}
              </CardTitle>
            </div>
            <CardDescription>
              {activeTab === "pending"
                ? `Persetujuan final assessment karyawan yang telah disetujui DIC dan PJO Site untuk site ${user?.site}`
                : `Semua assessment yang telah diproses (disetujui atau ditolak) untuk site ${user?.site}`}
            </CardDescription>

            <div className="flex flex-col sm:flex-row gap-2 mt-4 mb-4">
              <Button
                variant={activeTab === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("pending")}
                className="w-full sm:w-auto text-sm h-auto py-2 whitespace-normal"
              >
                Menunggu Final Approval ({pendingAssessments.length})
              </Button>
              <Button
                variant={activeTab === "history" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("history")}
                className="w-full sm:w-auto text-sm h-auto py-2 whitespace-normal"
              >
                Riwayat ({historyAssessments.length})
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama karyawan, NIK, atau departemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "pending" ? (
              filteredPending.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                  <p className="text-slate-600">
                    {searchQuery
                      ? "Tidak ada assessment yang sesuai dengan pencarian"
                      : "Tidak ada assessment yang menunggu final approval"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPending.map((assessment) => (
                    <AssessmentApprovalCard
                      key={assessment.id}
                      assessment={assessment}
                      onApprove={() => loadAllAssessments()}
                      onReject={() => loadAllAssessments()}
                    />
                  ))}
                </div>
              )
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">
                  {searchQuery ? "Tidak ada assessment yang sesuai dengan pencarian" : "Belum ada riwayat assessment"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((assessment) => (
                  <AssessmentApprovalCard
                    key={assessment.id}
                    assessment={assessment}
                    onApprove={() => loadAllAssessments()}
                    onReject={() => loadAllAssessments()}
                    readOnly
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
