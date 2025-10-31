"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import AssessmentForm from "@/components/assessment-form"

export default function AssessmentKaryawanPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#2a2a2a]">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-2 text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Menu Utama
          </Button>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Assessment Karyawan</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <AssessmentForm />
        </div>
      </main>
    </div>
  )
}
