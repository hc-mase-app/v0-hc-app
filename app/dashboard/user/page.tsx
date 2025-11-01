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
import { Calendar, User, Briefcase, Building2, FileText } from "lucide-react"
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils"

export default function UserDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "user") {
      router.push("/login")
      return
    }

    const loadData = async () => {
      try {
        const res = await fetch(`/api/workflow?action=user-requests&userNik=${user.nik}`)
        const data = await res.json()
        setRequests(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error loading requests:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, isAuthenticated, router])

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout title="Riwayat Pengajuan Saya">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Riwayat Pengajuan</h1>
          <p className="text-muted-foreground mt-2">Lihat semua pengajuan cuti Anda</p>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Anda belum memiliki pengajuan cuti</p>
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
                        <p className="text-muted-foreground text-xs">Tanggal Pengajuan</p>
                        <p className="font-medium">{formatDate(request.tanggalPengajuan)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Periode</p>
                        <p className="font-medium">
                          {formatDate(request.periodeAwal)} - {formatDate(request.periodeAkhir)}
                        </p>
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
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)} className="w-full">
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
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          isUserRole={true}
        />
      )}
    </DashboardLayout>
  )
}
