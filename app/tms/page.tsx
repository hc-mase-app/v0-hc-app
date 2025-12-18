"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Users, Upload, BarChart3, Lock, Target } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function TmsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const menus = [
    {
      title: "Leadership Activity",
      description: "Kelola target aktivitas kepemimpinan",
      icon: Target,
      href: "/leadership-activity",
    },
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
    <div className="min-h-screen bg-[#0a0a0a] dark flex flex-col">
      {/* Header - Back Button */}
      <header className="absolute top-4 left-4">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Title */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2">LEADTMS</h1>
          <p className="text-gray-400 text-sm md:text-base">Leadership Activity & Target Monitoring System</p>
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl w-full px-4">
          {menus.map((menu) => {
            const Icon = menu.icon
            const locked = !hasAccess(menu)

            return (
              <button
                key={menu.title}
                onClick={() => handleMenuClick(menu)}
                disabled={locked}
                className={`group flex flex-col items-center gap-3 transition-all duration-300 ${
                  locked ? "opacity-40 cursor-not-allowed" : "active:scale-95"
                }`}
              >
                <div className="relative">
                  {/* Glow Effect */}
                  <div
                    className={`absolute inset-0 rounded-[22%] ${
                      locked ? "bg-gray-500" : "bg-[#D4AF37]"
                    } opacity-10 blur-xl transition-all duration-300 ${
                      locked ? "" : "group-hover:opacity-30 group-hover:blur-2xl"
                    }`}
                  ></div>

                  {/* Icon Container */}
                  <div
                    className={`relative w-20 h-20 md:w-24 md:h-24 rounded-[22%] 
                    bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a]
                    flex items-center justify-center 
                    ${
                      locked
                        ? "shadow-[0_0_10px_rgba(100,100,100,0.2)] border-2 border-gray-600/30"
                        : "shadow-[0_0_20px_rgba(212,175,55,0.3),0_8px_16px_rgba(0,0,0,0.6)] border-2 border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-[0_0_40px_rgba(212,175,55,0.6),0_12px_24px_rgba(0,0,0,0.7)]"
                    }
                    transition-all duration-300 ${locked ? "" : "group-hover:scale-105"}`}
                  >
                    {/* Inner Gradient Overlay */}
                    <div className="absolute inset-0 rounded-[22%] bg-gradient-to-b from-white/3 via-transparent to-transparent"></div>

                    {/* Icon */}
                    <Icon
                      className={`relative w-10 h-10 md:w-12 md:h-12 ${
                        locked ? "text-gray-600" : "text-[#D4AF37]"
                      } drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] ${
                        locked ? "" : "group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.9)]"
                      } transition-all duration-300`}
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* Lock Badge */}
                  {locked && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg border border-red-600">
                      <Lock className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                {/* Menu Title */}
                <h3
                  className={`text-xs md:text-sm font-normal text-center max-w-[100px] md:max-w-[120px] leading-tight transition-colors duration-300 ${
                    locked ? "text-gray-600" : "text-white group-hover:text-[#D4AF37]"
                  }`}
                >
                  {menu.title}
                  <span className={`block text-[10px] mt-0.5 font-light ${locked ? "text-gray-700" : "text-gray-500"}`}>
                    {menu.description}
                  </span>
                  {locked && <span className="block text-[9px] text-red-400 mt-1">Khusus Admin Master</span>}
                </h3>
              </button>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-[#666666] text-sm">© 2025 Yan Firdaus | HCD | HCGA | PT SSS - PT GSM</p>
      </footer>
    </div>
  )
}
