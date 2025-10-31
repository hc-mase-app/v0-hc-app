"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const [nik, setNik] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const success = await login(nik, password)

    if (success) {
      router.push("/dashboard")
    } else {
      setError("NIK atau password salah. Silakan coba lagi.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-4 relative">
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-[#D4AF37] hover:text-[#f0d98f] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Kembali</span>
      </Link>

      <div className="mb-8">
        <Image src="/hcga-logo.png" alt="HCGA Logo" width={120} height={120} className="mx-auto" />
      </div>

      <Card className="w-full max-w-md bg-[#1a1a1a] border-[#2a2a2a] shadow-[0_0_30px_rgba(212,175,55,0.3),0_0_60px_rgba(212,175,55,0.2)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#D4AF37]">Pengajuan Cuti</CardTitle>
          <CardDescription className="text-center text-gray-400">Masuk dengan NIK dan password Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nik" className="text-gray-300">
                NIK
              </Label>
              <Input
                id="nik"
                type="text"
                placeholder="Masukkan NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                required
                disabled={isLoading}
                className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-[#D4AF37] hover:bg-[#f0d98f] text-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
