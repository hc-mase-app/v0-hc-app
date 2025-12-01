"use client"

import { useState, useEffect, useCallback } from "react"
import { NRPForm } from "./nrp-form"
import { KaryawanTable } from "./karyawan-table"
import { SearchBar } from "./search-bar"
import { StatsCards } from "./stats-cards"
import { ExcelUpload } from "./excel-upload"
import { getKaryawanList } from "@/app/nrp-generator/actions"
import type { Karyawan } from "@/lib/nrp-types"
import { RefreshCw, FileSpreadsheet, ArrowLeft, Hash, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export function NRPDashboard() {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<Karyawan[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const result = await getKaryawanList(search || undefined)
    if (result.success) {
      setData(result.data)
    }
    setLoading(false)
  }, [search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchData])

  function exportToCSV() {
    if (data.length === 0) return

    const headers = ["nrp", "nama_karyawan", "jabatan", "departemen", "tanggal_masuk", "site", "entitas"]

    const formatDateForCSV = (dateString: string) => {
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, "0")
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    const csvContent = [
      headers.join(","),
      ...data.map((k) =>
        [
          k.nrp,
          k.nama_karyawan,
          k.jabatan,
          k.departemen,
          formatDateForCSV(k.tanggal_masuk_kerja),
          k.site,
          k.entitas,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `data-karyawan-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-[#D4AF37] hover:bg-[#D4AF37]/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#D4AF37]/30 flex items-center justify-center">
                <Hash className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#D4AF37]">NRP Generator</h1>
                <p className="text-sm text-[#666]">Kelola Nomor Registrasi Pegawai</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-medium text-[#D4AF37]">{user?.nama}</p>
              <p className="text-xs text-[#666]">{user?.role?.toUpperCase().replace(/_/g, " ")}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form + Stats */}
          <div className="space-y-6">
            <NRPForm onSuccess={fetchData} />
            <StatsCards data={data} />
          </div>

          {/* Right Column: Table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <SearchBar value={search} onChange={setSearch} />
              </div>
              <div className="flex gap-2">
                <ExcelUpload onSuccess={fetchData} />
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={data.length === 0}
                  className="gap-2 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchData}
                  disabled={loading}
                  className="gap-2 border-[#444] text-white hover:bg-[#333] bg-transparent"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Table */}
            <KaryawanTable data={data} onRefresh={fetchData} />
          </div>
        </div>
      </div>
    </div>
  )
}
