"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Users, Upload, BarChart3, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function TmsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const menus = [
    {
      title: "Manajemen Hierarki",
      description: "Kelola atasan & bawahan langsung",
      icon: Users,
      href: "/tms/hierarchy",
      restricted: true,
      allowedRoles: ["super_admin"],
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

  const hasAccess = (menu: (typeof menus)[0]) => {
    if (!menu.restricted) return true
    if (!user) return false
    return menu.allowedRoles?.includes(user.role) || false
  }

  const handleMenuClick = (menu: (typeof menus)[0]) => {
    if (!hasAccess(menu)) {
      alert("Akses ditolak! Menu ini hanya dapat diakses oleh Admin Master.")
      return
    }
    router.push(menu.href)
  }

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
            const locked = !hasAccess(menu)

            return (
              <button
                key={menu.title}
                onClick={() => handleMenuClick(menu)}
                className={`group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300 ${
                  locked
                    ? "border-gray-600/30 bg-gray-900/20 cursor-not-allowed opacity-60"
                    : "border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-95"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                    locked ? "bg-gray-700/20" : "bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20"
                  }`}
                >
                  <Icon className={`w-8 h-8 ${locked ? "text-gray-500" : "text-[#D4AF37]"}`} />
                  {locked && (
                    <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className={`text-lg font-semibold mb-2 ${locked ? "text-gray-500" : "text-white"}`}>
                    {menu.title}
                  </h3>
                  <p className="text-sm text-gray-400">{menu.description}</p>
                  {locked && <p className="text-xs text-red-400 mt-2">Khusus Admin Master</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
