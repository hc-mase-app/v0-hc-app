"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BrainCircuit, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { hasFeatureAccess } from "@/lib/permissions"
import { AccessDenied } from "@/components/access-denied"

export default function PsikotestPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?returnUrl=/psikotest")
      return
    }
    setIsLoading(false)
  }, [isAuthenticated, router])

  const psikotestTypes = [
    {
      title: "Psikotest Staff",
      url: "https://psikotest-nine.vercel.app",
    },
    {
      title: "Psikotest ODP Batch 3",
      url: "https://hc-mase-app.github.io/Psikotest_ODP/",
    },
  ]

  const handleCardClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4AF37]">Loading...</div>
      </div>
    )
  }

  if (!hasFeatureAccess("psikotest", user?.role)) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki izin untuk mengakses halaman Psikotest. Fitur ini hanya tersedia untuk HR HO dan Super Admin."
        returnPath="/"
        returnLabel="Kembali ke Beranda"
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <BrainCircuit className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Psikotest</h1>
                <p className="text-sm text-gray-400">Pilih Jenis Psikotest</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - iOS Style Grid */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap justify-center gap-8 max-w-2xl mx-auto">
          {psikotestTypes.map((test) => (
            <button
              key={test.title}
              onClick={() => handleCardClick(test.url)}
              className="group flex flex-col items-center gap-3 w-28 transition-transform duration-200 active:scale-95"
            >
              {/* iOS-style square icon card */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a] border border-[#D4AF37]/30 flex items-center justify-center transition-all duration-300 group-hover:border-[#D4AF37] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] group-hover:scale-110">
                <BrainCircuit className="w-12 h-12 text-[#D4AF37] transition-transform duration-300 group-hover:scale-110" />
              </div>

              {/* Label text below */}
              <span className="text-sm text-center text-gray-300 group-hover:text-[#D4AF37] transition-colors duration-300 leading-tight px-1">
                {test.title}
              </span>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center mt-auto">
        <p className="text-[#666666] text-sm">© 2025 Yan Firdaus | HCD | HCGA | PT SSS - PT GSM</p>
      </footer>
    </div>
  )
}
