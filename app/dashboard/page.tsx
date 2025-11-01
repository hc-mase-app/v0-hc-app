"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Redirect based on role
    if (user) {
      switch (user.role) {
        case "user":
          router.push("/dashboard/user")
          break
        case "hr_site":
          router.push("/dashboard/hr-site")
          break
        case "dic":
          router.push("/dashboard/dic")
          break
        case "pjo_site":
          router.push("/dashboard/pjo")
          break
        case "hr_ho":
          router.push("/dashboard/hr-ho")
          break
        case "hr_ticketing":
          router.push("/dashboard/ticketing")
          break
        case "super_admin":
          router.push("/dashboard/admin")
          break
        default:
          router.push("/login")
      }
    }
  }, [user, isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading dashboard...</p>
    </div>
  )
}
