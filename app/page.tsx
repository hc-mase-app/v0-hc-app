"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { initializeMockData } from "@/lib/mock-data"
import { Users, Presentation, UserCheck, CalendarCheck, Lock } from "lucide-react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Initialize mock data on first load
    initializeMockData()
  }, [])

  const features = [
    {
      title: "Leadership Activity",
      icon: Users,
      href: "/leadership-activity",
      requiresLogin: false,
    },
    {
      title: "Penilaian Presentasi",
      icon: Presentation,
      href: "/penilaian-presentasi",
      requiresLogin: false,
    },
    {
      title: "Assessment Karyawan",
      icon: UserCheck,
      href: "/assessment-karyawan",
      requiresLogin: false,
    },
    {
      title: "Pengajuan Cuti",
      icon: CalendarCheck,
      href: "/login",
      requiresLogin: true,
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-16">
          <div className="w-48 h-48 relative">
            <img src="/hcga-logo.png" alt="HCGA Department Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl w-full">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <button
                key={feature.title}
                onClick={() => router.push(feature.href)}
                className="group bg-[#1a1a1a] hover:bg-[#222222] rounded-2xl p-8 transition-all duration-300 border border-[#2a2a2a] hover:border-[#D4AF37]/30 flex flex-col items-center justify-center gap-6 min-h-[200px] relative shadow-lg shadow-[#D4AF37]/10 hover:shadow-[#D4AF37]/25"
              >
                {feature.requiresLogin && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-3 py-1">
                    <Lock className="w-3 h-3 text-[#D4AF37]" />
                    <span className="text-xs text-[#D4AF37] font-medium">Login Required</span>
                  </div>
                )}
                <div className="w-20 h-20 flex items-center justify-center">
                  <Icon className="w-full h-full text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[#D4AF37] text-xl font-medium text-center">{feature.title}</h3>
              </button>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-[#666666] text-sm">© 2025 PT. Sarana Sukses Sejahtera - PT Gunungmas Sukses Makmur | YAN</p>
      </footer>
    </div>
  )
}
