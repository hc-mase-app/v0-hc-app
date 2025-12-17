"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { initializeMockData } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import {
  Users,
  Presentation,
  UserCheck,
  CalendarCheck,
  Lock,
  BrainCircuit,
  Hash,
  Building2,
  LogOut,
} from "lucide-react"
import { FEATURES, hasFeatureAccess, getDashboardPath } from "@/lib/permissions"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    initializeMockData()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4AF37] text-xl">Memuat...</div>
      </div>
    )
  }

  const features = [
    {
      title: "LEADTMS",
      icon: Users,
      featureKey: "leadtms",
      description: "Leadership Activity Monitoring System",
    },
    {
      title: "Penilaian Presentasi",
      icon: Presentation,
      featureKey: "penilaianPresentasi",
    },
    {
      title: "Psikotest",
      icon: BrainCircuit,
      featureKey: "psikotest",
    },
    {
      title: "Assessment Karyawan",
      icon: UserCheck,
      featureKey: "assessmentKaryawan",
    },
    {
      title: "Pengajuan Cuti",
      icon: CalendarCheck,
      featureKey: "pengajuanCuti",
    },
    {
      title: "NRP Generator",
      icon: Hash,
      featureKey: "nrpGenerator",
    },
    {
      title: "HCGA Integrated Management System",
      icon: Building2,
      featureKey: "hcgaIms",
    },
    {
      title: "DEVELOPMENT",
      icon: "HCD",
      featureKey: "development",
    },
  ]

  const handleCardClick = (featureKey: string) => {
    const feature = FEATURES[featureKey]
    if (!feature) return

    if (featureKey === "pengajuanCuti") {
      const dashboardPath = getDashboardPath(user.role)
      router.push(dashboardPath)
    } else {
      router.push(feature.path)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark flex flex-col">
      <header className="absolute top-4 right-4">
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

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
            const hasAccess = hasFeatureAccess(feature.featureKey, user.role)
            const isDisabled = !hasAccess
            const isHCDCard = feature.icon === "HCD"

            return (
              <button
                key={feature.title}
                onClick={() => !isDisabled && handleCardClick(feature.featureKey)}
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
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-300"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-300"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-300"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-300"></div>

                        <div className="relative">
                          <span className="text-[#D4AF37] font-mono font-bold text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,1)] transition-all duration-300 tracking-wider">
                            HCD
                          </span>
                          <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 font-mono text-sm group-hover:text-[#D4AF37]/70 transition-colors duration-300">
                          {"<"}
                        </div>
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 font-mono text-sm group-hover:text-[#D4AF37]/70 transition-colors duration-300">
                          {">"}
                        </div>
                      </div>
                    ) : (
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

                  {isDisabled && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg border border-red-600">
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
                  {feature.title === "LEADTMS" && feature.description && (
                    <span
                      className={`block text-[10px] mt-0.5 font-light ${
                        isDisabled ? "text-gray-700" : "text-gray-500"
                      }`}
                    >
                      {feature.description}
                    </span>
                  )}
                </h3>
              </button>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            Masuk sebagai: <span className="text-[#D4AF37] font-semibold">{user.nama}</span>
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Role: {user.role} | Site: {user.site}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-[#666666] text-sm">© 2025 Yan Firdaus | HCD | HCGA | PT SSS - PT GSM</p>
      </footer>
    </div>
  )
}
