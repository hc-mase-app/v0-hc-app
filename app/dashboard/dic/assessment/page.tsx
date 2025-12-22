"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Search, CheckCircle, ArrowLeft, Plus } from "lucide-react"
import type { EmployeeAssessment } from "@/lib/types"
import { AssessmentApprovalCard } from "@/components/assessment-approval-card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function DICAssessmentPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [assessmentsPending, setAssessmentsPending] = useState<EmployeeAssessment[]>([])
  const [assessmentsCreated, setAssessmentsCreated] = useState<EmployeeAssessment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pending" | "created">("pending")

  const loadAssessments = useCallback(async () => {
    if (!user?.site || !user?.nik) return

    try {
      setLoading(true)

      console.log("[v0] DIC Assessment - Loading assessments for NIK:", user.nik)

      // Load pending assessments
      const pendingUrl = `/api/assessments?site=${encodeURIComponent(user.site)}&status=pending_dic`
      console.log("[v0] Fetching pending from:", pendingUrl)
      const pendingResponse = await fetch(pendingUrl)
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        const pendingArray = Array.isArray(pendingData)
          ? pendingData
          : pendingData?.success && Array.isArray(pendingData.data)
            ? pendingData.data
            : []
        setAssessmentsPending(pendingArray)
        console.log("[v0] Pending assessments count:", pendingArray.length)
      }

      // Load assessments created by this DIC user
      const createdUrl = `/api/assessments?createdBy=${encodeURIComponent(user.nik)}`
      console.log("[v0] Fetching created from:", createdUrl)
      const createdResponse = await fetch(createdUrl)
      if (createdResponse.ok) {
        const createdData = await createdResponse.json()
        console.log("[v0] Created response data:", createdData)
        const createdArray = Array.isArray(createdData)
          ? createdData
          : createdData?.success && Array.isArray(createdData.data)
            ? createdData.data
            : []
        console.log("[v0] Created is array:", Array.isArray(createdArray))
        console.log("[v0] Created length:", createdArray.length)
        setAssessmentsCreated(createdArray)
      } else {
        console.error("[v0] Created fetch failed with status:", createdResponse.status)
      }
    } catch (error) {
      console.error("[DIC Assessment] Error loading assessments:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.site, user?.nik])

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "dic") {
      router.push("/login")
      return
    }
    loadAssessments()
  }, [user?.role, isAuthenticated, router, loadAssessments])

  const assessments = activeTab === "pending" ? assessmentsPending : assessmentsCreated
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Menu Utama
            </Button>
          </Link>

          <Link href="/assessment-karyawan">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Buat Assessment Baru
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5" />
              <CardTitle className="text-base md:text-lg leading-tight">
                {activeTab === "pending"
                  ? "Assessment Karyawan - Menunggu Review DIC"
                  : "Assessment Karyawan - Riwayat Pengajuan"}
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              {activeTab === "pending"
                ? `Review dan approve assessment karyawan dari site ${user?.site} (semua departemen)`
                : `Riwayat assessment yang telah Anda buat`}
            </CardDescription>

            <div className="flex flex-col sm:flex-row gap-2 mt-4 mb-4">
              <Button
                variant={activeTab === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("pending")}
                className="w-full sm:w-auto text-xs whitespace-normal h-auto py-2"
              >
                <span className="block sm:inline">Menunggu Review</span>{" "}
                <span className="block sm:inline">({assessmentsPending.length})</span>
              </Button>
              <Button
                variant={activeTab === "created" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("created")}
                className="w-full sm:w-auto text-xs whitespace-normal h-auto py-2"
              >
                <span className="block sm:inline">Riwayat Pengajuan</span>{" "}
                <span className="block sm:inline">({assessmentsCreated.length})</span>
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama, NIK, departemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
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
                      : "Tidak ada riwayat pengajuan assessment"}
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
                    readOnly={activeTab === "created"}
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
