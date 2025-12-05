"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Search, Calendar, Ticket, Download, Edit, Plus } from "lucide-react"
import type { LeaveRequest } from "@/lib/types"
import { formatDate, getStatusColor, getDetailedTicketStatus } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LeaveRequestDetailDialog } from "@/components/leave-request-detail-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { exportToExcel } from "@/lib/excel-export"
import { Checkbox } from "@/components/ui/checkbox"
import { ExcelColumnSelectorDialog } from "@/components/excel-column-selector-dialog"
import { exportToExcelCustom } from "@/lib/excel-export-custom"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NewLeaveRequestDialog } from "@/components/new-leave-request-dialog"

export default function HRTicketingDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [pendingRequests, setpendingRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingRequest, setBookingRequest] = useState<LeaveRequest | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [isEditMode, setIsEditMode] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [tiketBerangkatChecked, setTiketBerangkatChecked] = useState(false)
  const [tiketPulangChecked, setTiketPulangChecked] = useState(false)
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false)
  const [isExportingCustom, setIsExportingCustom] = useState(false)
  const [selectedDepartemen, setSelectedDepartemen] = useState<string>("all")
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)
  const bookingCodeRef = useRef<HTMLInputElement>(null)
  const namaPesawatRef = useRef<HTMLInputElement>(null)
  const jamKeberangkatanRef = useRef<HTMLInputElement>(null)
  const bookingCodeBalikRef = useRef<HTMLInputElement>(null)
  const namaPesawatBalikRef = useRef<HTMLInputElement>(null)
  const jamKeberangkatanBalikRef = useRef<HTMLInputElement>(null)
  const tanggalBerangkatBalikRef = useRef<HTMLInputElement>(null)
  const berangkatDariBalikRef = useRef<HTMLInputElement>(null)
  const tujuanBalikRef = useRef<HTMLInputElement>(null)

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

  const loadData = async () => {
    try {
      // If user's site is "HO" or "ALL", they can see all sites
      // Otherwise, they only see requests from their site
      const userSiteParam = encodeURIComponent(user?.site || "all")

      const pendingRes = await fetch(`/api/workflow?action=pending&role=hr_ticketing&site=${userSiteParam}`)
      const pending = await pendingRes.json()
      const pendingData = Array.isArray(pending) ? pending : pending?.data || []
      setpendingRequests(pendingData)

      const allRes = await fetch(`/api/workflow?action=all&role=hr_ticketing&site=${userSiteParam}`)
      const all = await allRes.json()
      const allData = Array.isArray(all) ? all : all?.data || []
      setAllRequests(allData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data pengajuan",
        variant: "destructive",
      })
    }
  }

  const uniqueDepartments = useMemo(() => {
    const allData = [...pendingRequests, ...allRequests]
    const departments = new Set<string>()
    allData.forEach((request) => {
      if (request.departemen) {
        departments.add(request.departemen)
      }
    })
    return Array.from(departments).sort()
  }, [pendingRequests, allRequests])

  const uniqueSites = useMemo(() => {
    const allData = [...pendingRequests, ...allRequests]
    const sites = new Set<string>()
    allData.forEach((request) => {
      if (request.site) {
        sites.add(request.site)
      }
    })
    return Array.from(sites).sort()
  }, [pendingRequests, allRequests])

  const perluDiprosesRequests = useMemo(() => {
    // Pengajuan yang belum diproses tiket berangkat atau belum lengkap tiket balik
    return pendingRequests.filter((req) => {
      // Exclude cuti lokal
      if (req.jenisPengajuanCuti === "Cuti Lokal Tanpa Tiket") return false

      // Include jika belum ada tiket berangkat atau belum ada tiket balik
      return req.statusTiketBerangkat !== "issued" || req.statusTiketBalik !== "issued"
    })
  }, [pendingRequests])

  const riwayatRequests = useMemo(() => {
    // Pengajuan yang sudah ada tiket (minimal tiket berangkat issued)
    return allRequests.filter((req) => {
      // Exclude cuti lokal
      if (req.jenisPengajuanCuti === "Cuti Lokal Tanpa Tiket") return false

      // Include yang sudah ada tiket berangkat atau sudah lengkap
      return req.statusTiketBerangkat === "issued" || req.status === "tiket_issued"
    })
  }, [allRequests])

  const filteredRequests = useMemo(() => {
    const source = activeTab === "pending" ? perluDiprosesRequests : riwayatRequests
    let filtered = source

    // Filter by department
    if (selectedDepartemen && selectedDepartemen !== "all") {
      filtered = filtered.filter((request) => request.departemen === selectedDepartemen)
    }

    // Filter by site
    if (selectedSite && selectedSite !== "all") {
      filtered = filtered.filter((request) => request.site === selectedSite)
    }

    if (selectedStatus && selectedStatus !== "all") {
      if (selectedStatus === "perlu_proses") {
        // Belum ada tiket sama sekali
        filtered = filtered.filter((request) => !request.bookingCode && !request.bookingCodeBalik)
      } else if (selectedStatus === "tiket_berangkat") {
        // Ada tiket berangkat tapi belum lengkap
        filtered = filtered.filter(
          (request) =>
            request.statusTiketBerangkat === "issued" && request.bookingCode && request.statusTiketBalik !== "issued",
        )
      } else if (selectedStatus === "tiket_lengkap") {
        // Tiket berangkat dan balik lengkap
        filtered = filtered.filter(
          (request) =>
            request.statusTiketBerangkat === "issued" &&
            request.statusTiketBalik === "issued" &&
            request.bookingCode &&
            request.bookingCodeBalik,
        )
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((request) => {
        return (
          (request.userNik?.toLowerCase() || "").includes(query) ||
          (request.userName?.toLowerCase() || "").includes(query) ||
          (request.jabatan?.toLowerCase() || "").includes(query) ||
          (request.departemen?.toLowerCase() || "").includes(query) ||
          (request.jenisPengajuanCuti?.toLowerCase() || "").includes(query)
        )
      })
    }

    return filtered
  }, [searchQuery, perluDiprosesRequests, riwayatRequests, activeTab, selectedDepartemen, selectedSite, selectedStatus])

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredRequests.slice(startIndex, endIndex)
  }, [filteredRequests, currentPage])

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDepartemen, selectedSite, selectedStatus, searchQuery, activeTab])

  const handleProcessTicket = async () => {
    if (!bookingRequest) return

    if (!tiketBerangkatChecked && !tiketPulangChecked) {
      toast({
        title: "Error",
        description: "Pilih minimal satu tiket (berangkat atau balik)",
        variant: "destructive",
      })
      return
    }

    const bookingCode = bookingCodeRef.current?.value.trim() || undefined
    const namaPesawat = namaPesawatRef.current?.value.trim() || null
    const jamKeberangkatan = jamKeberangkatanRef.current?.value || null
    const bookingCodeBalik = bookingCodeBalikRef.current?.value.trim() || undefined
    const namaPesawatBalik = namaPesawatBalikRef.current?.value.trim() || null
    const jamKeberangkatanBalik = jamKeberangkatanBalikRef.current?.value || null
    const tanggalBerangkatBalik = tanggalBerangkatBalikRef.current?.value || null
    const berangkatDariBalik = berangkatDariBalikRef.current?.value.trim() || null
    const tujuanBalik = tujuanBalikRef.current?.value.trim() || null

    setIsProcessing(true)
    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-booking",
          requestId: bookingRequest.id,
          tiketBerangkat: tiketBerangkatChecked,
          tiketBalik: tiketPulangChecked, // Memastikan tiketBalik dikirim dengan benar
          bookingCode,
          namaPesawat,
          jamKeberangkatan,
          bookingCodeBalik,
          namaPesawatBalik,
          jamKeberangkatanBalik,
          tanggalBerangkatBalik,
          berangkatDariBalik,
          tujuanBalik,
          updatedBy: user?.nik,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Gagal memproses tiket")
      }

      toast({
        title: "Berhasil",
        description: isEditMode
          ? "Informasi tiket berhasil diperbarui"
          : "Tiket berhasil diproses dan informasi telah ditambahkan",
      })

      setBookingDialogOpen(false)
      resetBookingForm()
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memproses tiket",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetBookingForm = () => {
    setBookingRequest(null)
    setIsEditMode(false)
    setTiketBerangkatChecked(false)
    setTiketPulangChecked(false)
  }

  const handleEditTicket = (request: LeaveRequest) => {
    setBookingRequest(request)
    setTiketBerangkatChecked(request.statusTiketBerangkat === "issued")
    setTiketPulangChecked(request.statusTiketBalik === "issued")
    setIsEditMode(true)
    setBookingDialogOpen(true)
  }

  const handleExportToExcel = () => {
    try {
      let dataToExport = allRequests

      if (selectedDepartemen && selectedDepartemen !== "all") {
        dataToExport = dataToExport.filter((request) => request.departemen === selectedDepartemen)
      }

      if (selectedSite && selectedSite !== "all") {
        dataToExport = dataToExport.filter((request) => request.site === selectedSite)
      }

      if (startDate || endDate) {
        dataToExport = dataToExport.filter((request) => {
          if (!request.updatedAt) return false

          const issuedDate = new Date(request.updatedAt)
          issuedDate.setHours(0, 0, 0, 0)

          if (startDate && endDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            const included = issuedDate >= start && issuedDate <= end
            return included
          } else if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            return issuedDate >= start
          } else if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            return issuedDate <= end
          }
          return true
        })
      }

      if (dataToExport.length === 0) {
        const filterParts = []
        if (selectedDepartemen !== "all") filterParts.push(`Departemen: ${selectedDepartemen}`)
        if (selectedSite !== "all") filterParts.push(`Site: ${selectedSite}`)
        if (startDate && endDate) {
          filterParts.push(
            `Tanggal: ${new Date(startDate).toLocaleDateString("id-ID")} - ${new Date(endDate).toLocaleDateString("id-ID")}`,
          )
        } else if (startDate) {
          filterParts.push(`Dari: ${new Date(startDate).toLocaleDateString("id-ID")}`)
        } else if (endDate) {
          filterParts.push(`Sampai: ${new Date(endDate).toLocaleDateString("id-ID")}`)
        }

        toast({
          title: "Tidak Ada Data",
          description:
            filterParts.length > 0
              ? `Tidak ada data dengan filter: ${filterParts.join(", ")}. Coba ubah filter yang berbeda.`
              : "Tidak ada data untuk di-export",
          variant: "destructive",
        })
        return
      }

      const employeeDataMap = new Map<string, { namaPesawat?: string; lamaOnsite?: number }>()

      const sortedRequests = [...allRequests].sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime()
        const dateB = new Date(b.updatedAt || 0).getTime()
        return dateB - dateA
      })

      for (const request of sortedRequests) {
        if (!request.userNik) continue
        if (!employeeDataMap.has(request.userNik)) {
          if (request.namaPesawat || request.lamaOnsite) {
            employeeDataMap.set(request.userNik, {
              namaPesawat: request.namaPesawat,
              lamaOnsite: request.lamaOnsite,
            })
          }
        }
      }

      const enrichedDataToExport = dataToExport.map((request) => {
        const employeeData = request.userNik ? employeeDataMap.get(request.userNik) : null
        return {
          ...request,
          namaPesawat: request.namaPesawat || employeeData?.namaPesawat,
          lamaOnsite: request.lamaOnsite || employeeData?.lamaOnsite,
        }
      })

      const filterParts = []
      if (selectedDepartemen !== "all") filterParts.push(selectedDepartemen.replace(/\s+/g, "_"))
      if (selectedSite !== "all") filterParts.push(selectedSite.replace(/\s+/g, "_"))

      const dateRangeText =
        startDate && endDate
          ? `${startDate}_sampai_${endDate}`
          : startDate
            ? `dari_${startDate}`
            : endDate
              ? `sampai_${endDate}`
              : new Date().toISOString().split("T")[0]

      const filterSuffix = filterParts.length > 0 ? `_${filterParts.join("_")}` : ""
      const fileName = `Riwayat_Pengajuan_Cuti_${activeTab}${filterSuffix}_${dateRangeText}`

      exportToExcel(enrichedDataToExport, fileName)
        .then(() => {
          toast({
            title: "Berhasil",
            description: `${enrichedDataToExport.length} data berhasil di-export ke Excel`,
          })
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Gagal export Excel",
            variant: "destructive",
          })
        })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal export Excel",
        variant: "destructive",
      })
    }
  }

  const handleExportCustomColumns = async (selectedColumns: string[]) => {
    setIsExportingCustom(true)
    try {
      let dataToExport = allRequests

      if (selectedDepartemen && selectedDepartemen !== "all") {
        dataToExport = dataToExport.filter((request) => request.departemen === selectedDepartemen)
      }

      if (selectedSite && selectedSite !== "all") {
        dataToExport = dataToExport.filter((request) => request.site === selectedSite)
      }

      if (startDate || endDate) {
        dataToExport = dataToExport.filter((request) => {
          if (!request.updatedAt) return false

          const issuedDate = new Date(request.updatedAt)
          issuedDate.setHours(0, 0, 0, 0)

          if (startDate && endDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            return issuedDate >= start && issuedDate <= end
          } else if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            return issuedDate >= start
          } else if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            return issuedDate <= end
          }
          return true
        })
      }

      if (dataToExport.length === 0) {
        const filterParts = []
        if (selectedDepartemen !== "all") filterParts.push(`Departemen: ${selectedDepartemen}`)
        if (selectedSite !== "all") filterParts.push(`Site: ${selectedSite}`)
        if (startDate || endDate) filterParts.push("Tanggal yang dipilih")

        toast({
          title: "Tidak Ada Data",
          description:
            filterParts.length > 0
              ? `Tidak ada data dengan filter: ${filterParts.join(", ")}`
              : "Tidak ada data untuk di-export dengan filter yang dipilih",
          variant: "destructive",
        })
        setIsExportingCustom(false)
        setColumnSelectorOpen(false)
        return
      }

      const filterParts = []
      if (selectedDepartemen !== "all") filterParts.push(selectedDepartemen.replace(/\s+/g, "_"))
      if (selectedSite !== "all") filterParts.push(selectedSite.replace(/\s+/g, "_"))

      const dateRangeText =
        startDate && endDate
          ? `${startDate}_sampai_${endDate}`
          : startDate
            ? `dari_${startDate}`
            : endDate
              ? `sampai_${endDate}`
              : new Date().toISOString().split("T")[0]

      const filterSuffix = filterParts.length > 0 ? `_${filterParts.join("_")}` : ""
      const fileName = `Pengajuan_Cuti_Custom${filterSuffix}_${dateRangeText}`

      await exportToExcelCustom(dataToExport, fileName, selectedColumns)

      toast({
        title: "Berhasil",
        description: `${dataToExport.length} data berhasil di-export dengan ${selectedColumns.length} kolom`,
      })

      setColumnSelectorOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal export Excel",
        variant: "destructive",
      })
    } finally {
      setIsExportingCustom(false)
    }
  }

  const getTicketStatusBadge = (request: LeaveRequest) => {
    const statusText = getDetailedTicketStatus(request.status, request.statusTiketBerangkat, request.statusTiketBalik)

    if (statusText.includes("Terbit") || statusText.includes("Lengkap")) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">{statusText}</Badge>
    }

    return <Badge className={getStatusColor(request.status)}>{statusText}</Badge>
  }

  if (!user) return null

  const isHRTicketingHO = user.site?.toUpperCase() === "HO" || user.site?.toUpperCase() === "ALL"

  return (
    <DashboardLayout title="Dashboard HR Ticketing">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard HR Ticketing</h1>
            <p className="text-sm text-muted-foreground">
              {isHRTicketingHO
                ? "Kelola pengajuan cuti dari semua site dan semua departemen"
                : `Kelola pengajuan cuti untuk site ${user.site} - semua departemen`}
            </p>
          </div>
          <Button onClick={() => setShowNewRequestDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajukan Izin Baru
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Proses Tiket & Input Booking</h2>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <CardTitle>Pengajuan Cuti</CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="space-y-1">
                  <Label htmlFor="startDate" className="text-xs">
                    Dari Tanggal
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate" className="text-xs">
                    Sampai Tanggal
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-40"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full xs:w-auto min-w-[140px]">
                  <Label htmlFor="filterDepartemen" className="text-xs mb-1 block text-slate-600">
                    Departemen
                  </Label>
                  <Select value={selectedDepartemen} onValueChange={setSelectedDepartemen}>
                    <SelectTrigger id="filterDepartemen" className="h-8 text-sm w-full">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {uniqueDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full xs:w-auto min-w-[140px]">
                  <Label htmlFor="filterSite" className="text-xs mb-1 block text-slate-600">
                    Site
                  </Label>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger id="filterSite" className="h-8 text-sm w-full">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {uniqueSites.map((site) => (
                        <SelectItem key={site} value={site}>
                          {site}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full xs:w-auto min-w-[160px]">
                  <Label htmlFor="filterStatus" className="text-xs mb-1 block text-slate-600">
                    Status Tiket
                  </Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger id="filterStatus" className="h-8 text-sm w-full">
                      <SelectValue placeholder="Semua Pengajuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pengajuan</SelectItem>
                      <SelectItem value="perlu_proses">Perlu di Proses</SelectItem>
                      <SelectItem value="tiket_berangkat">Tiket Berangkat Terbit</SelectItem>
                      <SelectItem value="tiket_lengkap">Tiket Lengkap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(selectedDepartemen !== "all" || selectedSite !== "all" || selectedStatus !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDepartemen("all")
                      setSelectedSite("all")
                      setSelectedStatus("all")
                    }}
                    className="text-slate-500 hover:text-slate-700 h-8 text-xs"
                  >
                    Reset
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent h-8 w-full sm:w-auto">
                      <Download className="h-3.5 w-3.5" />
                      Export Excel
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setColumnSelectorOpen(true)} className="cursor-pointer">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel Custom (Pilih Kolom)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportToExcel} className="cursor-pointer">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel Finance
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {(startDate || endDate || selectedDepartemen !== "all" || selectedSite !== "all") && (
                  <p className="text-[10px] text-slate-500 text-right">
                    {[
                      selectedDepartemen !== "all" ? `Dept: ${selectedDepartemen}` : null,
                      selectedSite !== "all" ? `Site: ${selectedSite}` : null,
                      startDate && endDate
                        ? `${new Date(startDate).toLocaleDateString("id-ID")} - ${new Date(endDate).toLocaleDateString("id-ID")}`
                        : startDate
                          ? `Dari ${new Date(startDate).toLocaleDateString("id-ID")}`
                          : endDate
                            ? `Sampai ${new Date(endDate).toLocaleDateString("id-ID")}`
                            : null,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </p>
                )}
              </div>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari berdasarkan NIK, nama, jabatan, atau departemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Perlu Diproses ({perluDiprosesRequests.length})</TabsTrigger>
                <TabsTrigger value="history">Riwayat ({riwayatRequests.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchQuery
                        ? "Tidak ada pengajuan yang sesuai dengan pencarian"
                        : "Tidak ada tiket yang perlu diproses"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedRequests.map(
                      (
                        request, // Changed from filteredRequests to paginatedRequests
                      ) => (
                        <div
                          key={request.id}
                          className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col gap-4 mb-4">
                            <div className="space-y-3 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-slate-900">{request.jenisPengajuanCuti}</h3>
                                {getTicketStatusBadge(request)}
                              </div>

                              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-slate-500">NIK</p>
                                  <p className="font-medium text-slate-900">{request.userNik || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Nama</p>
                                  <p className="font-medium text-slate-900 truncate">
                                    {request.userName || "Nama tidak tersedia"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Jabatan</p>
                                  <p className="font-medium text-slate-900">{request.jabatan || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Departemen</p>
                                  <p className="font-medium text-slate-900">{request.departemen || "-"}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Calendar className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Tgl Keberangkatan</p>
                                    <p className="font-medium text-slate-900">
                                      {request.tanggalKeberangkatan ? formatDate(request.tanggalKeberangkatan) : "-"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              className="flex-1"
                            >
                              Lihat Detail
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setBookingRequest(request)
                                setTiketBerangkatChecked(request.statusTiketBerangkat === "issued")
                                setTiketPulangChecked(request.statusTiketBalik === "issued")
                                setIsEditMode(false)
                                setBookingDialogOpen(true)
                              }}
                              className="flex-1"
                            >
                              <Ticket className="h-4 w-4 mr-2" />
                              Proses Tiket
                            </Button>
                          </div>
                        </div>
                      ),
                    )}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                          {Math.min(currentPage * itemsPerPage, filteredRequests.length)} dari {filteredRequests.length}{" "}
                          pengajuan
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            Sebelumnya
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Berikutnya
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">
                      {searchQuery ? "Tidak ada riwayat yang sesuai dengan pencarian" : "Belum ada riwayat pengajuan"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedRequests.map((request) => {
                      // Changed from filteredRequests to paginatedRequests
                      const detailedStatus = getDetailedTicketStatus(request)
                      const statusColor = getStatusColor(detailedStatus.status)
                      return (
                        <div
                          key={request.id}
                          className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col gap-4 mb-4">
                            <div className="space-y-3 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-slate-900">{request.jenisPengajuanCuti}</h3>
                                {getTicketStatusBadge(request)}
                                {request.status === "tiket_issued" && (request.namaPesawat || request.lamaOnsite) && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                    Data Lengkap
                                  </Badge>
                                )}
                                {request.status === "tiket_issued" && (!request.namaPesawat || !request.lamaOnsite) && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                    Data Belum Lengkap
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-slate-500">NIK</p>
                                  <p className="font-medium text-slate-900">{request.userNik || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Nama</p>
                                  <p className="font-medium text-slate-900 truncate">
                                    {request.userName || "Nama tidak tersedia"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Jabatan</p>
                                  <p className="font-medium text-slate-900">{request.jabatan || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Departemen</p>
                                  <p className="font-medium text-slate-900">{request.departemen || "-"}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Calendar className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Tgl Keberangkatan</p>
                                    <p className="font-medium text-slate-900">
                                      {request.tanggalKeberangkatan ? formatDate(request.tanggalKeberangkatan) : "-"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              className="flex-1"
                            >
                              Lihat Detail
                            </Button>
                            {request.status === "tiket_issued" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTicket(request)}
                                className="flex-1"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Tiket
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                          {Math.min(currentPage * itemsPerPage, filteredRequests.length)} dari {filteredRequests.length}{" "}
                          pengajuan
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            Sebelumnya
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Berikutnya
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Informasi Tiket" : "Input Informasi Tiket"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Perbarui" : "Masukkan"} informasi tiket untuk pengajuan cuti {bookingRequest?.userName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {bookingRequest && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">NIK:</span>
                  <span className="font-medium">{bookingRequest.userNik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nama:</span>
                  <span className="font-medium">{bookingRequest.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Jenis Cuti:</span>
                  <span className="font-medium">{bookingRequest.jenisPengajuanCuti}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tanggal Keberangkatan:</span>
                  <span className="font-medium">
                    {bookingRequest.tanggalKeberangkatan ? formatDate(bookingRequest.tanggalKeberangkatan) : "-"}
                  </span>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tiketBerangkat"
                  checked={tiketBerangkatChecked}
                  onCheckedChange={(checked) => setTiketBerangkatChecked(!!checked)}
                />
                <Label htmlFor="tiketBerangkat" className="text-base font-semibold cursor-pointer">
                  Tiket Berangkat
                </Label>
                {tiketBerangkatChecked && (
                  <Badge className="bg-green-100 text-green-800 border-green-300">Sudah Issued</Badge>
                )}
              </div>

              {tiketBerangkatChecked && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                  <div className="space-y-2">
                    <Label htmlFor="bookingCode">Kode Booking Berangkat *</Label>
                    <Input
                      id="bookingCode"
                      ref={bookingCodeRef}
                      placeholder="Masukkan kode booking"
                      defaultValue={bookingRequest?.bookingCode || ""}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="namaPesawat">Nama Pesawat</Label>
                    <Input
                      id="namaPesawat"
                      ref={namaPesawatRef}
                      placeholder="Contoh: Garuda Indonesia, Lion Air"
                      defaultValue={bookingRequest?.namaPesawat || ""}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jamKeberangkatan">Jam Keberangkatan</Label>
                    <Input
                      id="jamKeberangkatan"
                      ref={jamKeberangkatanRef}
                      type="time"
                      defaultValue={bookingRequest?.jamKeberangkatan || ""}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tiketPulang"
                  checked={tiketPulangChecked}
                  onCheckedChange={(checked) => setTiketPulangChecked(!!checked)}
                />
                <Label htmlFor="tiketPulang" className="text-base font-semibold cursor-pointer">
                  Tiket Balik
                </Label>
                {tiketPulangChecked && (
                  <Badge className="bg-green-100 text-green-800 border-green-300">Sudah Issued</Badge>
                )}
              </div>

              {tiketPulangChecked && (
                <div className="space-y-3 pl-6 border-l-2 border-green-200">
                  <div className="space-y-2">
                    <Label htmlFor="bookingCodeBalik">Kode Booking Balik *</Label>
                    <Input
                      id="bookingCodeBalik"
                      ref={bookingCodeBalikRef}
                      placeholder="Masukkan kode booking balik"
                      defaultValue={bookingRequest?.bookingCodeBalik || ""}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="namaPesawatBalik">Nama Pesawat</Label>
                    <Input
                      id="namaPesawatBalik"
                      ref={namaPesawatBalikRef}
                      placeholder="Contoh: Garuda Indonesia, Lion Air"
                      defaultValue={bookingRequest?.namaPesawatBalik || ""}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jamKeberangkatanBalik">Jam Keberangkatan Balik</Label>
                    <Input
                      id="jamKeberangkatanBalik"
                      ref={jamKeberangkatanBalikRef}
                      type="time"
                      defaultValue={bookingRequest?.jamKeberangkatanBalik || ""}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tanggalBerangkatBalik">Tanggal Keberangkatan Balik</Label>
                    <Input
                      id="tanggalBerangkatBalik"
                      ref={tanggalBerangkatBalikRef}
                      type="date"
                      defaultValue={bookingRequest?.tanggalBerangkatBalik || ""}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                    <p className="text-xs font-semibold text-amber-900">Rute Penerbangan Balik</p>

                    <div className="space-y-2">
                      <Label htmlFor="berangkatDariBalik">Berangkat Dari (Balik)</Label>
                      <Input
                        id="berangkatDariBalik"
                        ref={berangkatDariBalikRef}
                        placeholder="Contoh: Surabaya, Jakarta"
                        defaultValue={bookingRequest?.berangkatDariBalik || bookingRequest?.tujuan || ""}
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-amber-700">
                        Kota keberangkatan balik (bisa berbeda dari kota tujuan awal)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tujuanBalik">Tujuan (Balik)</Label>
                      <Input
                        id="tujuanBalik"
                        ref={tujuanBalikRef}
                        placeholder="Contoh: Ternate, Jakarta"
                        defaultValue={bookingRequest?.tujuanBalik || bookingRequest?.berangkatDari || ""}
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-amber-700">Kota tujuan balik (biasanya kembali ke kota asal kerja)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Catatan:</strong> Anda bisa issue tiket berangkat dan balik secara terpisah. Centang tiket mana
                yang akan di-issue, lalu lengkapi informasinya. Rute balik bisa berbeda dari rute berangkat (misalnya:
                Berangkat Ternate→Jakarta, Balik Surabaya→Ternate).
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBookingDialogOpen(false)
                  resetBookingForm()
                }}
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button
                onClick={handleProcessTicket}
                disabled={isProcessing || (!tiketBerangkatChecked && !tiketPulangChecked)}
              >
                {isProcessing ? "Memproses..." : isEditMode ? "Perbarui Informasi Tiket" : "Simpan Informasi Tiket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedRequest && (
        <LeaveRequestDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      <ExcelColumnSelectorDialog
        open={columnSelectorOpen}
        onClose={() => setColumnSelectorOpen(false)}
        onExport={handleExportCustomColumns}
        isExporting={isExportingCustom}
      />
      <NewLeaveRequestDialog
        open={showNewRequestDialog}
        onOpenChange={setShowNewRequestDialog}
        onSuccess={() => {
          setShowNewRequestDialog(false)
          loadData()
        }}
      />
    </DashboardLayout>
  )
}
