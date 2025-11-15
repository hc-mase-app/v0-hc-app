"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import PresentationAssessmentForm from "@/components/presentation-assessment-form"

export default function PenilaianPresentasiPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Save logic will be handled by the form component
    setTimeout(() => setIsSaving(false), 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-10 bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => router.push("/")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Menu Utama
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Evaluasi Presentasi Karyawan</h1>
          <p className="text-muted-foreground text-sm mt-1">PT. SARANA SUKSES SEJAHTERA</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <PresentationAssessmentForm />
      </main>
    </div>
  )
}
