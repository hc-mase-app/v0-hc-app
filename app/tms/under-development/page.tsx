"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Hammer, Wrench, Cog } from "lucide-react"

export default function TMSUnderDevelopmentPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Back Button */}
      <div className="absolute top-8 left-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Animated Tools */}
        <div className="mb-8 flex gap-4">
          {/* Hammer Animation */}
          <div className="animate-bounce" style={{ animationDelay: "0s" }}>
            <div className="relative w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-lg flex items-center justify-center border border-[#D4AF37]/30">
              <Hammer className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>

          {/* Wrench Animation */}
          <div className="animate-bounce" style={{ animationDelay: "0.2s" }}>
            <div className="relative w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-lg flex items-center justify-center border border-[#D4AF37]/30 transform -rotate-45">
              <Wrench className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>

          {/* Cog Animation */}
          <div className="animate-spin" style={{ animationDuration: "3s" }}>
            <div className="relative w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-lg flex items-center justify-center border border-[#D4AF37]/30">
              <Cog className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4 text-center">
          Sedang dalam Tahap Pengembangan
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg md:text-xl mb-4 text-center max-w-2xl">
          Target Monitoring System (TMS) sedang dibangun dengan fitur-fitur terbaru untuk membantu Anda memantau target
          kepemimpinan dengan lebih baik.
        </p>

        {/* Status Info */}
        <div className="mt-8 p-6 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#D4AF37]/20 rounded-lg max-w-lg">
          <p className="text-slate-300 text-center text-sm md:text-base leading-relaxed">
            Kami sedang mengembangkan modul-modul berikut:
          </p>
          <ul className="mt-4 space-y-2 text-slate-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
              Manajemen Hierarki Organisasi
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
              Upload Bukti Aktivitas
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
              Dashboard Monitoring Komprehensif
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
              Laporan & Analitik
            </li>
          </ul>
        </div>

        {/* Loading Indicator */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-3 h-3 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
          <p className="text-slate-500 text-sm">Mohon ditunggu...</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-[#666666] text-sm">© 2025 Yan Firdaus | HCD | HCGA | PT SSS - PT GSM</p>
      </footer>
    </div>
  )
}
