"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Home, Download, Trash2, AlertCircle, Database, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useAuth } from "@/lib/auth-context"

interface MonthData {
  month: string // Format: YYYY-MM
  monthLabel: string // Format: Jan 2025
  fileCount: number
  totalSize: number
}

export default function StorageArchivePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageLimit] = useState(10 * 1024 * 1024 * 1024) // 10GB in bytes
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/tms/archive/by-month")
      if (!response.ok) throw new Error("Failed to load data")
      const data = await response.json()

      setMonthlyData(data.data.months)
      setStorageUsed(data.data.totalSize)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthToggle = (month: string) => {
    setSelectedMonths((prev) => (prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]))
  }

  const getSelectedStats = () => {
    const selected = monthlyData.filter((m) => selectedMonths.includes(m.month))
    return {
      fileCount: selected.reduce((sum, m) => sum + m.fileCount, 0),
      totalSize: selected.reduce((sum, m) => sum + m.totalSize, 0),
    }
  }

  const handleDownload = async () => {
    if (selectedMonths.length === 0) {
      alert("Pilih minimal 1 bulan untuk download")
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch("/api/tms/archive/download-by-month", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-nik": user?.nik || "",
        },
        body: JSON.stringify({ months: selectedMonths }),
      })

      if (!response.ok) throw new Error("Failed to download")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Evidence_${selectedMonths.join("_")}_${new Date().toISOString().split("T")[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert("Download berhasil! File ZIP telah tersimpan.")
    } catch (error) {
      console.error("[v0] Error downloading:", error)
      alert("Gagal download. Silakan coba lagi.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const response = await fetch("/api/tms/archive/delete-by-month", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-nik": user?.nik || "",
        },
        body: JSON.stringify({ months: selectedMonths }),
      })

      if (!response.ok) throw new Error("Failed to delete")

      const data = await response.json()
      alert(`Berhasil! ${data.data.deletedCount} file telah dihapus dari storage.`)
      setShowDeleteDialog(false)
      setSelectedMonths([])
      loadData() // Refresh data
    } catch (error) {
      console.error("[v0] Error deleting:", error)
      alert("Gagal hapus evidence. Silakan coba lagi.")
    } finally {
      setActionLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const storagePercentage = (storageUsed / storageLimit) * 100
  const selectedStats = getSelectedStats()
  const isSuperAdmin = user?.role === "super_admin"

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#D4AF37]/30 bg-[#1a1a1a] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/tms")}
                className="w-10 h-10 rounded-lg bg-[#0a0a0a] border border-[#D4AF37]/30 flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#D4AF37]">Archive Evidence</h1>
                <p className="text-xs sm:text-sm text-gray-400">Kelola storage evidence berdasarkan usage</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push("/tms")} className="gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              <span className="sm:inline">Menu Utama</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
        {/* Access Check */}
        {!isSuperAdmin && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">
              Akses ditolak! Halaman ini hanya dapat diakses oleh Super Admin.
            </AlertDescription>
          </Alert>
        )}

        {isSuperAdmin && (
          <>
            {/* Storage Usage Widget */}
            <div className="bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Current Storage Usage</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {formatBytes(storageUsed)} / {formatBytes(storageLimit)} ({storagePercentage.toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-6 sm:h-8 bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#D4AF37]/20">
                <div
                  className={`h-full transition-all duration-500 ${
                    storagePercentage >= 90 ? "bg-red-500" : storagePercentage >= 80 ? "bg-yellow-500" : "bg-[#D4AF37]"
                  }`}
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-white px-2 text-center">
                  <span className="hidden sm:inline">
                    {storagePercentage.toFixed(1)}% Used - {formatBytes(storageLimit - storageUsed)} Available
                  </span>
                  <span className="sm:hidden">{storagePercentage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Warning Alert */}
              {storagePercentage >= 80 && (
                <Alert
                  className={`mt-4 ${storagePercentage >= 90 ? "border-red-500/50 bg-red-500/10" : "border-yellow-500/50 bg-yellow-500/10"}`}
                >
                  <AlertCircle className={`h-4 w-4 ${storagePercentage >= 90 ? "text-red-500" : "text-yellow-500"}`} />
                  <AlertDescription className={storagePercentage >= 90 ? "text-red-400" : "text-yellow-400"}>
                    {storagePercentage >= 90
                      ? "URGENT! Storage hampir penuh. Segera backup dan hapus evidence lama."
                      : "Warning! Storage mencapai 80%. Pertimbangkan untuk backup dan hapus evidence lama."}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Evidence Breakdown by Month */}
            <div className="bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-lg p-4 sm:p-6 mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-[#D4AF37] mb-4">Evidence Breakdown by Month</h3>
              <p className="text-xs sm:text-sm text-gray-400 mb-4">
                Pilih bulan yang ingin di-download atau dihapus (oldest first)
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                </div>
              ) : monthlyData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Tidak ada evidence di storage</p>
              ) : (
                <div className="space-y-3">
                  {monthlyData.map((month) => (
                    <div
                      key={month.month}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-lg hover:border-[#D4AF37]/40 transition-colors"
                    >
                      <Checkbox
                        id={month.month}
                        checked={selectedMonths.includes(month.month)}
                        onCheckedChange={() => handleMonthToggle(month.month)}
                      />
                      <label
                        htmlFor={month.month}
                        className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer gap-2"
                      >
                        <span className="font-medium text-white text-sm sm:text-base">{month.monthLabel}</span>
                        <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
                          <span className="text-gray-400">
                            {month.fileCount} file{month.fileCount !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[#D4AF37] font-semibold min-w-[60px] sm:min-w-[80px] text-right">
                            {formatBytes(month.totalSize)}
                          </span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Summary & Actions */}
            {selectedMonths.length > 0 && (
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37] rounded-lg p-4 sm:p-6 mb-6">
                <h4 className="font-semibold text-[#D4AF37] mb-2 text-sm sm:text-base">Selected Summary</h4>
                <p className="text-white mb-4 text-xs sm:text-sm">
                  {selectedMonths.length} month{selectedMonths.length !== 1 ? "s" : ""} selected •{" "}
                  {selectedStats.fileCount} files • {formatBytes(selectedStats.totalSize)} will be freed
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleDownload} disabled={actionLoading} className="flex-1 gap-2 text-sm">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span className="hidden sm:inline">Download Selected (ZIP)</span>
                    <span className="sm:hidden">Download</span>
                  </Button>
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={actionLoading}
                    variant="destructive"
                    className="flex-1 gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete Selected</span>
                    <span className="sm:hidden">Delete</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Cara Maintenance Storage:</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                  <li>Monitor storage usage di widget atas</li>
                  <li>Jika storage mencapai 80-90%, pilih bulan-bulan lama yang ingin dihapus</li>
                  <li>Klik &quot;Download Selected&quot; untuk backup ke local storage</li>
                  <li>Setelah backup aman, klik &quot;Delete Selected&quot; untuk mengosongkan storage</li>
                  <li>Tidak perlu menunggu 2-3 bulan, hapus kapan saja sesuai kebutuhan storage</li>
                </ol>
              </AlertDescription>
            </Alert>
          </>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Evidence Terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus <strong className="text-red-400">{selectedStats.fileCount} file</strong> (
              {formatBytes(selectedStats.totalSize)}) dari storage.
              <br />
              <br />
              <strong className="text-yellow-500">Pastikan Anda sudah download backup terlebih dahulu!</strong>
              <br />
              <br />
              Aksi ini tidak dapat dibatalkan. File yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Ya, Hapus Evidence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
