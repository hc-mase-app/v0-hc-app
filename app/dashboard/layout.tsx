import type React from "react"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { RegisterServiceWorker } from "@/app/register-sw"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <RegisterServiceWorker />
      {children}
      <PWAInstallPrompt />
    </>
  )
}
