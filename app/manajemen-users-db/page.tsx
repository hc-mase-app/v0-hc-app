"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Upload,
  Download,
  Search,
  Trash2,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
} from "lucide-react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getRoleLabel } from "@/lib/utils"
import { SITES } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CSVImportDialog } from "@/components/csv-import-dialog"
import { EditUserDialog } from "@/components/edit-user-dialog"
import { AddUserDialog } from "@/components/add-user-dialog"
import { UpdateNikDialog } from "@/components/update-nik-dialog"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

const ITEMS_PER_PAGE = 10

export default function ManajemenUsersDB() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdateNikOpen, setIsUpdateNikOpen] = useState(false)
  const [selectedNikForUpdate, setSelectedNikForUpdate] = useState<string>("")

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSite])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (user.role !== "super_admin") {
      router.push("/dashboard")
      return
    }
  }, [user, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === "super_admin") {
      loadData()
    }
  }, [currentPage, selectedSite, debouncedSearch, isAuthenticated, user])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })

      if (selectedSite !== "all") {
        params.set("site", selectedSite)
      }

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim())
      }

      const response = await fetch(`/api/users?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotalPages(data.totalPages || 1)
        setTotalUsers(data.total || 0)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      toast({
        title: "Mengambil data...",
        description: "Sedang mengambil semua data untuk export",
      })

      // Fetch all users for export (without pagination)
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch")

      const allUsers: User[] = await response.json()

      // Apply filters client-side for export
      let exportUsers = allUsers
      if (selectedSite !== "all") {
        exportUsers = exportUsers.filter((u) => u.site === selectedSite)
      }
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase()
        exportUsers = exportUsers.filter(
          (u) =>
            u.nik?.toLowerCase().includes(query) ||
            u.nama?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.jabatan?.toLowerCase().includes(query) ||
            u.departemen?.toLowerCase().includes(query),
        )
      }

      const exportData = exportUsers.map((u) => ({
        NIK: u.nik,
        Nama: u.nama,
        Email: u.email,
        Password: u.password,
        Role: u.role,
        Site: u.site,
        Jabatan: u.jabatan,
        Departemen: u.departemen,
        POH: u.poh,
        Status: u.statusKaryawan,
        "No KTP": u.noKtp,
        "No Telp": u.noTelp,
        "Tanggal Lahir": u.tanggalLahir ? new Date(u.tanggalLahir).toLocaleDateString("id-ID") : "",
        "Jenis Kelamin": u.jenisKelamin,
        "Tanggal Masuk": u.tanggalBergabung ? new Date(u.tanggalBergabung).toLocaleDateString("id-ID") : "",
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Users")

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `users_database_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Sukses",
        description: `${exportUsers.length} data berhasil diexport`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal export data",
        variant: "destructive",
      })
    }
  }

  const handleImportSuccess = () => {
    loadData()
    setIsImportOpen(false)
    toast({
      title: "Sukses",
      description: "Data berhasil diimport",
    })
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    try {
      const response = await fetch(`/api/users?id=${deletingUser.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadData()
        toast({
          title: "Sukses",
          description: "User berhasil dihapus",
        })
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus user",
        variant: "destructive",
      })
    } finally {
      setDeletingUser(null)
    }
  }

  const handleOpenUpdateNik = (nik: string) => {
    setSelectedNikForUpdate(nik)
    setIsUpdateNikOpen(true)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (!user) return null

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)

  return (
    <DashboardLayout title="Manajemen Database Users">
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manajemen Database Users</h1>
            <p className="text-sm md:text-base text-muted-foreground">Kelola data pengguna sistem</p>
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex gap-2">
            <Button variant="outline" onClick={() => setIsUpdateNikOpen(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Update NIK
            </Button>
            <Button variant="outline" onClick={handleExportExcel} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={() => setIsAddUserOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700">
              <Users className="h-4 w-4" />
              Tambah User
            </Button>
            <Button onClick={() => setIsImportOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Excel
            </Button>
          </div>

          {/* Mobile dropdown menu */}
          <div className="flex gap-2 md:hidden">
            <Button onClick={() => setIsAddUserOpen(true)} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
              <Users className="h-4 w-4" />
              Tambah
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsUpdateNikOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Update NIK
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Users</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{totalUsers}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Hasil filter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Halaman</CardTitle>
              <Search className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {currentPage} / {totalPages}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">{ITEMS_PER_PAGE} per hal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Ditampilkan</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{users.length}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {totalUsers > 0 ? `${startItem}-${endItem}` : "0 data"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Site Filter</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold capitalize">
                {selectedSite === "all" ? "Semua" : selectedSite}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Site terpilih</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Data Users
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Total: {totalUsers} users (menampilkan {users.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-3 md:gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-xs md:text-sm">Filter Site</Label>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger className="text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Site</SelectItem>
                      {SITES.map((site) => (
                        <SelectItem key={site} value={site}>
                          {site}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs md:text-sm">Cari User</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari NIK, Nama, Email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 md:pl-8 text-xs md:text-sm"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-6 w-6 md:h-7 md:w-7 p-0"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-sm md:text-base text-muted-foreground">Memuat data...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-sm md:text-base text-muted-foreground">Tidak ada data user</div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="space-y-3 md:hidden">
                    {users.map((u) => (
                      <Card key={u.id} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-mono text-xs text-muted-foreground">{u.nik}</div>
                              <div className="font-semibold text-sm">{u.nama}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Menu className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingUser(u)}>
                                  <Edit className="h-4 w-4 mr-2 text-blue-600" />
                                  Edit Semua
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenUpdateNik(u.nik)}>
                                  <Edit className="h-4 w-4 mr-2 text-amber-600" />
                                  Edit NIK
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeletingUser(u)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {getRoleLabel(u.role)}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {u.site}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {u.jabatan}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium text-sm">NIK</th>
                            <th className="text-left p-2 font-medium text-sm">Nama</th>
                            <th className="text-left p-2 font-medium text-sm">Email</th>
                            <th className="text-left p-2 font-medium text-sm">Role</th>
                            <th className="text-left p-2 font-medium text-sm">Site</th>
                            <th className="text-left p-2 font-medium text-sm">Jabatan</th>
                            <th className="text-right p-2 font-medium text-sm">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id} className="border-t hover:bg-muted/50">
                              <td className="p-2 font-mono text-sm">{u.nik}</td>
                              <td className="p-2 text-sm">{u.nama}</td>
                              <td className="p-2 text-sm text-muted-foreground">{u.email}</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs">
                                  {getRoleLabel(u.role)}
                                </Badge>
                              </td>
                              <td className="p-2 text-sm">{u.site}</td>
                              <td className="p-2 text-sm">{u.jabatan}</td>
                              <td className="p-2">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingUser(u)}
                                    title="Edit Semua Field"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenUpdateNik(u.nik)}
                                    title="Update NIK Saja"
                                  >
                                    <Edit className="h-4 w-4 text-amber-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => setDeletingUser(u)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4">
                    <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                      Menampilkan {startItem}-{endItem} dari {totalUsers} data
                    </div>
                    <div className="flex items-center justify-center gap-1 md:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsLeft className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>

                      {/* Show fewer page numbers on mobile */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                          let pageNum: number
                          if (totalPages <= 3) {
                            pageNum = i + 1
                          } else if (currentPage === 1) {
                            pageNum = i + 1
                          } else if (currentPage === totalPages) {
                            pageNum = totalPages - 2 + i
                          } else {
                            pageNum = currentPage - 1 + i
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="h-8 w-8 p-0 text-xs md:text-sm"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsRight className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CSVImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onSuccess={loadData} />

        <AddUserDialog
          open={isAddUserOpen}
          onOpenChange={setIsAddUserOpen}
          onSuccess={() => {
            setIsAddUserOpen(false)
            loadData()
          }}
        />

        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null)
            loadData()
          }}
        />

        <UpdateNikDialog
          open={isUpdateNikOpen}
          onOpenChange={setIsUpdateNikOpen}
          initialNik={selectedNikForUpdate}
          onSuccess={() => {
            setIsUpdateNikOpen(false)
            setSelectedNikForUpdate("")
            loadData()
          }}
        />

        <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus user <strong>{deletingUser?.nama}</strong> (NIK: {deletingUser?.nik})?
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
