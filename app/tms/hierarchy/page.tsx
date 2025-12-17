"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Users, Download, Upload, Search, Filter, AlertCircle, CheckCircle } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

const MANAGER_LEVEL_RULES: Record<string, string[]> = {
  "General Manager": [], // No manager
  Manager: ["General Manager"],
  PJO: ["Manager"],
  "Deputy PJO": ["PJO"],
  Head: ["Deputy PJO", "PJO", "Manager"],
  Supervisor: ["Head", "Deputy PJO", "PJO"],
  "Group Leader": ["Supervisor", "Head", "Deputy PJO"],
  Admin: ["Group Leader", "Supervisor", "Head"],
  Operator: ["Group Leader", "Supervisor"],
  Driver: ["Group Leader", "Supervisor"],
  Mekanik: ["Group Leader", "Supervisor"],
  Helper: ["Admin", "Group Leader"],
}

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

export default function HierarchyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hierarchyData, setHierarchyData] = useState<HierarchyUser[]>([])
  const [filteredData, setFilteredData] = useState<HierarchyUser[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [selectedDept, setSelectedDept] = useState<string>("all")
  const [currentMonth, setCurrentMonth] = useState<string>("")

  // Edit modal
  const [editingUser, setEditingUser] = useState<HierarchyUser | null>(null)
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null)
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
    // Set current month
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    setCurrentMonth(monthStr)

    loadData(monthStr)
  }, [])

  const loadData = async (month: string) => {
    try {
      setIsLoading(true)

      // Load hierarchy data
      const hierarchyRes = await fetch(`/api/tms/hierarchy?month=${month}`)
      if (hierarchyRes.ok) {
        const data = await hierarchyRes.json()
        console.log("[v0] Hierarchy data loaded:", data.length, "Sample:", data[0])
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

  // Filter logic
  useEffect(() => {
    let filtered = hierarchyData

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
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
  }, [searchQuery, selectedSite, selectedDept, hierarchyData])

  const handleEditClick = (user: HierarchyUser) => {
    setEditingUser(user)
    setSelectedManagerId(user.manager_id)
    setIsEditModalOpen(true)
  }

  const handleSaveHierarchy = async () => {
    if (!editingUser) return

    try {
      setIsSaving(true)
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

  const getAvailableManagers = (editingUser: User | null): User[] => {
    if (!editingUser) return []

    const currentLevel = editingUser.level
    const allowedManagerLevels = currentLevel ? MANAGER_LEVEL_RULES[currentLevel] : []

    if (!allowedManagerLevels || allowedManagerLevels.length === 0) {
      console.log("[v0] No manager rules for level:", currentLevel, "Job:", editingUser.jabatan)
      return []
    }

    console.log(
      "[v0] Filtering managers for:",
      editingUser.name,
      "Level:",
      currentLevel,
      "Job:",
      editingUser.jabatan,
      "Dept:",
      editingUser.departemen,
      "Site:",
      editingUser.site,
      "Allowed manager levels:",
      allowedManagerLevels,
    )

    const availableManagers = allUsers
      .filter((u) => {
        if (u.id === editingUser.id) return false
        if (u.departemen !== editingUser.departemen) return false
        if (u.site !== editingUser.site) return false

        const managerLevel = u.level
        const isAllowed = managerLevel && allowedManagerLevels.includes(managerLevel)

        if (isAllowed) {
          console.log("[v0] Found eligible manager:", u.name, "Level:", u.level, u.jabatan, u.departemen, u.site)
        }

        return isAllowed
      })
      .sort((a, b) => {
        const levelA = a.level ? LEVEL_HIERARCHY.indexOf(a.level as any) : 999
        const levelB = b.level ? LEVEL_HIERARCHY.indexOf(b.level as any) : 999
        if (levelA !== levelB) return levelA - levelB
        return (a.name || "").localeCompare(b.name || "")
      })

    console.log("[v0] Available managers count:", availableManagers.length)
    return availableManagers
  }

  const getLevelName = (level?: string): string => {
    if (!level) return "-"
    return level
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
            <Users className="w-8 h-8 text-[#D4AF37]" />
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

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Filter className="w-4 h-4" />
              <span>
                {filteredData.length} dari {hierarchyData.length} karyawan
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="bg-[#1a1a1a] border-[#D4AF37]/30">
          <CardHeader>
            <CardTitle className="text-white">Daftar Karyawan & Atasan Langsung</CardTitle>
            <CardDescription className="text-gray-400">
              Klik "Edit" untuk mengubah atasan langsung setiap karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#D4AF37]">NIK</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#D4AF37]">Nama</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#D4AF37]">Jabatan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#D4AF37]">Level</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#D4AF37]">Site</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#D4AF37]">Departemen</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#D4AF37]">Atasan Langsung</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#D4AF37]">Bawahan</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[#D4AF37]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800 hover:bg-[#D4AF37]/5">
                      <td className="py-3 px-4 text-sm text-white">{user.nik}</td>
                      <td className="py-3 px-4 text-sm text-white">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{user.jabatan}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{getLevelName(user.level)}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{user.site}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">{user.departemen}</td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {user.manager_name ? (
                          <div>
                            <div className="font-medium text-white">{user.manager_name}</div>
                            <div className="text-xs text-gray-500">{user.manager_nik}</div>
                          </div>
                        ) : (
                          <span className="text-gray-600 italic">Tidak ada</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-semibold">
                          {user.direct_reports_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
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
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37]">Edit Atasan Langsung</DialogTitle>
            <DialogDescription className="text-gray-400">Tetapkan atasan langsung untuk karyawan ini</DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-[#0a0a1a] rounded-lg border border-[#D4AF37]/20">
                <div className="text-sm text-gray-400">Karyawan:</div>
                <div className="text-lg font-semibold text-white">{editingUser.name}</div>
                <div className="text-sm text-gray-400">
                  NIK: {editingUser.nik} | {editingUser.jabatan} | Level: {getLevelName(editingUser.level)}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Pilih Atasan Langsung:</label>
                <Select
                  value={selectedManagerId?.toString() || "none"}
                  onValueChange={(value) => setSelectedManagerId(value === "none" ? null : Number.parseInt(value))}
                >
                  <SelectTrigger className="bg-[#0a0a1a] border-[#D4AF37]/30 text-white placeholder:text-gray-300">
                    <SelectValue placeholder="Pilih atasan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada atasan</SelectItem>
                    {getAvailableManagers(editingUser).map((manager) => (
                      <SelectItem key={manager.id} value={manager.id.toString()}>
                        {manager.name} ({manager.nik}) - {manager.jabatan} - {getLevelName(manager.level)}
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
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
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
            <DialogTitle className="text-[#D4AF37]">Bulk Import Hierarki (CSV)</DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload file CSV dengan format: NIK, Nama, NIK_Atasan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-[#0a1a1a] rounded-lg border border-[#D4AF37]/20">
              <div className="text-sm text-gray-400 mb-2">Format CSV:</div>
              <code className="text-xs text-[#D4AF37] block">
                NIK,Nama,NIK_Atasan
                <br />
                USR001,Andi Wijaya,MGR001
                <br />
                USR002,Budi Santoso,MGR001
              </code>
            </div>

            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="bg-[#0a1a1a] border-[#D4AF37]/30 text-white"
            />

            {csvFile && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>File terpilih: {csvFile.name}</span>
              </div>
            )}

            {uploadResult && (
              <div
                className={`p-4 rounded-lg border ${
                  uploadResult.success
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                <div className="flex items-start gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="w-5 h-5 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{uploadResult.message}</div>
                    {uploadResult.imported && (
                      <div className="text-sm mt-1">Berhasil import: {uploadResult.imported} baris</div>
                    )}
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="text-sm mt-2">
                        <div>Error:</div>
                        <ul className="list-disc list-inside">
                          {uploadResult.errors.slice(0, 5).map((err: string, i: number) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
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
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Tutup
            </Button>
            <Button
              onClick={handleCsvUpload}
              disabled={!csvFile}
              className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload & Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
