"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Target, Calendar, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { AccessDenied } from "@/components/access-denied"

interface ActivityType {
  id: number
  activity_code: string
  activity_name: string
  description: string
  target_per_subordinate: number
}

interface SubordinateProgress {
  nrp: string
  nama: string
  site: string
  departemen: string
  coaching_count: number
  counseling_count: number
  mentoring_count: number
  directing_count: number
  total_activities: number
  progress_percentage: number
}

export default function LeadershipActivityPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [subordinates, setSubordinates] = useState<SubordinateProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData()
    }
  }, [isAuthenticated, user, selectedMonth])

  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch activity types
      const typesRes = await fetch("/api/tms/activity-types")
      const typesData = await typesRes.json()
      setActivityTypes(typesData.data || [])

      // Fetch subordinates progress
      const progressRes = await fetch(`/api/tms/activity/progress?month=${selectedMonth}`)
      const progressData = await progressRes.json()
      setSubordinates(progressData.data || [])
    } catch (error) {
      console.error("[v0] Error loading leadership activity data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return <AccessDenied message="Anda harus login untuk mengakses halaman ini." />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#D4AF37]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/tms")}
              className="text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/10"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Kembali ke Menu TMS
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#D4AF37]">Leadership Activity</h1>
              <p className="text-sm text-gray-400">Kelola target aktivitas kepemimpinan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Month Selector */}
        <Card className="mb-6 bg-gray-900/50 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="text-[#D4AF37] flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Pilih Periode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:outline-none"
            />
          </CardContent>
        </Card>

        {/* Activity Types Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {activityTypes.map((type) => (
            <Card key={type.id} className="bg-gray-900/50 border-[#D4AF37]/20">
              <CardHeader>
                <CardTitle className="text-[#D4AF37] text-lg">{type.activity_name}</CardTitle>
                <CardDescription className="text-gray-400">{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-white font-semibold">{type.target_per_subordinate}x</span>
                  <span className="text-gray-400 text-sm">per bawahan/bulan</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subordinates Progress */}
        <Card className="bg-gray-900/50 border-[#D4AF37]/20">
          <CardHeader>
            <CardTitle className="text-[#D4AF37] flex items-center gap-2">
              <Users className="w-5 h-5" />
              Progress Bawahan Langsung
            </CardTitle>
            <CardDescription className="text-gray-400">
              Target aktivitas per bawahan untuk periode {selectedMonth}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-400">Memuat data...</div>
            ) : subordinates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Belum ada data bawahan langsung. Set hierarki di Manajemen Hierarki terlebih dahulu.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D4AF37]/20">
                      <th className="text-left py-3 px-4 text-[#D4AF37]">NRP</th>
                      <th className="text-left py-3 px-4 text-[#D4AF37]">Nama</th>
                      <th className="text-left py-3 px-4 text-[#D4AF37]">Site</th>
                      <th className="text-center py-3 px-4 text-[#D4AF37]">Coaching</th>
                      <th className="text-center py-3 px-4 text-[#D4AF37]">Counseling</th>
                      <th className="text-center py-3 px-4 text-[#D4AF37]">Mentoring</th>
                      <th className="text-center py-3 px-4 text-[#D4AF37]">Directing</th>
                      <th className="text-center py-3 px-4 text-[#D4AF37]">Total</th>
                      <th className="text-center py-3 px-4 text-[#D4AF37]">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subordinates.map((sub) => (
                      <tr key={sub.nrp} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-white">{sub.nrp}</td>
                        <td className="py-3 px-4 text-white">{sub.nama}</td>
                        <td className="py-3 px-4 text-gray-400">{sub.site}</td>
                        <td className="py-3 px-4 text-center text-white">{sub.coaching_count}</td>
                        <td className="py-3 px-4 text-center text-white">{sub.counseling_count}</td>
                        <td className="py-3 px-4 text-center text-white">{sub.mentoring_count}</td>
                        <td className="py-3 px-4 text-center text-white">{sub.directing_count}</td>
                        <td className="py-3 px-4 text-center font-semibold text-white">{sub.total_activities}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <TrendingUp
                              className={`w-4 h-4 ${sub.progress_percentage >= 100 ? "text-green-500" : "text-yellow-500"}`}
                            />
                            <span
                              className={`font-semibold ${sub.progress_percentage >= 100 ? "text-green-500" : "text-yellow-500"}`}
                            >
                              {sub.progress_percentage.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
