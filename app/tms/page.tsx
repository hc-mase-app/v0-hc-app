"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Users, Upload, BarChart3 } from "lucide-react"

export default function TmsPage() {
  const router = useRouter()

  const menus = [
    {
      title: "Manajemen Hierarki",
      description: "Kelola atasan & bawahan langsung",
      icon: Users,
      href: "/tms/hierarchy",
    },
    {
      title: "Upload Evidence",
      description: "Upload bukti aktivitas kepemimpinan",
      icon: Upload,
      href: "/tms/evidence",
    },
    {
      title: "Dashboard Monitoring",
      description: "Monitor target vs realisasi",
      icon: BarChart3,
      href: "/tms/monitoring",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#D4AF37]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#D4AF37]">TMS</h1>
              <p className="text-sm text-gray-400">Target Monitoring System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {menus.map((menu) => {
            const Icon = menu.icon

            return (
              <button
                key={menu.title}
                onClick={() => router.push(menu.href)}
                className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-95 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20">
                  <Icon className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2 text-white">{menu.title}</h3>
                  <p className="text-sm text-gray-400">{menu.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
