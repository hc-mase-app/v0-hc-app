"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, Search, Edit, Trash2, Download, ArrowLeft, RefreshCw, FileSpreadsheet } from "lucide-react"
import type { LeaveRequest, LeaveStatus } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

const statusColors: Record<LeaveStatus, string> = {
  pending_dic: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  pending_pjo: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pending_manager_ho: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  pending_hr_ho: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  di_proses: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  tiket_issued: "bg-green-500/10 text-green-500 border-green-500/20",
  approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ditolak_dic: "bg-red-500/10 text-red-500 border-red-500/20",
  ditolak_pjo: "bg-red-500/10 text-red-500 border-red-500/20",
  ditolak_manager_ho: "bg-red-500/10 text-red-500 border-red-500/20",
  ditolak_hr_ho: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function ManajemenCutiDBPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [siteFilter, setSiteFilter] = useState<string>("all")
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<any[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "super_admin") {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki akses ke halaman ini",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    fetchLeaveRequests()
  }, [isAuthenticated, user, router])

  useEffect(() => {
    filterRequests()
  }, [searchTerm, statusFilter, siteFilter, leaveRequests])

  const fetchLeaveRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/leave-requests-all")
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setLeaveRequests(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data pengajuan cuti",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterRequests = () => {
    let filtered = [...leaveRequests]

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.userNik.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter)
    }

    if (siteFilter !== "all") {
      filtered = filtered.filter((req) => req.site === siteFilter)
    }

    setFilteredRequests(filtered)
  }

  const handleEdit = (request: LeaveRequest) => {
    setEditingRequest(request)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRequest) return

    try {
      const response = await fetch("/api/admin/leave-requests-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRequest),
      })

      if (!response.ok) throw new Error("Gagal update data")

      toast({
        title: "Berhasil",
        description: "Data berhasil diupdate",
      })

      setIsEditDialogOpen(false)
      fetchLeaveRequests()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal update data",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return

    try {
      const response = await fetch(`/api/admin/leave-requests-delete?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Gagal hapus data")

      toast({
        title: "Berhasil",
        description: "Data berhasil dihapus",
      })

      fetchLeaveRequests()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result
      const workbook = XLSX.read(data, { type: "binary" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet)
      setUploadPreview(jsonData.slice(0, 5))
    }
    reader.readAsBinaryString(file)
  }

  const handleBulkUpload = async () => {
    if (!uploadFile) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)

        const response = await fetch("/api/admin/leave-requests-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: jsonData }),
        })

        if (!response.ok) throw new Error("Gagal upload data")

        const result = await response.json()

        toast({
          title: "Upload Berhasil",
          description: `${result.success} data berhasil diimport, ${result.failed} gagal`,
        })

        setIsUploadDialogOpen(false)
        setUploadFile(null)
        setUploadPreview([])
        fetchLeaveRequests()
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal upload data",
          variant: "destructive",
        })
      }
    }
    reader.readAsBinaryString(uploadFile)
  }

  const handleExportToExcel = () => {
    const exportData = filteredRequests.map((req) => ({
      NIK: req.userNik,
      Nama: req.userName,
      Site: req.site,
      Departemen: req.departemen,
      Jabatan: req.jabatan,
      "Jenis Cuti": req.jenisPengajuanCuti,
      "Tanggal Mulai": req.tanggalMulai,
      "Tanggal Selesai": req.tanggalSelesai,
      "Jumlah Hari": req.jumlahHari,
      Status: req.status,
      "Berangkat Dari": req.berangkatDari,
      Tujuan: req.tujuan,
      "Booking Code": req.bookingCode || "",
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Leave Requests")
    XLSX.writeFile(wb, `Leave_Requests_${new Date().toISOString().split("T")[0]}.xlsx`)

    toast({
      title: "Export Berhasil",
      description: `${exportData.length} data berhasil diexport`,
    })
  }

  const downloadTemplate = () => {
    const template = [
      {
        nik: "12345",
        nama: "John Doe",
        site: "BSF",
        departemen: "PROD",
        jabatan: "Operator",
        poh: "Manager A",
        jenisPengajuanCuti: "Cuti Tahunan",
        jenisPengajuan: "lokal",
        tanggalPengajuan: "2025-01-15",
        tanggalKeberangkatan: "2025-01-20",
        tanggalMulai: "2025-01-20",
        tanggalSelesai: "2025-01-25",
        jumlahHari: 5,
        berangkatDari: "Jakarta",
        tujuan: "Surabaya",
        sisaCutiTahunan: 12,
        catatan: "Pulang kampung",
        alasan: "Kunjungan keluarga",
        status: "pending_dic",
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    XLSX.writeFile(wb, "Template_Leave_Requests.xlsx")
  }

  const uniqueSites = Array.from(new Set(leaveRequests.map((r) => r.site)))

  if (!isAuthenticated || user?.role !== "super_admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/")}
              className="border-[#D4AF37]/30 hover:bg-[#D4AF37]/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#D4AF37]">Manajemen Database Pengajuan Cuti</h1>
              <p className="text-gray-400 text-sm mt-1">Upload Excel, lihat, dan edit database pengajuan cuti</p>
            </div>
          </div>
          <Button onClick={fetchLeaveRequests} variant="outline" size="icon">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <Tabs defaultValue="view" className="w-full">
          <TabsList className="bg-[#1a1a1a] border border-[#D4AF37]/20">
            <TabsTrigger value="view">View Database</TabsTrigger>
            <TabsTrigger value="upload">Upload Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-4">
            <Card className="bg-[#1a1a1a] border-[#D4AF37]/20">
              <CardHeader>
                <CardTitle className="text-[#D4AF37]">Filter & Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Cari NIK atau Nama..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-[#0a0a0a] border-[#D4AF37]/30"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#D4AF37]/30">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending_dic">Pending DIC</SelectItem>
                      <SelectItem value="pending_pjo">Pending PJO</SelectItem>
                      <SelectItem value="pending_hr_ho">Pending HR HO</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="tiket_issued">Tiket Issued</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={siteFilter} onValueChange={setSiteFilter}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#D4AF37]/30">
                      <SelectValue placeholder="Filter Site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Site</SelectItem>
                      {uniqueSites.map((site) => (
                        <SelectItem key={site} value={site}>
                          {site}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleExportToExcel} className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80">
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </div>

                <div className="text-sm text-gray-400">
                  Menampilkan {filteredRequests.length} dari {leaveRequests.length} data
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#D4AF37]/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#D4AF37]/20">
                        <TableHead className="text-[#D4AF37]">NIK</TableHead>
                        <TableHead className="text-[#D4AF37]">Nama</TableHead>
                        <TableHead className="text-[#D4AF37]">Site</TableHead>
                        <TableHead className="text-[#D4AF37]">Jabatan</TableHead>
                        <TableHead className="text-[#D4AF37]">Jenis Cuti</TableHead>
                        <TableHead className="text-[#D4AF37]">Tanggal</TableHead>
                        <TableHead className="text-[#D4AF37]">Status</TableHead>
                        <TableHead className="text-[#D4AF37]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id} className="border-[#D4AF37]/10">
                          <TableCell className="text-white">{request.userNik}</TableCell>
                          <TableCell className="text-white">{request.userName}</TableCell>
                          <TableCell className="text-white">{request.site}</TableCell>
                          <TableCell className="text-white">{request.jabatan}</TableCell>
                          <TableCell className="text-white">{request.jenisPengajuanCuti}</TableCell>
                          <TableCell className="text-white text-xs">
                            {request.tanggalMulai} s/d {request.tanggalSelesai}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[request.status]}>{request.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(request)}
                                className="hover:bg-[#D4AF37]/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(request.id)}
                                className="hover:bg-red-500/10 text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card className="bg-[#1a1a1a] border-[#D4AF37]/20">
              <CardHeader>
                <CardTitle className="text-[#D4AF37]">Upload Excel Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button onClick={downloadTemplate} variant="outline" className="border-[#D4AF37]/30 bg-transparent">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Download Template Excel
                  </Button>
                  <Button
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File Excel
                  </Button>
                </div>

                <div className="bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-lg p-4">
                  <h3 className="text-[#D4AF37] font-semibold mb-2">Petunjuk Upload:</h3>
                  <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                    <li>Download template Excel terlebih dahulu</li>
                    <li>Isi data sesuai dengan format template</li>
                    <li>Pastikan NIK karyawan sudah terdaftar di database users</li>
                    <li>Format tanggal: YYYY-MM-DD</li>
                    <li>Status yang valid: pending_dic, pending_pjo, pending_hr_ho, approved, dll</li>
                    <li>Upload file Excel yang sudah diisi</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#D4AF37]/30 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37]">Edit Pengajuan Cuti</DialogTitle>
            <DialogDescription>Edit data pengajuan cuti karyawan</DialogDescription>
          </DialogHeader>

          {editingRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>NIK</Label>
                  <Input value={editingRequest.userNik} disabled className="bg-[#0a0a0a]" />
                </div>
                <div>
                  <Label>Nama</Label>
                  <Input value={editingRequest.userName} disabled className="bg-[#0a0a0a]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={editingRequest.tanggalMulai}
                    onChange={(e) => setEditingRequest({ ...editingRequest, tanggalMulai: e.target.value })}
                    className="bg-[#0a0a0a]"
                  />
                </div>
                <div>
                  <Label>Tanggal Selesai</Label>
                  <Input
                    type="date"
                    value={editingRequest.tanggalSelesai}
                    onChange={(e) => setEditingRequest({ ...editingRequest, tanggalSelesai: e.target.value })}
                    className="bg-[#0a0a0a]"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={editingRequest.status}
                  onValueChange={(value) => setEditingRequest({ ...editingRequest, status: value as LeaveStatus })}
                >
                  <SelectTrigger className="bg-[#0a0a0a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_dic">Pending DIC</SelectItem>
                    <SelectItem value="pending_pjo">Pending PJO</SelectItem>
                    <SelectItem value="pending_hr_ho">Pending HR HO</SelectItem>
                    <SelectItem value="di_proses">Di Proses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="tiket_issued">Tiket Issued</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Booking Code</Label>
                <Input
                  value={editingRequest.bookingCode || ""}
                  onChange={(e) => setEditingRequest({ ...editingRequest, bookingCode: e.target.value })}
                  className="bg-[#0a0a0a]"
                />
              </div>

              <div>
                <Label>Catatan</Label>
                <Input
                  value={editingRequest.catatan}
                  onChange={(e) => setEditingRequest({ ...editingRequest, catatan: e.target.value })}
                  className="bg-[#0a0a0a]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} className="bg-[#D4AF37] text-black">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#D4AF37]/30 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37]">Upload Excel File</DialogTitle>
            <DialogDescription>Upload file Excel untuk import data pengajuan cuti</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="bg-[#0a0a0a] border-[#D4AF37]/30"
            />

            {uploadPreview.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-lg p-4">
                <h3 className="text-[#D4AF37] font-semibold mb-2">Preview (5 data pertama):</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#D4AF37] text-xs">NIK</TableHead>
                        <TableHead className="text-[#D4AF37] text-xs">Nama</TableHead>
                        <TableHead className="text-[#D4AF37] text-xs">Site</TableHead>
                        <TableHead className="text-[#D4AF37] text-xs">Jenis Cuti</TableHead>
                        <TableHead className="text-[#D4AF37] text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadPreview.map((row: any, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-white text-xs">{row.nik}</TableCell>
                          <TableCell className="text-white text-xs">{row.nama}</TableCell>
                          <TableCell className="text-white text-xs">{row.site}</TableCell>
                          <TableCell className="text-white text-xs">{row.jenisPengajuanCuti}</TableCell>
                          <TableCell className="text-white text-xs">{row.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false)
                setUploadFile(null)
                setUploadPreview([])
              }}
            >
              Batal
            </Button>
            <Button onClick={handleBulkUpload} disabled={!uploadFile} className="bg-[#D4AF37] text-black">
              Upload Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
