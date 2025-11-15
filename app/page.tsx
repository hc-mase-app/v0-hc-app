"use client"

import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import { initializeMockData } from "@/lib/mock-data"
<<<<<<< HEAD
import { Users, Presentation, UserCheck, CalendarCheck, Lock, ClipboardList } from 'lucide-react'
=======
<<<<<<< HEAD
import { Users, Presentation, UserCheck, CalendarCheck, Lock, ClipboardList } from 'lucide-react'
=======
import { Users, Presentation, UserCheck, CalendarCheck, Lock } from 'lucide-react'
>>>>>>> 4630c40f0b9317cc0d1301e8785cd41016922fdc
>>>>>>> 2d6a580aed5e02ea0e8c2830f99a4b0f3c3d5a85

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
      external: false,
    },
    {
      title: "Penilaian Presentasi",
      icon: Presentation,
      href: "/penilaian-presentasi",
      requiresLogin: false,
      external: false,
    },
    {
      title: "Psikotest",
      icon: ClipboardList,
      href: "https://psikotest-nine.vercel.app/",
      requiresLogin: false,
      external: true,
    },
    // Locked cards at the end
    {
      title: "Assessment Karyawan",
      icon: UserCheck,
      href: "/login",
      requiresLogin: true,
<<<<<<< HEAD
      external: false,
=======
<<<<<<< HEAD
      external: false,
=======
>>>>>>> 4630c40f0b9317cc0d1301e8785cd41016922fdc
>>>>>>> 2d6a580aed5e02ea0e8c2830f99a4b0f3c3d5a85
    },
    {
      title: "Pengajuan Cuti",
      icon: CalendarCheck,
      href: "/login",
      requiresLogin: true,
      external: false,
    },
  ]

  const handleFeatureClick = (feature: typeof features[0]) => {
    if (feature.external) {
      window.open(feature.href, '_blank', 'noopener,noreferrer')
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

<<<<<<< HEAD
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 max-w-6xl w-full px-4">
=======
<<<<<<< HEAD
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 max-w-6xl w-full px-4">
=======
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl w-full px-4">
>>>>>>> 4630c40f0b9317cc0d1301e8785cd41016922fdc
>>>>>>> 2d6a580aed5e02ea0e8c2830f99a4b0f3c3d5a85
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <button
                key={feature.title}
<<<<<<< HEAD
                onClick={() => handleFeatureClick(feature)}
=======
<<<<<<< HEAD
                onClick={() => handleFeatureClick(feature)}
=======
                onClick={() => router.push(feature.href)}
>>>>>>> 4630c40f0b9317cc0d1301e8785cd41016922fdc
>>>>>>> 2d6a580aed5e02ea0e8c2830f99a4b0f3c3d5a85
                className="group flex flex-col items-center gap-3 transition-all duration-300 active:scale-95"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-[22%] bg-[#D4AF37] opacity-10 blur-xl group-hover:opacity-20 transition-opacity"></div>
                  
                  <div
                    className={`relative w-20 h-20 md:w-24 md:h-24 rounded-[22%] 
                    bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a]
                    flex items-center justify-center 
                    shadow-[0_0_20px_rgba(212,175,55,0.3),0_8px_16px_rgba(0,0,0,0.6)]
                    hover:shadow-[0_0_30px_rgba(212,175,55,0.5),0_12px_24px_rgba(0,0,0,0.7)]
                    border-2 border-[#D4AF37]/30
                    transition-all duration-300 group-hover:scale-105 group-hover:border-[#D4AF37]/50`}
                  >
                    <div className="absolute inset-0 rounded-[22%] bg-gradient-to-b from-white/3 via-transparent to-transparent"></div>
                    
                    {/* Icon */}
                    <Icon className="relative w-10 h-10 md:w-12 md:h-12 text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.9)]" strokeWidth={1.8} />
                  </div>
                  
                  {/* Lock badge for login required */}
                  {feature.requiresLogin && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg border border-red-600">
                      <Lock className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                {/* Label underneath */}
                <h3 className="text-white text-xs md:text-sm font-normal text-center max-w-[100px] md:max-w-[120px] leading-tight">
                  {feature.title}
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
