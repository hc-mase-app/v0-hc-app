"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  BarChart3,
  Target,
  TrendingUp,
  ChevronRight,
  Calendar,
  Home,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"

interface MonitoringData {
  site: string
  department: string | null
  leader_id: number | null
  leader_name: string | null
  target: number
  realization: number
  percentage: number
}

interface Subordinate {
  id: string
  nrp: string // Changed from nik to nrp to match database schema
  nama_karyawan: string
  departemen: string
  level: string
  has_evidence: boolean
  evidence_count: number
}

type ViewMode = "site" | "department" | "individual"

export default function TmsMonitoringPage() {
  const router = useRouter()
  const { user } = useAuth() // Use useAuth to get user role
  const [isLoading, setIsLoading] = useState(true)

  // Data
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([])
  const [summary, setSummary] = useState({ target: 0, realization: 0, percentage: 0 })

  const [showSubordinatesModal, setShowSubordinatesModal] = useState(false)
  const [selectedLeader, setSelectedLeader] = useState<MonitoringData | null>(null)
  const [subordinates, setSubordinates] = useState<Subordinate[]>([])
  const [loadingSubordinates, setLoadingSubordinates] = useState(false)

  // Delete Confirmation Dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [subordinateToDelete, setSubordinateToDelete] = useState<Subordinate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filters & Navigation
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [viewMode, setViewMode] = useState<ViewMode>("site")
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)

  // Available months
  const [availableMonths, setAvailableMonths] = useState<string[]>([])

  useEffect(() => {
    // Generate available months (last 6 months)
    const months: string[] = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      months.push(monthStr)
    }
    setAvailableMonths(months)

    // Set current month as default
    setSelectedMonth(months[0])
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      loadMonitoringData()
    }
  }, [selectedMonth, viewMode, selectedSite, selectedDepartment])

  const loadMonitoringData = async () => {
    try {
      setIsLoading(true)

      let url = `/api/tms/monitoring?month=${selectedMonth}&view=${viewMode}`
      if (viewMode === "department" && selectedSite) {
        url += `&site=${selectedSite}`
      }
      if (viewMode === "individual" && selectedSite && selectedDepartment) {
        url += `&site=${selectedSite}&department=${selectedDepartment}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const details = (data.details || []).map((item: any) => ({
          ...item,
          percentage: typeof item.percentage === "string" ? Number.parseFloat(item.percentage) : item.percentage,
          target: Number(item.target),
          realization: Number(item.realization),
        }))
        setMonitoringData(details)
        setSummary({
          target: Number(data.summary?.target || 0),
          realization: Number(data.summary?.realization || 0),
          percentage: Number(data.summary?.percentage || 0),
        })
      }
    } catch (error) {
      console.error("[v0] Load monitoring data error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSubordinatesDetail = async (leader: MonitoringData) => {
    if (!leader.leader_id) return

    try {
      setLoadingSubordinates(true)
      setSelectedLeader(leader)
      setShowSubordinatesModal(true)

      const response = await fetch(
        `/api/tms/monitoring/subordinates?leaderId=${leader.leader_id}&month=${selectedMonth}`,
      )

      if (response.ok) {
        const data = await response.json()
        setSubordinates(data.subordinates || [])
      }
    } catch (error) {
      console.error("[v0] Load subordinates error:", error)
    } finally {
      setLoadingSubordinates(false)
    }
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return "text-green-500"
    if (percentage >= 70) return "text-yellow-500"
    return "text-red-500"
  }

  const getStatusBg = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500/10 border-green-500/30"
    if (percentage >= 70) return "bg-yellow-500/10 border-yellow-500/30"
    return "bg-red-500/10 border-red-500/30"
  }

  const getStatusLabel = (percentage: number) => {
    if (percentage >= 100) return "Tercapai"
    if (percentage >= 70) return "Perlu Perhatian"
    return "Kritis"
  }

  const handleDrillDown = (item: MonitoringData) => {
    if (viewMode === "site" && item.site) {
      setSelectedSite(item.site)
      setViewMode("department")
    } else if (viewMode === "department" && item.department) {
      setSelectedDepartment(item.department)
      setViewMode("individual")
    }
  }

  const handleBackNavigation = () => {
    if (viewMode === "individual") {
      // From individual view, go back to department view
      setViewMode("department")
      setSelectedDepartment(null)
    } else if (viewMode === "department") {
      // From department view, go back to site view
      setViewMode("site")
      setSelectedSite(null)
    } else {
      // From site view, go back to TMS main menu
      router.push("/tms")
    }
  }

  const handleBreadcrumbClick = (level: ViewMode) => {
    if (level === "site") {
      setViewMode("site")
      setSelectedSite(null)
      setSelectedDepartment(null)
    } else if (level === "department") {
      setViewMode("department")
      setSelectedDepartment(null)
    }
  }

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    return `${months[Number.parseInt(month) - 1]} ${year}`
  }

  const handleDeleteSubordinate = async () => {
    if (!subordinateToDelete || !selectedLeader) return

    try {
      setIsDeleting(true)
      const response = await fetch("/api/tms/monitoring/subordinates", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subordinateId: subordinateToDelete.id,
          leaderId: selectedLeader.leader_id,
          userRole: user?.role,
        }),
      })

      if (response.ok) {
        // Remove from local state
        setSubordinates((prev) => prev.filter((sub) => sub.id !== subordinateToDelete.id))
        // Reload monitoring data to update counts
        await loadMonitoringData()
        setShowDeleteConfirm(false)
        setSubordinateToDelete(null)
      } else {
        const data = await response.json()
        alert(data.error || "Gagal menghapus bawahan")
      }
    } catch (error) {
      console.error("[v0] Delete subordinate error:", error)
      alert("Terjadi kesalahan saat menghapus bawahan")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4AF37] text-lg">Memuat data monitoring...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#D4AF37]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleBackNavigation}
                className="text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">Dashboard Monitoring Target</h1>
                <p className="text-xs sm:text-sm text-gray-400">Monitoring pencapaian target leadership bulanan</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.push("/tms")}
                className="flex items-center gap-2 text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors px-3 py-2 hover:bg-[#D4AF37]/10 rounded-lg"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline text-sm font-medium">Menu Utama</span>
              </button>
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Month Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] hidden sm:block" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[200px] bg-[#1a1a1a] border-[#D4AF37]/30 text-white text-sm">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {formatMonthYear(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto">
            <button
              onClick={() => handleBreadcrumbClick("site")}
              className={`${viewMode === "site" ? "text-[#D4AF37] font-semibold" : "text-gray-400 hover:text-white"} whitespace-nowrap`}
            >
              Site
            </button>
            {viewMode !== "site" && (
              <>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick("department")}
                  className={`${viewMode === "department" ? "text-[#D4AF37] font-semibold" : "text-gray-400 hover:text-white"} whitespace-nowrap`}
                >
                  {selectedSite}
                </button>
              </>
            )}
            {viewMode === "individual" && (
              <>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                <span className="text-[#D4AF37] font-semibold whitespace-nowrap">{selectedDepartment}</span>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-[#1a1a1a] border-[#D4AF37]/30">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-2">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                Total Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-white">{summary.target}</div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Bawahan langsung</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#D4AF37]/30">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                Total Realisasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-white">{summary.realization}</div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Dengan minimal 1 evidence</p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${getStatusBg(summary.percentage)} sm:col-span-2 lg:col-span-1`}>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-2">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                Persentase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl sm:text-3xl font-bold ${getStatusColor(summary.percentage)}`}>
                {summary.percentage.toFixed(1)}%
              </div>
              <p className={`text-[10px] sm:text-xs mt-1 font-semibold ${getStatusColor(summary.percentage)}`}>
                {getStatusLabel(summary.percentage)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monitoring Table */}
        <Card className="bg-[#1a1a1a] border-[#D4AF37]/30">
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg">
              {viewMode === "site" && "Monitoring Per Site"}
              {viewMode === "department" && `Monitoring Departemen - ${selectedSite}`}
              {viewMode === "individual" && `Monitoring Individual - ${selectedDepartment}`}
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs sm:text-sm">
              {viewMode === "individual"
                ? "Klik pada target untuk melihat detail bawahan langsung"
                : "Klik pada baris untuk melihat detail lebih lanjut"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#D4AF37]">
                      {viewMode === "site" && "Site"}
                      {viewMode === "department" && "Departemen"}
                      {viewMode === "individual" && "Leader"}
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#D4AF37]">Target</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#D4AF37]">Realisasi</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#D4AF37]">Persentase</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#D4AF37]">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#D4AF37]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoringData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-[#D4AF37]/5">
                      <td className="py-3 px-4 text-sm text-white font-medium">
                        {viewMode === "site" && item.site}
                        {viewMode === "department" && item.department}
                        {viewMode === "individual" && item.leader_name}
                      </td>
                      <td className="py-3 px-4 text-center text-white">
                        {viewMode === "individual" ? (
                          <button
                            onClick={() => loadSubordinatesDetail(item)}
                            className="text-[#D4AF37] hover:text-[#D4AF37]/80 font-semibold underline decoration-dotted"
                          >
                            {item.target}
                          </button>
                        ) : (
                          item.target
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-white">{item.realization}</td>
                      <td className={`py-3 px-4 text-center font-bold ${getStatusColor(item.percentage)}`}>
                        {item.percentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusBg(item.percentage)} ${getStatusColor(item.percentage)}`}
                        >
                          {getStatusLabel(item.percentage)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {viewMode === "individual" ? (
                          <Button
                            size="sm"
                            onClick={() => loadSubordinatesDetail(item)}
                            className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 h-8 px-3"
                          >
                            <Users className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleDrillDown(item)}
                            className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 h-8 px-3"
                          >
                            Detail
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {monitoringData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        Tidak ada data untuk periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {monitoringData.length === 0 ? (
                <div className="py-8 text-center text-gray-500">Tidak ada data untuk periode ini</div>
              ) : (
                monitoringData.map((item, index) => (
                  <div key={index} className="p-4 bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white text-sm">
                          {viewMode === "site" && item.site}
                          {viewMode === "department" && item.department}
                          {viewMode === "individual" && item.leader_name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusBg(item.percentage)} ${getStatusColor(item.percentage)}`}
                        >
                          {getStatusLabel(item.percentage)}
                        </span>
                      </div>
                      {viewMode === "individual" ? (
                        <Button
                          size="sm"
                          onClick={() => loadSubordinatesDetail(item)}
                          className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 h-8 px-3"
                        >
                          <Users className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleDrillDown(item)}
                          className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 h-8 px-3"
                        >
                          Detail
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Target</span>
                        <p className="text-white font-semibold text-base">{item.target}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Realisasi</span>
                        <p className="text-white font-semibold text-base">{item.realization}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Persentase</span>
                        <p className={`font-bold text-base ${getStatusColor(item.percentage)}`}>
                          {item.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSubordinatesModal} onOpenChange={setShowSubordinatesModal}>
        <DialogContent className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
              <Users className="w-6 h-6" />
              Detail Bawahan Langsung
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedLeader?.leader_name} - Target: {selectedLeader?.target} | Realisasi:{" "}
              {selectedLeader?.realization}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {loadingSubordinates ? (
              <div className="text-center py-8 text-gray-400">Memuat data bawahan...</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {subordinates.map((sub, index) => (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-lg border ${
                      sub.has_evidence ? "bg-green-500/5 border-green-500/30" : "bg-red-500/5 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
                          <div>
                            <h4 className="font-semibold text-white">{sub.nama_karyawan}</h4>
                            <p className="text-sm text-gray-400">NRP: {sub.nrp}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                            {sub.level}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            {sub.departemen}
                          </span>
                          {sub.has_evidence && (
                            <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/30">
                              {sub.evidence_count} Evidence
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.has_evidence ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                        {user?.role === "super_admin" && (
                          <button
                            onClick={() => {
                              setSubordinateToDelete(sub)
                              setShowDeleteConfirm(true)
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                            title="Hapus Bawahan"
                          >
                            <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {subordinates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Tidak ada data bawahan</div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setShowSubordinatesModal(false)}
              className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-[#1a1a1a] border-red-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-500 flex items-center gap-2">
              <Trash2 className="w-6 h-6" />
              Konfirmasi Hapus Bawahan
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Apakah Anda yakin ingin menghapus bawahan ini dari hierarki?
            </DialogDescription>
          </DialogHeader>

          {subordinateToDelete && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="font-semibold text-white">{subordinateToDelete.nama_karyawan}</p>
              <p className="text-sm text-gray-400">NRP: {subordinateToDelete.nrp}</p>
              <p className="text-sm text-gray-400">Departemen: {subordinateToDelete.departemen}</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-400">
              <strong>Perhatian:</strong> Aksi ini akan menghapus hubungan hierarki antara leader dan bawahan. Bawahan
              akan tetap ada di sistem namun tidak lagi memiliki manager.
            </p>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <Button
              onClick={() => {
                setShowDeleteConfirm(false)
                setSubordinateToDelete(null)
              }}
              variant="outline"
              disabled={isDeleting}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteSubordinate}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
