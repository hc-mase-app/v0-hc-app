"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Upload, Download, Search, Trash2, Edit, X } from "lucide-react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getRoleLabel } from "@/lib/utils"
import { SITES } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { CSVImportDialog } from "@/components/csv-import-dialog"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

export default function ManajemenUsersDB() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (user.role !== "super_admin") {
      router.push("/dashboard")
      return
    }

    loadData()
  }, [user, isAuthenticated, router])

  useEffect(() => {
    filterUsers()
  }, [users, selectedSite, searchQuery])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.sort((a: User, b: User) => a.nama.localeCompare(b.nama)))
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

  const filterUsers = () => {
    let filtered = users

    // Filter by site
    if (selectedSite !== "all") {
      filtered = filtered.filter((u) => u.site === selectedSite)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.nik?.toLowerCase().includes(query) ||
          u.nama?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.jabatan?.toLowerCase().includes(query) ||
          u.departemen?.toLowerCase().includes(query),
      )
    }

    setFilteredUsers(filtered)
  }

  const handleImportSuccess = () => {
    loadData()
    setIsImportOpen(false)
    toast({
      title: "Sukses",
      description: "Data berhasil diimport",
    })
  }

  const handleExportExcel = () => {
    const exportData = filteredUsers.map((u) => ({
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
      "Tanggal Masuk": u.tanggalMasuk ? new Date(u.tanggalMasuk).toLocaleDateString("id-ID") : "",
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
      description: `${filteredUsers.length} data berhasil diexport`,
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

  if (!user) return null

  const stats = {
    total: users.length,
    filtered: filteredUsers.length,
    hrSite: users.filter((u) => u.role === "hr_site").length,
    approvers: users.filter((u) => u.role === "dic" || u.role === "pjo_site" || u.role === "hr_ho").length,
    admin: users.filter((u) => u.role === "super_admin").length,
  }

  return (
    <DashboardLayout title="Manajemen Database Users">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Keseluruhan database</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditampilkan</CardTitle>
              <Search className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.filtered}</div>
              <p className="text-xs text-muted-foreground">Hasil filter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HR Site</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hrSite}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approvers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvers}</div>
              <p className="text-xs text-muted-foreground">DIC, PJO, HR HO</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Database Users</CardTitle>
                <CardDescription>Upload Excel, View, Edit & Delete Data Users</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Excel
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label>Cari</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="NIK, Nama, Email, Jabatan, Departemen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label>Site</Label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger>
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
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Memuat data...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Tidak ada data</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">NIK</th>
                        <th className="text-left p-3 font-medium">Nama</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-left p-3 font-medium">Site</th>
                        <th className="text-left p-3 font-medium">Jabatan</th>
                        <th className="text-left p-3 font-medium">Departemen</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-right p-3 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((userData) => (
                        <tr key={userData.id} className="border-t hover:bg-muted/50">
                          <td className="p-3 font-mono text-xs">{userData.nik}</td>
                          <td className="p-3 font-medium">{userData.nama}</td>
                          <td className="p-3 text-muted-foreground">{userData.email}</td>
                          <td className="p-3">
                            <Badge variant="outline">{getRoleLabel(userData.role)}</Badge>
                          </td>
                          <td className="p-3">{userData.site}</td>
                          <td className="p-3 text-muted-foreground">{userData.jabatan}</td>
                          <td className="p-3 text-muted-foreground">{userData.departemen}</td>
                          <td className="p-3">
                            <Badge variant={userData.statusKaryawan === "Tetap" ? "default" : "secondary"}>
                              {userData.statusKaryawan}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setEditingUser(userData)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingUser(userData)}
                                disabled={userData.id === user.id}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CSVImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} onSuccess={handleImportSuccess} />

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSuccess={() => {
          loadData()
          setEditingUser(null)
          toast({
            title: "Sukses",
            description: "Data user berhasil diupdate",
          })
        }}
      />

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user <strong>{deletingUser?.nama}</strong> (NIK: {deletingUser?.nik})?
              <br />
              <span className="text-destructive font-semibold">Tindakan ini tidak dapat dibatalkan.</span>
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
    </DashboardLayout>
  )
}

// Edit User Dialog Component
function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<User>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        nik: user.nik,
        nama: user.nama,
        email: user.email,
        password: user.password,
        role: user.role,
        site: user.site,
        jabatan: user.jabatan,
        departemen: user.departemen,
        poh: user.poh,
        statusKaryawan: user.statusKaryawan,
        noKtp: user.noKtp,
        noTelp: user.noTelp,
        tanggalLahir: user.tanggalLahir,
        jenisKelamin: user.jenisKelamin,
        tanggalMasuk: user.tanggalMasuk,
      })
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengupdate user",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Edit data user {user.nama} (NIK: {user.nik})
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nik">NIK</Label>
            <Input
              id="nik"
              value={formData.nik || ""}
              onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input
              id="nama"
              value={formData.nama || ""}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password || ""}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Kosongkan jika tidak diubah"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin_site">Admin Site</SelectItem>
                <SelectItem value="hr_site">HR Site</SelectItem>
                <SelectItem value="dic">DIC</SelectItem>
                <SelectItem value="pjo_site">PJO Site</SelectItem>
                <SelectItem value="manager_ho">Manager HO</SelectItem>
                <SelectItem value="hr_ho">HR HO</SelectItem>
                <SelectItem value="hr_ticketing">HR Ticketing</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site">Site</Label>
            <Select value={formData.site} onValueChange={(value) => setFormData({ ...formData, site: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITES.map((site) => (
                  <SelectItem key={site} value={site}>
                    {site}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jabatan">Jabatan</Label>
            <Input
              id="jabatan"
              value={formData.jabatan || ""}
              onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="departemen">Departemen</Label>
            <Input
              id="departemen"
              value={formData.departemen || ""}
              onChange={(e) => setFormData({ ...formData, departemen: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="poh">POH</Label>
            <Input
              id="poh"
              value={formData.poh || ""}
              onChange={(e) => setFormData({ ...formData, poh: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusKaryawan">Status Karyawan</Label>
            <Select
              value={formData.statusKaryawan}
              onValueChange={(value) => setFormData({ ...formData, statusKaryawan: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kontrak">Kontrak</SelectItem>
                <SelectItem value="Tetap">Tetap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="noKtp">No KTP</Label>
            <Input
              id="noKtp"
              value={formData.noKtp || ""}
              onChange={(e) => setFormData({ ...formData, noKtp: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="noTelp">No Telp</Label>
            <Input
              id="noTelp"
              value={formData.noTelp || ""}
              onChange={(e) => setFormData({ ...formData, noTelp: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
            <Input
              id="tanggalLahir"
              type="date"
              value={formData.tanggalLahir || ""}
              onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
            <Select
              value={formData.jenisKelamin}
              onValueChange={(value) => setFormData({ ...formData, jenisKelamin: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                <SelectItem value="Perempuan">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tanggalMasuk">Tanggal Masuk</Label>
            <Input
              id="tanggalMasuk"
              type="date"
              value={formData.tanggalMasuk || ""}
              onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
