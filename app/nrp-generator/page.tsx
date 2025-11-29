"use client"

import { NRPDashboard } from "@/components/nrp/nrp-dashboard"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NRPGeneratorPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?returnUrl=/nrp-generator")
      return
    }

    const allowedRoles = ["hr_ho", "hr_site", "admin"]
    if (user && !allowedRoles.includes(user.role)) {
      setAccessDenied(true)
      return
    }
  }, [isAuthenticated, user, router])

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Spinner className="w-8 h-8 text-[#D4AF37]" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-red-500/50 rounded-lg p-8 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Warning Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 opacity-20 blur-2xl rounded-full"></div>
              <div className="relative w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/50">
                <AlertCircle className="w-12 h-12 text-red-500" strokeWidth={2} />
              </div>
            </div>

            {/* Warning Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Akses Ditolak</h1>
              <p className="text-red-400 text-lg font-semibold">ANDA TIDAK MEMILIKI AKSES UNTUK MENU INI</p>
            </div>

            {/* Action Button */}
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold"
            >
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Menu Utama
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <NRPDashboard />
}
