"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { initializeMockData } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { Users, Presentation, UserCheck, CalendarCheck, Lock, BrainCircuit, Hash, Building2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    // Initialize mock data on first load
    initializeMockData()
  }, [])

  const features = [
    {
      title: "LEADTMS",
      icon: Users,
      href: "/leadtms",
      requiresLogin: false,
      allowedRoles: [], // Empty means all roles
    },
    {
      title: "Penilaian Presentasi",
      icon: Presentation,
      href: "/penilaian-presentasi",
      requiresLogin: false,
      allowedRoles: [],
    },
    {
      title: "Psikotest",
      icon: BrainCircuit,
      href: "/psikotest",
      requiresLogin: true,
      isExternal: false,
      allowedRoles: [],
    },
    {
      title: "Assessment Karyawan",
      icon: UserCheck,
      href: "/assessment-karyawan",
      requiresLogin: true,
      allowedRoles: ["dic"], // Only DIC can access
    },
    {
      title: "Pengajuan Cuti",
      icon: CalendarCheck,
      href: "/dashboard",
      requiresLogin: true,
      allowedRoles: [],
    },
    {
      title: "NRP Generator",
      icon: Hash,
      href: "/nrp-generator",
      requiresLogin: true,
      allowedRoles: ["hr_ho", "hr_site", "admin"],
    },
    {
      title: "HCGA Integrated Management System",
      icon: Building2,
      href: "/hcga-ims",
      requiresLogin: false,
      allowedRoles: [],
    },
    {
      title: "DEVELOPMENT",
      icon: "HCD", // Custom badge instead of icon
      href: "/development",
      requiresLogin: false,
      allowedRoles: [],
    },
  ]

  const hasAccess = (feature: (typeof features)[0]) => {
    if (!isAuthenticated && feature.requiresLogin) {
      return true // Show login-required features to non-authenticated users
    }

    if (feature.allowedRoles.length === 0) {
      return true // No role restriction
    }

    if (isAuthenticated && user) {
      return feature.allowedRoles.includes(user.role)
    }

    return true // Show by default if no restrictions
  }

  const handleCardClick = (feature: (typeof features)[0]) => {
    if (feature.isExternal) {
      window.open(feature.href, "_blank", "noopener,noreferrer")
    } else {
      router.push(feature.href)
    }
  }

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

        <div className="grid grid-cols-3 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl w-full px-4">
          {features.map((feature) => {
            const Icon = feature.icon
            const userHasAccess = hasAccess(feature)
            const isDisabled = isAuthenticated && !userHasAccess
            const isHCDCard = feature.icon === "HCD"

            return (
              <button
                key={feature.title}
                onClick={() => handleCardClick(feature)}
                disabled={isDisabled}
                className={`group flex flex-col items-center gap-3 transition-all duration-300 active:scale-95 ${
                  isDisabled ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <div className="relative">
                  <div
                    className={`absolute inset-0 rounded-[22%] ${
                      isDisabled ? "bg-gray-500" : "bg-[#D4AF37]"
                    } opacity-10 blur-xl transition-all duration-300 ${
                      isDisabled ? "" : "group-hover:opacity-30 group-hover:blur-2xl"
                    }`}
                  ></div>

                  <div
                    className={`relative w-20 h-20 md:w-24 md:h-24 rounded-[22%] 
                    bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a]
                    flex items-center justify-center 
                    ${
                      isDisabled
                        ? "shadow-[0_0_10px_rgba(100,100,100,0.2)] border-2 border-gray-600/30"
                        : "shadow-[0_0_20px_rgba(212,175,55,0.3),0_8px_16px_rgba(0,0,0,0.6)] border-2 border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-[0_0_40px_rgba(212,175,55,0.6),0_12px_24px_rgba(0,0,0,0.7)]"
                    }
                    transition-all duration-300 ${isDisabled ? "" : "group-hover:scale-105"}`}
                  >
                    <div className="absolute inset-0 rounded-[22%] bg-gradient-to-b from-white/3 via-transparent to-transparent"></div>

                    {isHCDCard ? (
                      <div className="relative flex flex-col items-center justify-center">
                        {/* Corner ornaments */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-300"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-300"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-300"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-300"></div>

                        {/* HCD Text Badge */}
                        <div className="relative">
                          <span className="text-[#D4AF37] font-mono font-bold text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,1)] transition-all duration-300 tracking-wider">
                            HCD
                          </span>
                          {/* Underline decoration */}
                          <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Code brackets decoration */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 font-mono text-sm group-hover:text-[#D4AF37]/70 transition-colors duration-300">
                          {"<"}
                        </div>
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 font-mono text-sm group-hover:text-[#D4AF37]/70 transition-colors duration-300">
                          {">"}
                        </div>
                      </div>
                    ) : (
                      /* Regular icon for other cards */
                      <Icon
                        className={`relative w-10 h-10 md:w-12 md:h-12 ${
                          isDisabled ? "text-gray-600" : "text-[#D4AF37]"
                        } drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] ${
                          isDisabled ? "" : "group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.9)]"
                        } transition-all duration-300`}
                        strokeWidth={1.8}
                      />
                    )}
                  </div>

                  {/* Lock badge for login required or no access */}
                  {(feature.requiresLogin || isDisabled) && (
                    <div
                      className={`absolute -top-1 -right-1 w-6 h-6 ${
                        isDisabled ? "bg-gray-600" : "bg-red-500"
                      } rounded-full flex items-center justify-center shadow-lg border ${
                        isDisabled ? "border-gray-700" : "border-red-600"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                <h3
                  className={`text-xs md:text-sm font-normal text-center max-w-[100px] md:max-w-[120px] leading-tight transition-colors duration-300 ${
                    isDisabled ? "text-gray-600" : "text-white group-hover:text-[#D4AF37]"
                  }`}
                >
                  {feature.title}
                  {feature.title === "LEADTMS" && (
                    <span
                      className={`block text-[10px] mt-0.5 font-light ${
                        isDisabled ? "text-gray-700" : "text-gray-500"
                      }`}
                    >
                      Leadership Activity Monitoring System
                    </span>
                  )}
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
