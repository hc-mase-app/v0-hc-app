"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Database, ChevronLeft, ArchiveIcon, Users, FileText } from "lucide-react"

export default function AdminWebPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "super_admin") {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user || user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4AF37] text-xl">Memuat...</div>
      </div>
    )
  }

  const menus = [
    {
      title: "Manajemen Database Users",
      description: "Upload, View, Edit & Delete",
      icon: Database,
      href: "/manajemen-users-db",
    },
    {
      title: "Archive Evidence",
      description: "Download & hapus evidence lama",
      icon: ArchiveIcon,
      href: "/tms/archive",
    },
    {
      title: "Manajemen Hierarki",
      description: "Kelola atasan & bawahan langsung",
      icon: Users,
      href: "/tms/hierarchy",
    },
    {
      title: "Manajemen Dokumen IMS",
      description: "Upload & kelola dokumen HCGA",
      icon: FileText,
      href: "/admin/documents",
    },
  ]

  const handleMenuClick = (menu: (typeof menus)[0]) => {
    router.push(menu.href)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark flex flex-col">
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
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2">ADMIN WEB</h1>
          <p className="text-gray-400 text-sm md:text-base">Control Panel</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl w-full px-4">
          {menus.map((menu) => {
            const Icon = menu.icon

            return (
              <button
                key={menu.title}
                onClick={() => handleMenuClick(menu)}
                className="group flex flex-col items-center gap-3 transition-all duration-300 active:scale-95"
              >
                <div className="relative">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 rounded-[22%] bg-[#D4AF37] opacity-10 blur-xl transition-all duration-300 group-hover:opacity-30 group-hover:blur-2xl"></div>

                  {/* Icon Container */}
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-[22%] bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3),0_8px_16px_rgba(0,0,0,0.6)] border-2 border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-[0_0_40px_rgba(212,175,55,0.6),0_12px_24px_rgba(0,0,0,0.7)] transition-all duration-300 group-hover:scale-105">
                    {/* Inner Gradient Overlay */}
                    <div className="absolute inset-0 rounded-[22%] bg-gradient-to-b from-white/3 via-transparent to-transparent"></div>

                    {/* Icon */}
                    <Icon
                      className="relative w-10 h-10 md:w-12 md:h-12 text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.9)] transition-all duration-300"
                      strokeWidth={1.8}
                    />
                  </div>
                </div>

                {/* Menu Title */}
                <h3 className="text-xs md:text-sm font-normal text-center max-w-[100px] md:max-w-[120px] leading-tight transition-colors duration-300 text-white group-hover:text-[#D4AF37]">
                  {menu.title}
                  <span className="block text-[10px] mt-0.5 font-light text-gray-500">{menu.description}</span>
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
