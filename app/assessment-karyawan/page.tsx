"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { hasFeatureAccess } from "@/lib/permissions"
import { AccessDenied } from "@/components/access-denied"
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

  if (!hasFeatureAccess("assessmentKaryawan", user?.role)) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki izin untuk mengakses halaman Assessment Karyawan. Fitur ini hanya tersedia untuk DIC, PJO Site, HR Site, Manager HO, HR HO, dan Super Admin."
        returnPath="/"
        returnLabel="Kembali ke Beranda"
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#2a2a2a]">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-2 text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#1a1a1a] text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Menu Utama
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
