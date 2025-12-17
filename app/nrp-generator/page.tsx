"use client"

import { NRPDashboard } from "@/components/nrp/nrp-dashboard"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { hasFeatureAccess } from "@/lib/permissions"
import { AccessDenied } from "@/components/access-denied"

export default function NRPGeneratorPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?returnUrl=/nrp-generator")
      return
    }
    setIsLoading(false)
  }, [isAuthenticated, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Spinner className="w-8 h-8 text-[#D4AF37]" />
      </div>
    )
  }

  if (!hasFeatureAccess("nrpGenerator", user?.role)) {
    return (
      <AccessDenied
        title="Akses Ditolak"
        message="Anda tidak memiliki izin untuk mengakses halaman NRP Generator. Fitur ini hanya tersedia untuk HR HO dan Super Admin."
        returnPath="/"
        returnLabel="Kembali ke Beranda"
      />
    )
  }

  return <NRPDashboard />
}
