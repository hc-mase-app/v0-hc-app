"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { ApprovalCard } from "@/components/approval-card"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PJOSiteDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pendingDIC: 0,
    pendingPJO: 0,
    pendingHRHO: 0,
    approved: 0,
    rejected: 0,
  })
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const loadData = useCallback(async () => {
    if (!user || !user.site) {
      console.log("[v0] PJO loadData - user or site is missing:", { userId: user?.id, site: user?.site })
      return
    }

    try {
      console.log("[v0] PJO loadData START - user:", {
        id: user.id,
        role: user.role,
        site: user.site,
        departemen: user.departemen,
      })

      // Fetch pending PJO requests
      const siteParam = encodeURIComponent(user.site)
      const pendingUrl = `/api/leave-requests?type=pending-pjo&site=${siteParam}`
      console.log("[v0] PJO fetching pending from:", pendingUrl)

      const pendingRes = await fetch(pendingUrl)
      console.log("[v0] PJO pending response status:", pendingRes.status)

      if (!pendingRes.ok) {
        console.error("[v0] PJO pending fetch failed with status:", pendingRes.status)
        const errorText = await pendingRes.text()
        console.error("[v0] PJO pending error response:", errorText)
        setPendingRequests([])
      } else {
        const pending = await pendingRes.json()
        console.log("[v0] PJO pending requests received:", pending)
        console.log("[v0] PJO pending requests count:", Array.isArray(pending) ? pending.length : "not an array")

        if (Array.isArray(pending)) {
          setPendingRequests(
            pending.sort(
              (a: LeaveRequest, b: LeaveRequest) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            ),
          )
        } else {
          console.error("[v0] PJO pending is not an array:", pending)
          setPendingRequests([])
        }
      }

      // Fetch all requests from site
      const allUrl = `/api/leave-requests?type=site&site=${siteParam}`
      console.log("[v0] PJO fetching all from:", allUrl)

      const allRes = await fetch(allUrl)
      console.log("[v0] PJO all response status:", allRes.status)

      if (!allRes.ok) {
        console.error("[v0] PJO all fetch failed with status:", allRes.status)
        const errorText = await allRes.text()
        console.error("[v0] PJO all error response:", errorText)
        setAllRequests([])
      } else {
        const all = await allRes.json()
        console.log("[v0] PJO all requests received:", all)
        console.log("[v0] PJO all requests count:", Array.isArray(all) ? all.length : "not an array")

        if (Array.isArray(all)) {
          setAllRequests(
            all.sort(
              (a: LeaveRequest, b: LeaveRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            ),
          )

          // Calculate stats
          setStats({
            total: all.length,
            pendingDIC: all.filter((r: LeaveRequest) => r.status === "pending_dic").length,
            pendingPJO: pendingRequests.length, // Fixed: pendingRequests is now declared
            pendingHRHO: all.filter((r: LeaveRequest) => r.status === "pending_hr_ho").length,
            approved: all.filter((r: LeaveRequest) => r.status === "approved").length,
            rejected: all.filter((r: LeaveRequest) => r.status === "rejected").length,
          })
        } else {
          console.error("[v0] PJO all is not an array:", all)
          setAllRequests([])
        }
      }

      console.log("[v0] PJO loadData END")
    } catch (error) {
      console.error("[v0] PJO Error loading data:", error)
    }
  }, [user, pendingRequests])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log("[v0] PJO not authenticated or no user, redirecting to login")
      router.push("/login")
      return
    }

    if (user.role !== "pjo_site") {
      console.log("[v0] PJO user role is not pjo_site, redirecting to dashboard")
      router.push("/dashboard")
      return
    }

    console.log("[v0] PJO useEffect triggered, calling loadData")
    loadData()
  }, [user, isAuthenticated, router, loadData])

  const handleApprovalAction = () => {
    loadData()
    setSelectedRequest(null)
  }

  if (!user) return null

  return (
    <DashboardLayout title="Dashboard PJO Site">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending DIC</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingDIC}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending PJO</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPJO}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending HR HO</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingHRHO}</div>
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

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Menunggu Persetujuan ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="all">Semua Pengajuan ({allRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pengajuan Menunggu Persetujuan PJO Site</CardTitle>
                <CardDescription>
                  Pengajuan dari site {user.site} yang telah disetujui DIC, menunggu persetujuan PJO
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                        onApprove={handleApprovalAction}
                        onReject={handleApprovalAction}
                        onViewDetail={() => setSelectedRequest(request)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Semua Pengajuan dari Site {user.site}</CardTitle>
                <CardDescription>Lihat semua pengajuan dari site Anda</CardDescription>
              </CardHeader>
              <CardContent>
                {allRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Tidak ada pengajuan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allRequests.map((request) => (
                      <ApprovalCard
                        key={request.id}
                        request={request}
                        onViewDetail={() => setSelectedRequest(request)}
                        readOnly
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
