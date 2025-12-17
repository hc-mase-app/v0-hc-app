"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, BarChart3, Target, TrendingUp, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MonitoringData {
  site: string
  department: string | null
  leader_id: number | null
  leader_name: string | null
  target: number
  realization: number
  percentage: number
}

type ViewMode = "site" | "department" | "individual"

export default function TmsMonitoringPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Data
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([])
  const [summary, setSummary] = useState({ target: 0, realization: 0, percentage: 0 })

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
        setMonitoringData(data.details || [])
        setSummary(data.summary || { target: 0, realization: 0, percentage: 0 })
      }
    } catch (error) {
      console.error("[v0] Load monitoring data error:", error)
    } finally {
      setIsLoading(false)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard Monitoring Target</h1>
                <p className="text-sm text-gray-400">Monitoring pencapaian target leadership bulanan</p>
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-[#D4AF37]" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Month Filter */}
        <div className="mb-6 flex items-center gap-4">
          <Calendar className="w-5 h-5 text-[#D4AF37]" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px] bg-[#1a1a1a] border-[#D4AF37]/30 text-white">
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
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => handleBreadcrumbClick("site")}
              className={`${viewMode === "site" ? "text-[#D4AF37] font-semibold" : "text-gray-400 hover:text-white"}`}
            >
              Site
            </button>
            {viewMode !== "site" && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <button
                  onClick={() => handleBreadcrumbClick("department")}
                  className={`${viewMode === "department" ? "text-[#D4AF37] font-semibold" : "text-gray-400 hover:text-white"}`}
                >
                  {selectedSite}
                </button>
              </>
            )}
            {viewMode === "individual" && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <span className="text-[#D4AF37] font-semibold">{selectedDepartment}</span>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1a1a1a] border-[#D4AF37]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Total Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{summary.target}</div>
              <p className="text-xs text-gray-500 mt-1">Bawahan langsung</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#D4AF37]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Realisasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{summary.realization}</div>
              <p className="text-xs text-gray-500 mt-1">Dengan minimal 1 evidence</p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${getStatusBg(summary.percentage)}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Persentase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getStatusColor(summary.percentage)}`}>
                {summary.percentage.toFixed(1)}%
              </div>
              <p className={`text-xs mt-1 font-semibold ${getStatusColor(summary.percentage)}`}>
                {getStatusLabel(summary.percentage)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monitoring Table */}
        <Card className="bg-[#1a1a1a] border-[#D4AF37]/30">
          <CardHeader>
            <CardTitle className="text-white">
              {viewMode === "site" && "Monitoring Per Site"}
              {viewMode === "department" && `Monitoring Departemen - ${selectedSite}`}
              {viewMode === "individual" && `Monitoring Individual - ${selectedDepartment}`}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Klik pada baris untuk melihat detail lebih lanjut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                    {viewMode !== "individual" && (
                      <th className="text-center py-3 px-4 text-sm font-semibold text-[#D4AF37]">Aksi</th>
                    )}
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
                      <td className="py-3 px-4 text-center text-white">{item.target}</td>
                      <td className="py-3 px-4 text-center text-white">{item.realization}</td>
                      <td className={`py-3 px-4 text-center font-bold ${getStatusColor(item.percentage)}`}>
                        {item.percentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBg(item.percentage)} ${getStatusColor(item.percentage)}`}
                        >
                          {getStatusLabel(item.percentage)}
                        </span>
                      </td>
                      {viewMode !== "individual" && (
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => handleDrillDown(item)}
                            className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
                          >
                            Detail
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {monitoringData.length === 0 && (
                    <tr>
                      <td colSpan={viewMode !== "individual" ? 6 : 5} className="py-8 text-center text-gray-500">
                        Tidak ada data untuk periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
