"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, User, Building2, Home } from "lucide-react"
import { getRoleLabel } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleBackToHome = () => {
    router.push("/")
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Pengajuan Cuti</h1>
              <p className="text-sm text-slate-600">{title}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <User className="h-4 w-4" />
                  {user.nama}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Building2 className="h-3 w-3" />
                  {user.site} • {getRoleLabel(user.role)}
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleBackToHome}>
                <Home className="h-4 w-4 mr-2" />
                Menu Utama
              </Button>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
