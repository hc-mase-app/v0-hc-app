"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft } from "lucide-react"

interface AccessDeniedProps {
  title?: string
  message?: string
  returnPath?: string
  returnLabel?: string
}

export function AccessDenied({
  title = "Akses Ditolak",
  message = "Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.",
  returnPath = "/",
  returnLabel = "Kembali ke Beranda",
}: AccessDeniedProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
      <Card className="w-full max-w-md bg-[#1a1a1a] border-[#D4AF37]/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-white">{title}</CardTitle>
          <CardDescription className="text-gray-400 mt-2">{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push(returnPath)} className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {returnLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
