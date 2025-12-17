"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Target, Lock } from "lucide-react"

export default function LEADTMSPage() {
  const router = useRouter()

  const menuItems = [
    {
      title: "Leadership Activity",
      icon: Users,
      href: "/leadership-activity",
      available: true,
    },
    {
      title: "TMS (Target Monitoring System)",
      icon: Target,
      href: "/tms",
      available: true,
    },
  ]

  const handleCardClick = (menu: (typeof menuItems)[0]) => {
    if (menu.available) {
      router.push(menu.href)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>

        {/* Title Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-3">LEADTMS</h1>
          <p className="text-slate-400 text-sm md:text-base">Leadership Activity & Target Monitoring System</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-8 md:gap-12 max-w-2xl w-full px-4">
          {menuItems.map((menu) => {
            const Icon = menu.icon
            const isDisabled = !menu.available

            return (
              <button
                key={menu.title}
                onClick={() => handleCardClick(menu)}
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
                    className={`relative w-24 h-24 md:w-28 md:h-28 rounded-[22%] 
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

                    <Icon
                      className={`relative w-12 h-12 md:w-14 md:h-14 ${
                        isDisabled ? "text-gray-600" : "text-[#D4AF37]"
                      } drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] ${
                        isDisabled ? "" : "group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.9)]"
                      } transition-all duration-300`}
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* Lock badge untuk menu yang tidak tersedia */}
                  {isDisabled && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center shadow-lg border border-gray-700">
                      <Lock className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                <h3
                  className={`text-sm md:text-base font-normal text-center max-w-[140px] md:max-w-[160px] leading-tight transition-colors duration-300 ${
                    isDisabled ? "text-gray-600" : "text-white group-hover:text-[#D4AF37]"
                  }`}
                >
                  {menu.title}
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
