"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { FileText, ArrowRight, CalendarRange } from "lucide-react"

type PeriodType = "bulan_ini" | "bulan_lalu" | "3_bulan" | "tahun_ini" | "tahun_lalu"

export default function AdminSiteDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [totalPengajuan, setTotalPengajuan] = useState(0)
  const [periodLabel, setPeriodLabel] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("bulan_ini")

  const loadStats = useCallback(
    async (period: PeriodType = "bulan_ini") => {
      if (!user?.site) return

      try {
        setLoading(true)

        const cutiRes = await fetch(
          `/api/workflow?action=all&role=admin_site&site=${encodeURIComponent(user.site)}&departemen=${encodeURIComponent(user.departemen || "")}`,
        )
        const cutiResult = await cutiRes.json()

        const cutiData =
          cutiResult?.success && Array.isArray(cutiResult.data)
            ? cutiResult.data
            : Array.isArray(cutiResult)
              ? cutiResult
              : []

        console.log("[v0] Admin Site Dashboard - Total from DB:", cutiData.length)

        const now = new Date()
        let startDate: Date
        let endDate: Date
        let label: string

        switch (period) {
          case "bulan_lalu": {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            startDate = lastMonth
            endDate = new Date(now.getFullYear(), now.getMonth(), 0)
            label = lastMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
            break
          }
          case "3_bulan": {
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            const startMonth = startDate.toLocaleDateString("id-ID", { month: "short" })
            const endMonth = endDate.toLocaleDateString("id-ID", { month: "short", year: "numeric" })
            label = `${startMonth} - ${endMonth}`
            break
          }
          case "tahun_ini": {
            startDate = new Date(now.getFullYear(), 0, 1)
            endDate = new Date(now.getFullYear(), 11, 31)
            label = now.getFullYear().toString()
            break
          }
          case "tahun_lalu": {
            const lastYear = now.getFullYear() - 1
            startDate = new Date(lastYear, 0, 1)
            endDate = new Date(lastYear, 11, 31)
            label = lastYear.toString()
            break
          }
          case "bulan_ini":
          default: {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            label = startDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
            break
          }
        }

        setPeriodLabel(label)

        const filteredData = cutiData.filter((item: any) => {
          if (!item.tanggalMulai) {
            return false
          }
          const itemDate = new Date(item.tanggalMulai)
          const isInRange = itemDate >= startDate && itemDate <= endDate
          return isInRange
        })

        console.log("[v0] Admin Site Dashboard - Filtered for period", label, ":", filteredData.length)

        setTotalPengajuan(filteredData.length)
      } catch (error) {
        console.error("[Admin Site Overview] Error loading stats:", error)
      } finally {
        setLoading(false)
      }
    },
    [user?.site, user?.departemen],
  )

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "admin_site") {
      router.push("/login")
      return
    }
    loadStats(selectedPeriod)
  }, [user, isAuthenticated, router, loadStats, selectedPeriod])

  const handlePeriodChange = (value: PeriodType) => {
    setSelectedPeriod(value)
    loadStats(value)
  }

  if (!user || loading) return null

  return (
    <DashboardLayout title="Dashboard Admin Site">
      <div className="space-y-6 pb-6">
        <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-slate-200">
          <CalendarRange className="h-5 w-5 text-slate-600" />
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[200px] border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bulan_ini">Bulan Ini</SelectItem>
              <SelectItem value="bulan_lalu">Bulan Lalu</SelectItem>
              <SelectItem value="3_bulan">3 Bulan Terakhir</SelectItem>
              <SelectItem value="tahun_ini">Tahun Ini</SelectItem>
              <SelectItem value="tahun_lalu">Tahun Lalu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Monitoring Pengajuan Cuti</h1>
          <p className="text-sm text-blue-100 mb-1">{user?.site}</p>
          <p className="text-xs text-blue-200 mb-6">Periode: {periodLabel}</p>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <p className="text-5xl font-bold mb-2">{totalPengajuan}</p>
            <p className="text-base text-blue-100">Total Pengajuan</p>
            <p className="text-xs text-blue-200 mt-1">Berdasarkan Tanggal Awal Periode Cuti</p>
          </div>
        </div>

        <Link href="/dashboard/admin-site/cuti" className="block">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all h-14 text-base font-semibold"
          >
            <FileText className="h-5 w-5 mr-2" />
            LIHAT SEMUA PENGAJUAN
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
    </DashboardLayout>
  )
}
