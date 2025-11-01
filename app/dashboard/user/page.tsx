"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import type { LeaveRequest } from "@/lib/types"
import { Calendar, User, Briefcase, Building2 } from "lucide-react"

export default function UserDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (user.role !== "user") {
      router.push("/dashboard")
      return
    }

    loadData()
  }, [user, isAuthenticated, router])

  const loadData = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/leave-requests?type=user&userId=${user.nik}`)
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error("Error loading leave requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending_dic":
      case "pending_pjo":
      case "pending_hr":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Disetujui"
      case "rejected":
        return "Ditolak"
      case "pending_dic":
        return "Menunggu DIC"
      case "pending_pjo":
        return "Menunggu PJO"
      case "pending_hr":
        return "Menunggu HR HO"
      default:
        return status
    }
  }

  const handleViewDetail = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setDetailOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Riwayat Pengajuan</h1>
          <p className="text-muted-foreground mt-2">Lihat semua pengajuan cuti Anda secara lengkap</p>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Anda belum membuat pengajuan cuti</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{request.jenisPengajuanCuti}</CardTitle>
                    <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">NIK</p>
                        <p className="font-medium">{request.userNik}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Nama</p>
                        <p className="font-medium">{request.userName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Jabatan</p>
                        <p className="font-medium">{request.jabatan}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Departemen</p>
                        <p className="font-medium">{request.departemen}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Tanggal Keberangkatan</p>
                        <p className="font-medium">
                          {request.tanggalKeberangkatan
                            ? new Date(request.tanggalKeberangkatan).toLocaleDateString("id-ID", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewDetail(request)} className="w-full">
                    Lihat Detail Lengkap
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedRequest && (
        <LeaveRequestDetailDialog
          request={selectedRequest}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          currentUserId={user?.id}
          isUserRole={true}
        />
      )}
    </DashboardLayout>
  )
}
