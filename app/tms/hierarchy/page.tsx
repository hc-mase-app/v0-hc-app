"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  Users,
  Download,
  Upload,
  Search,
  AlertCircle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Lock,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

const ITEMS_PER_PAGE = 50
const VISIBLE_ROWS = 15
const ROW_HEIGHT = 65

interface HierarchyUser {
  id: number
  nik: string
  name: string
  jabatan: string
  level?: string
  departemen: string
  site: string
  manager_id: number | null
  manager_name: string | null
  manager_nik: string | null
  direct_reports_count: number
  effective_month: string
}

const LEVEL_HIERARCHY = [
  "General Manager",
  "Manager",
  "PJO",
  "Deputy PJO",
  "Head",
  "Supervisor",
  "Group Leader",
  "Admin",
  "Operator",
  "Driver",
  "Mekanik",
  "Helper",
] as const

interface User {
  id: string
  nik: string
  name: string
  jabatan: string
  level?: string
  departemen: string
  site: string
  manager_id: string | null
  manager_name?: string
  manager_nik?: string
  bawahan?: number
}

const normalizeLevel = (level: string | undefined | null): string => {
  if (!level) return ""
  return level.trim().toLowerCase()
}

const levelMatches = (level: string, target: string): boolean => {
  const normalized = normalizeLevel(level)
  const normalizedTarget = target.toLowerCase()

  // Exact match
  if (normalized === normalizedTarget) return true

  // Handle variations
  if (normalizedTarget === "pjo" && normalized === "pjo") return true
  if (
    normalizedTarget === "deputy pjo" &&
    (normalized === "deputy pjo" || normalized === "deputy-pjo" || normalized === "deputypjo")
  )
    return true
  if (
    normalizedTarget === "group leader" &&
    (normalized === "group leader" ||
      normalized === "group-leader" ||
      normalized === "groupleader" ||
      normalized === "gl")
  )
    return true
  if (
    normalizedTarget === "general manager" &&
    (normalized === "general manager" || normalized === "general-manager" || normalized === "gm")
  )
    return true

  return false
}

export default function HierarchyPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [accessDenied, setAccessDenied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hierarchyData, setHierarchyData] = useState<HierarchyUser[]>([])
  const [filteredData, setFilteredData] = useState<HierarchyUser[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [scrollTop, setScrollTop] = useState(0)
  const [tableScrollContainer, setTableScrollContainer] = useState<HTMLDivElement | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [selectedDept, setSelectedDept] = useState<string>("all")
  const [currentMonth, setCurrentMonth] = useState<string>("")

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

  // Edit modal
  const [editingUser, setEditingUser] = useState<HierarchyUser | null>(null)
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // CSV Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)

  // Sites and Departments from data
  const [sites, setSites] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?returnUrl=/tms/hierarchy")
      return
    }

    if (user?.role !== "super_admin") {
      setAccessDenied(true)
      setIsLoading(false)
      return
    }

    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, isAuthenticated, user, router])

  useEffect(() => {
    // Set current month
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    setCurrentMonth(monthStr)

    loadData(monthStr)
  }, [])

  const loadData = async (month: string) => {
    try {
      setIsLoading(true)

      const hierarchyRes = await fetch(`/api/tms/hierarchy?month=${month}`)
      if (hierarchyRes.ok) {
        const data = await hierarchyRes.json()
        console.log("[v0] Hierarchy data loaded:", data.length, "records")
        const uniqueLevels = [...new Set(data.map((u: HierarchyUser) => u.level).filter(Boolean))]
        console.log("[v0] Unique levels in database:", uniqueLevels)

        setHierarchyData(data)
        setFilteredData(data)

        // Extract unique sites and departments
        const uniqueSites = Array.from(new Set(data.map((u: HierarchyUser) => u.site).filter(Boolean)))
        const uniqueDepts = Array.from(new Set(data.map((u: HierarchyUser) => u.departemen).filter(Boolean)))
        setSites(uniqueSites as string[])
        setDepartments(uniqueDepts as string[])

        setAllUsers(data)
      }
    } catch (error) {
      console.error("[v0] Load hierarchy error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = hierarchyData

    // Search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.nik.toLowerCase().includes(query) ||
          u.name.toLowerCase().includes(query) ||
          u.jabatan.toLowerCase().includes(query),
      )
    }

    // Site filter
    if (selectedSite !== "all") {
      filtered = filtered.filter((u) => u.site === selectedSite)
    }

    // Department filter
    if (selectedDept !== "all") {
      filtered = filtered.filter((u) => u.departemen === selectedDept)
    }

    setFilteredData(filtered)
    setCurrentPage(1) // Reset to first page on filter change
  }, [debouncedSearchQuery, selectedSite, selectedDept, hierarchyData])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startRecord = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endRecord = Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)

  const visibleRows = useMemo(() => {
    if (!tableScrollContainer) return paginatedData

    const startIndex = Math.floor(scrollTop / ROW_HEIGHT)
    const endIndex = Math.ceil((scrollTop + VISIBLE_ROWS * ROW_HEIGHT) / ROW_HEIGHT)

    return paginatedData.slice(Math.max(0, startIndex), Math.min(paginatedData.length, endIndex + 2))
  }, [scrollTop, paginatedData, tableScrollContainer])

  const handleTableScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop)
  }, [])

  const handleEditClick = (user: HierarchyUser) => {
    setEditingUser(user)
    setSelectedManagerId(user.manager_id?.toString() || null)
    setIsEditModalOpen(true)
  }

  const handleSaveHierarchy = async () => {
    if (!editingUser) return

    try {
      setIsSaving(true)
      console.log("[v0] Saving hierarchy - user:", editingUser.name, "manager_id:", selectedManagerId)
      const response = await fetch("/api/tms/hierarchy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: editingUser.id,
          manager_id: selectedManagerId,
          effective_month: `${currentMonth}-01`,
        }),
      })

      if (response.ok) {
        // Reload data
        await loadData(currentMonth)
        setIsEditModalOpen(false)
        setEditingUser(null)
        setSelectedManagerId(null)
      } else {
        alert("Gagal menyimpan perubahan hierarki")
      }
    } catch (error) {
      console.error("[v0] Save hierarchy error:", error)
      alert("Terjadi kesalahan saat menyimpan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCsvUpload = async () => {
    if (!csvFile) return

    try {
      const formData = new FormData()
      formData.append("file", csvFile)
      formData.append("effective_month", `${currentMonth}-01`)

      const response = await fetch("/api/tms/hierarchy/bulk-import", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      setUploadResult(result)

      if (response.ok) {
        // Reload data
        await loadData(currentMonth)
      }
    } catch (error) {
      console.error("[v0] CSV upload error:", error)
      setUploadResult({ success: false, message: "Terjadi kesalahan saat upload" })
    }
  }

  const downloadCsvTemplate = () => {
    const template = "NIK,Nama,NIK_Atasan\nUSR001,Andi Wijaya,MGR001\nUSR002,Budi Santoso,MGR001"
    const blob = new Blob([template], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "template-hierarki.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getAvailableManagers = (editingUser: HierarchyUser | null): HierarchyUser[] => {
    if (!editingUser) return []

    const userLevel = normalizeLevel(editingUser.level)
    const userSite = (editingUser.site || "").trim().toLowerCase()
    const userDept = (editingUser.departemen || "").trim().toLowerCase()

    console.log("[v0] ========== FILTERING MANAGERS ==========")
    console.log(
      "[v0] User:",
      editingUser.name,
      "| Level:",
      editingUser.level,
      "| Site:",
      editingUser.site,
      "| Dept:",
      editingUser.departemen,
    )

    const getValidManagerLevels = (
      userLvl: string,
    ): { level: string; requireSameSite: boolean; requireSameDept: boolean }[] => {
      const lvl = userLvl.toLowerCase()

      // Rule: General Manager tidak punya atasan
      if (lvl.includes("general manager") || lvl === "gm") {
        return []
      }

      // Rule 3: Manager -> atasan adalah General Manager
      if (lvl === "manager") {
        return [{ level: "general manager", requireSameSite: false, requireSameDept: false }]
      }

      // Rule 2: PJO -> atasan adalah Manager
      if (lvl === "pjo") {
        return [{ level: "manager", requireSameSite: false, requireSameDept: false }]
      }

      // Rule 7: Deputy PJO -> atasan adalah PJO di site sama
      if (lvl.includes("deputy") && lvl.includes("pjo")) {
        return [{ level: "pjo", requireSameSite: true, requireSameDept: false }]
      }

      // Rule 7: Head -> atasan adalah PJO atau Deputy PJO di site sama
      if (lvl === "head") {
        return [
          { level: "pjo", requireSameSite: true, requireSameDept: false },
          { level: "deputy pjo", requireSameSite: true, requireSameDept: false },
        ]
      }

      if (lvl === "supervisor") {
        return [
          { level: "pjo", requireSameSite: true, requireSameDept: false },
          { level: "deputy pjo", requireSameSite: true, requireSameDept: false },
          { level: "head", requireSameSite: true, requireSameDept: true },
        ]
      }

      if ((lvl.includes("group") && lvl.includes("leader")) || lvl === "gl") {
        return [
          { level: "pjo", requireSameSite: true, requireSameDept: false },
          { level: "deputy pjo", requireSameSite: true, requireSameDept: false },
          { level: "head", requireSameSite: true, requireSameDept: true },
          { level: "supervisor", requireSameSite: true, requireSameDept: true },
          { level: "group leader", requireSameSite: true, requireSameDept: true },
        ]
      }

      if (lvl === "admin" || lvl === "operator" || lvl === "driver" || lvl === "mekanik") {
        return [
          { level: "pjo", requireSameSite: true, requireSameDept: false },
          { level: "deputy pjo", requireSameSite: true, requireSameDept: false },
          { level: "supervisor", requireSameSite: true, requireSameDept: true },
          { level: "group leader", requireSameSite: true, requireSameDept: true },
          { level: "admin", requireSameSite: true, requireSameDept: true },
        ]
      }

      // Rule 6 + 4 + 5 + 1: Helper -> Admin, Group Leader, Supervisor di site+dept sama, PJO/Deputy PJO di site sama
      if (lvl === "helper") {
        return [
          { level: "pjo", requireSameSite: true, requireSameDept: false },
          { level: "deputy pjo", requireSameSite: true, requireSameDept: false },
          { level: "supervisor", requireSameSite: true, requireSameDept: true },
          { level: "group leader", requireSameSite: true, requireSameDept: true },
          { level: "admin", requireSameSite: true, requireSameDept: true },
        ]
      }

      // Default: jika level tidak dikenali, tampilkan semua yang levelnya lebih tinggi di site yang sama
      console.log("[v0] Level tidak dikenali:", lvl, "- menampilkan pilihan default")
      return [
        { level: "pjo", requireSameSite: true, requireSameDept: false },
        { level: "deputy pjo", requireSameSite: true, requireSameDept: false },
        { level: "head", requireSameSite: true, requireSameDept: true },
        { level: "supervisor", requireSameSite: true, requireSameDept: true },
        { level: "group leader", requireSameSite: true, requireSameDept: true },
      ]
    }

    const validManagerRules = getValidManagerLevels(userLevel)
    console.log("[v0] Valid manager rules:", validManagerRules)

    if (validManagerRules.length === 0) {
      console.log("[v0] No valid managers for this user level")
      return []
    }

    const availableManagers = hierarchyData.filter((manager) => {
      // Don't allow selecting self
      if (manager.id === editingUser.id) return false

      const managerLevel = normalizeLevel(manager.level)
      const managerSite = (manager.site || "").trim().toLowerCase()
      const managerDept = (manager.departemen || "").trim().toLowerCase()

      // Check against each rule
      for (const rule of validManagerRules) {
        const levelMatch = levelMatches(manager.level || "", rule.level)
        const siteMatch = !rule.requireSameSite || managerSite === userSite
        const deptMatch = !rule.requireSameDept || managerDept === userDept

        if (levelMatch && siteMatch && deptMatch) {
          return true
        }
      }

      return false
    })

    console.log("[v0] Available managers count:", availableManagers.length)
    if (availableManagers.length > 0) {
      console.log(
        "[v0] Sample managers:",
        availableManagers.slice(0, 5).map((m) => `${m.name} (${m.level})`),
      )
    }

    return availableManagers.sort((a, b) => {
      // Sort by level hierarchy, then by name
      const aIndex = LEVEL_HIERARCHY.findIndex((l) => levelMatches(a.level || "", l))
      const bIndex = LEVEL_HIERARCHY.findIndex((l) => levelMatches(b.level || "", l))
      if (aIndex !== bIndex) return aIndex - bIndex
      return (a.name || "").localeCompare(b.name || "")
    })
  }

  const getLevelName = (level?: string): string => {
    if (!level) return "N/A"
    const index = LEVEL_HIERARCHY.indexOf(level as any)
    return index !== -1 ? level : "N/A"
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-red-950/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Lock className="w-6 h-6" />
              Akses Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">Halaman Manajemen Hierarki hanya dapat diakses oleh Admin Master.</p>
            <p className="text-sm text-gray-400">Role Anda saat ini: {user?.role}</p>
            <Button onClick={() => router.push("/tms")} className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/80">
              Kembali ke Menu TMS
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4AF37] text-lg">Memuat data hierarki...</div>
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
                <h1 className="text-2xl font-bold text-white">Manajemen Hierarki Organisasi</h1>
                <p className="text-sm text-gray-400">Periode: {currentMonth}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push("/tms")}
                className="text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">Menu Utama</span>
              </Button>
              <Users className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Actions and Filters */}
        <div className="mb-6 space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={downloadCsvTemplate}
              className="bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template CSV
            </Button>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Cari NIK, Nama, Jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1a1a1a] border-[#D4AF37]/30 text-white"
              />
            </div>

            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white">
                <SelectValue placeholder="Semua Site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Site</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site} value={site}>
                    {site}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white">
                <SelectValue placeholder="Semua Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-400 flex items-center">Total: {filteredData.length} karyawan</div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-[#1a1a1a] border-[#D4AF37]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Petunjuk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Klik &quot;Edit&quot; untuk mengubah atasan langsung karyawan. Pilihan atasan akan disesuaikan berdasarkan
              level, site, dan departemen karyawan.
            </p>
          </CardContent>
        </Card>

        {/* Data Table */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#D4AF37]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#D4AF37]/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                    NIK
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                    Jabatan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                    Dept
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                    Atasan Langsung
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                    Bawahan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10">
                {paginatedData.map((user) => (
                  <tr key={user.id} className="hover:bg-[#D4AF37]/5">
                    <td className="px-4 py-3 text-sm text-gray-300">{user.nik}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{user.jabatan}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{user.level || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{user.site}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{user.departemen}</td>
                    <td className="px-4 py-3 text-sm">
                      {user.manager_name ? (
                        <span className="text-[#D4AF37]">{user.manager_name}</span>
                      ) : (
                        <span className="text-red-400">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-medium">
                        {user.direct_reports_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        size="sm"
                        onClick={() => handleEditClick(user)}
                        className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[#D4AF37]/20 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Menampilkan {startRecord} - {endRecord} dari {filteredData.length} data
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-[#D4AF37]/30 text-[#D4AF37]"
                >
                  <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
                  Prev
                </Button>
                <span className="flex items-center px-3 text-sm text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[#D4AF37]/30 text-[#D4AF37]"
                >
                  Next
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Atasan Langsung</DialogTitle>
            <DialogDescription className="text-gray-400">Tetapkan atasan langsung untuk karyawan ini</DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0a0a0a] rounded-lg">
                <p className="text-sm text-gray-400">Karyawan:</p>
                <p className="text-lg font-medium text-white">{editingUser.name}</p>
                <p className="text-sm text-gray-400">
                  NIK: {editingUser.nik} | {editingUser.jabatan} | Level: {editingUser.level || "-"}
                </p>
                <p className="text-sm text-gray-400">
                  Site: {editingUser.site} | Dept: {editingUser.departemen}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Pilih Atasan Langsung:</label>
                <Select
                  value={selectedManagerId || "none"}
                  onValueChange={(value) => {
                    const newValue = value === "none" ? null : value
                    console.log("[v0] Manager selected:", newValue)
                    setSelectedManagerId(newValue)
                  }}
                >
                  <SelectTrigger className="bg-[#0a0a0a] border-[#D4AF37]/30 text-white">
                    <SelectValue placeholder="Pilih atasan..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="none">Tidak ada atasan</SelectItem>
                    {getAvailableManagers(editingUser).map((manager) => (
                      <SelectItem key={manager.id} value={manager.id.toString()}>
                        {manager.name} ({manager.nik}) - {manager.jabatan} - {manager.level || "N/A"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="border-[#D4AF37]/30 text-[#D4AF37]"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveHierarchy}
              disabled={isSaving}
              className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Bulk Import Hierarki</DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload file CSV untuk mengatur hierarki secara massal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Pilih File CSV:</label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="bg-[#0a0a0a] border-[#D4AF37]/30 text-white"
              />
            </div>

            {uploadResult && (
              <div
                className={`p-4 rounded-lg ${uploadResult.success ? "bg-green-900/20 border border-green-500/30" : "bg-red-900/20 border border-red-500/30"}`}
              >
                {uploadResult.success ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>{uploadResult.message || "Upload berhasil"}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{uploadResult.message || "Upload gagal"}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadModalOpen(false)
                setCsvFile(null)
                setUploadResult(null)
              }}
              className="border-[#D4AF37]/30 text-[#D4AF37]"
            >
              Tutup
            </Button>
            <Button
              onClick={handleCsvUpload}
              disabled={!csvFile}
              className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
