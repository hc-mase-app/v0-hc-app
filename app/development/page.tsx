"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Code, ArrowLeft, Hammer } from "lucide-react"

export default function DevelopmentPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 rounded-full bg-[#D4AF37] opacity-20 blur-3xl animate-pulse"></div>
          <div className="relative w-32 h-32 mx-auto rounded-[22%] bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)] border-2 border-[#D4AF37]/40">
            <Code className="w-16 h-16 text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" strokeWidth={1.8} />
            <Hammer className="absolute -bottom-2 -right-2 w-8 h-8 text-[#D4AF37] animate-bounce" strokeWidth={2} />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Halaman Sedang Dalam <span className="text-[#D4AF37]">Pengembangan</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Fitur ini sedang kami bangun untuk memberikan pengalaman yang lebih baik.
            <br />
            Mohon bersabar, akan segera hadir!
          </p>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></div>
          <span className="text-sm font-medium text-[#D4AF37]">Under Construction</span>
        </div>

        {/* Back Button */}
        <div className="pt-4">
          <Button
            onClick={() => router.push("/")}
            className="group bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#D4AF37] text-black font-semibold px-8 py-6 text-base shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center">
        <p className="text-[#666666] text-sm">© 2025 Yan Firdaus | HCD | HCGA | PT SSS - PT GSM</p>
      </footer>
    </div>
  )
}
