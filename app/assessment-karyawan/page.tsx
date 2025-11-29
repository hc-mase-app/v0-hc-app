"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import AssessmentForm from "@/components/assessment-form"

export default function AssessmentKaryawanPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Redirect to login with returnUrl if not authenticated
    if (!isAuthenticated) {
      router.push("/login?returnUrl=/assessment-karyawan")
      return
    }

    setIsLoading(false)
  }, [isAuthenticated, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4AF37]">Loading...</div>
      </div>
    )
  }

  if (user?.role !== "dic") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[#1a1a1a] border-2 border-[#D4AF37]/20 rounded-lg p-8 text-center">
            <ShieldX className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#D4AF37] mb-6">ANDA TIDAK MEMILIKI AKSES UNTUK MENU INI</h1>
            <Button
              onClick={() => router.push("/")}
              className="bg-[#D4AF37] hover:bg-[#B4941F] text-black font-semibold w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Menu Utama
            </Button>
          </div>
        </div>
      </div>
    )
  }
  // </CHANGE>

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#2a2a2a]">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/dic")}
            className="mb-2 text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#1a1a1a] text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard DIC
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">Assessment Karyawan</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <AssessmentForm />
        </div>
      </main>
    </div>
  )
}
