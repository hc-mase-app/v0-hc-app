"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Search, CheckCircle, ArrowLeft } from "lucide-react"
import type { EmployeeAssessment } from "@/lib/types"
import { AssessmentApprovalCard } from "@/components/assessment-approval-card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function PJOSiteAssessmentPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [assessmentsPending, setAssessmentsPending] = useState<EmployeeAssessment[]>([])
  const [assessmentsHistory, setAssessmentsHistory] = useState<EmployeeAssessment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending")

  const loadAssessments = useCallback(async () => {
    if (!user?.site) return

    try {
      setLoading(true)

      const pendingResponse = await fetch(`/api/assessments?site=${encodeURIComponent(user.site)}&status=pending_pjo`)
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        const pending = pendingData?.success ? pendingData.data : pendingData
        setAssessmentsPending(Array.isArray(pending) ? pending : [])
      }

      // Fetch assessments that have moved past PJO stage
      const historyResponse = await fetch(`/api/assessments?site=${encodeURIComponent(user.site)}`)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        const history = historyData?.success ? historyData.data : historyData
        // Filter for assessments that are no longer pending_pjo (have been processed)
        const processedAssessments = Array.isArray(history)
          ? history.filter((a: EmployeeAssessment) => a.status !== "pending_pjo" && a.status !== "pending_dic")
          : []
        setAssessmentsHistory(processedAssessments)
      }
    } catch (error) {
      console.error("[PJO Assessment] Error loading assessments:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.site])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "pjo_site") {
      router.push("/login")
      return
    }
    loadAssessments()
  }, [user?.role, isAuthenticated, router, loadAssessments])

  const assessments = activeTab === "pending" ? assessmentsPending : assessmentsHistory

  const filteredAssessments = searchQuery
    ? assessments.filter(
        (a) =>
          a.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.employeeNik?.includes(searchQuery) ||
          a.employeeDepartemen?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : assessments

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
          <Link href="/dashboard/pjo-site">
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
                  ? "Assessment Karyawan - Menunggu Review PJO"
                  : "Assessment Karyawan - Riwayat"}
              </CardTitle>
            </div>
            <CardDescription>
              {activeTab === "pending"
                ? `Review dan approve assessment karyawan dari site ${user?.site} (semua departemen)`
                : `Riwayat assessment yang telah Anda proses`}
            </CardDescription>

            <div className="flex flex-col sm:flex-row gap-2 mt-4 mb-4">
              <Button
                variant={activeTab === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("pending")}
                className="w-full sm:w-auto text-sm h-auto py-2 whitespace-normal"
              >
                Menunggu Review ({assessmentsPending.length})
              </Button>
              <Button
                variant={activeTab === "history" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("history")}
                className="w-full sm:w-auto text-sm h-auto py-2 whitespace-normal"
              >
                Riwayat ({assessmentsHistory.length})
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
            {filteredAssessments.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <p className="text-slate-600">
                  {searchQuery
                    ? "Tidak ada assessment yang sesuai dengan pencarian"
                    : activeTab === "pending"
                      ? "Tidak ada assessment yang menunggu review"
                      : "Tidak ada riwayat assessment"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssessments.map((assessment) => (
                  <AssessmentApprovalCard
                    key={assessment.id}
                    assessment={assessment}
                    onApprove={() => loadAssessments()}
                    onReject={() => loadAssessments()}
                    readOnly={activeTab === "history"}
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
