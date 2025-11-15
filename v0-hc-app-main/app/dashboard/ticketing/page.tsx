"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Ticket, Download, Building2, FileText } from "lucide-react"
import { Database } from "@/lib/database"
import type { LeaveRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { SITES } from "@/lib/mock-data"
import * as XLSX from "xlsx"
import { Input } from "@/components/ui/input"

export default function TicketingDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [approvedRequests, setApprovedRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    withBooking: 0,
    withoutBooking: 0,
  })
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [bookingCodeInput, setBookingCodeInput] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (user.role !== "hr_ticketing") {
      router.push("/dashboard")
      return
    }

    loadData()
  }, [user, isAuthenticated, router])

  const loadData = () => {
    const approved = Database.getApprovedRequests()
    setApprovedRequests(approved.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))

    const all = Database.getLeaveRequests()
    setAllRequests(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))

    const withBooking = approved.filter((r) => r.bookingCode).length
    const withoutBooking = approved.filter((r) => !r.bookingCode).length

    setStats({
      total: all.length,
      approved: approved.length,
      withBooking,
      withoutBooking,
    })
  }

  const handleSetBookingCode = (requestId: string, bookingCode: string) => {
    if (!bookingCode.trim()) {
      alert("Kode Booking tidak boleh kosong")
      return
    }
    Database.setBookingCode(requestId, bookingCode.trim())
    setBookingCodeInput({ ...bookingCodeInput, [requestId]: "" })
    loadData()
  }

  const handleEditBookingCode = (requestId: string, currentCode: string) => {
    const newCode = prompt("Edit Kode Booking:", currentCode)
    if (newCode !== null && newCode.trim()) {
      Database.setBookingCode(requestId, newCode.trim())
      loadData()
    }
  }

  const handleExportToExcel = () => {
    const filtered = selectedSite === "all" ? allRequests : allRequests.filter((r) => r.site === selectedSite)

    const exportData = filtered.map((request) => ({
      "Kode Booking": request.bookingCode || "-",
      NIK: request.userNik,
      Nama: request.userName,
      Site: request.site,
      Departemen: request.departemen,
      "Jenis Izin": request.jenisIzin,
      "Tanggal Mulai": formatDate(request.tanggalMulai),
      "Tanggal Selesai": formatDate(request.tanggalSelesai),
      "Jumlah Hari": request.jumlahHari,
      Alasan: request.alasan,
      Status: getStatusLabel(request.status),
      "Tanggal Pengajuan": formatDate(request.createdAt),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Requests")

    const maxWidth = 50
    const colWidths = Object.keys(exportData[0] || {}).map((key) => {
      const maxLength = Math.max(key.length, ...exportData.map((row) => String(row[key as keyof typeof row]).length))
      return { wch: Math.min(maxLength + 2, maxWidth) }
    })
    worksheet["!cols"] = colWidths

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const fileName = `Leave_Requests_${selectedSite}_${new Date().toISOString().split("T")[0]}.xlsx`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filteredRequests = selectedSite === "all" ? allRequests : allRequests.filter((r) => r.site === selectedSite)

  if (!user) return null

  return (
    <DashboardLayout title="Dashboard HR Ticketing">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Semua site</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Siap untuk booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sudah Ada Kode Booking</CardTitle>
              <Ticket className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withBooking}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Belum Ada Kode Booking</CardTitle>
              <Ticket className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withoutBooking}</div>
            </CardContent>
          </Card>
        </div>

        {/* Issue Booking Code Section */}
        <Card>
          <CardHeader>
            <CardTitle>Pengajuan Disetujui - Input Kode Booking</CardTitle>
            <CardDescription>Input kode booking untuk pengajuan yang telah disetujui</CardDescription>
          </CardHeader>
          <CardContent>
            {approvedRequests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Tidak ada pengajuan yang disetujui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvedRequests.map((request) => (
                  <div key={request.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{request.jenisIzin}</h3>
                          <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
                          {request.bookingCode && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <Ticket className="h-3 w-3 mr-1" />
                              {request.bookingCode}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                          <div>
                            <strong>Pemohon:</strong> {request.userName} ({request.userNik})
                          </div>
                          <div>
                            <strong>Site:</strong> {request.site} - {request.departemen}
                          </div>
                          <div>
                            <strong>Periode:</strong> {formatDate(request.tanggalMulai)} -{" "}
                            {formatDate(request.tanggalSelesai)} ({request.jumlahHari} hari)
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4 flex-col">
                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                          Detail
                        </Button>
                        {!request.bookingCode && (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Kode Booking"
                              value={bookingCodeInput[request.id] || ""}
                              onChange={(e) =>
                                setBookingCodeInput({ ...bookingCodeInput, [request.id]: e.target.value })
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  handleSetBookingCode(request.id, bookingCodeInput[request.id] || "")
                                }
                              }}
                              className="h-9"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSetBookingCode(request.id, bookingCodeInput[request.id] || "")}
                            >
                              <Ticket className="h-4 w-4 mr-2" />
                              Set
                            </Button>
                          </div>
                        )}
                        {request.bookingCode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBookingCode(request.id, request.bookingCode || "")}
                          >
                            <Ticket className="h-4 w-4 mr-2" />
                            Edit Kode
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Export Data ke Excel</CardTitle>
                <CardDescription>Download laporan pengajuan izin dalam format Excel</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <select
                    className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                  >
                    <option value="all">Semua Site</option>
                    {SITES.map((site) => (
                      <option key={site} value={site}>
                        {site}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleExportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export ke Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Total data yang akan di-export: <strong>{filteredRequests.length}</strong> pengajuan
              </p>

              <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-700">Kode Booking</th>
                      <th className="text-left p-3 font-medium text-slate-700">NIK</th>
                      <th className="text-left p-3 font-medium text-slate-700">Nama</th>
                      <th className="text-left p-3 font-medium text-slate-700">Site</th>
                      <th className="text-left p-3 font-medium text-slate-700">Jenis Izin</th>
                      <th className="text-left p-3 font-medium text-slate-700">Periode</th>
                      <th className="text-left p-3 font-medium text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-3">{request.bookingCode || "-"}</td>
                        <td className="p-3">{request.userNik}</td>
                        <td className="p-3">{request.userName}</td>
                        <td className="p-3">{request.site}</td>
                        <td className="p-3">{request.jenisIzin}</td>
                        <td className="p-3">
                          {formatDate(request.tanggalMulai)} - {formatDate(request.tanggalSelesai)}
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
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
