"use client"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Building2, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentList } from "@/components/document-list"
import { useEffect, useState } from "react"

const CATEGORY_LABELS: Record<string, string> = {
  "induksi-karyawan": "INDUKSI KARYAWAN",
  form: "FORM",
  "sop-ik": "SOP - IK",
  "bisnis-proses-so": "BISNIS PROSES & SO",
  "internal-memo": "INTERNAL MEMO",
  sk: "SURAT KEPUTUSAN ( UMUM )",
}

const CATEGORY_SUBFOLDERS: Record<string, string[]> = {
  "induksi-karyawan": ["PT GSM", "PT SSS"],
  form: ["PT GSM", "PT SSS"],
  "sop-ik": ["PT GSM", "PT SSS"],
  "bisnis-proses-so": ["PT GSM", "PT SSS"],
  "internal-memo": ["PT GSM", "PT SSS"],
  sk: ["PT GSM", "PT SSS"],
}

export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const category = params.category as string
  const [hasSubfolders, setHasSubfolders] = useState(false)
  const [subfolders, setSubfolders] = useState<string[]>([])

  const categoryTitle = CATEGORY_LABELS[category] || "Dokumen"

  useEffect(() => {
    const categorySubfolders = CATEGORY_SUBFOLDERS[category]
    if (categorySubfolders && categorySubfolders.length > 0) {
      setHasSubfolders(true)
      setSubfolders(categorySubfolders)
    } else {
      setHasSubfolders(false)
    }
  }, [category])

  if (!hasSubfolders) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] dark">
        {/* Header */}
        <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/hcga-ims")}
                className="text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                  <Building2 className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">{categoryTitle}</h1>
                  <p className="text-sm text-gray-400">HCGA IMS</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <DocumentList category={category} />
        </main>

        {/* Footer */}
        <footer className="py-6 text-center mt-auto">
          <p className="text-[#666666] text-sm">© 2025 Yan Firdaus | HCD | HCGA | PT SSS - PT GSM</p>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/hcga-ims")}
              className="text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <Building2 className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">{categoryTitle}</h1>
                <p className="text-sm text-gray-400">Pilih Subfolder</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Subfolder Selection */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {subfolders.map((subfolder) => (
            <button
              key={subfolder}
              onClick={() => router.push(`/hcga-ims/${category}/${encodeURIComponent(subfolder)}`)}
              className="group flex flex-col items-center gap-2 md:gap-3 transition-transform duration-200 active:scale-95"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a] border border-[#D4AF37]/30 flex items-center justify-center transition-all duration-300 group-hover:border-[#D4AF37] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] group-hover:scale-110">
                <Folder className="w-10 h-10 sm:w-12 sm:h-12 text-[#D4AF37] transition-transform duration-300 group-hover:scale-110" />
              </div>

              <span className="text-xs sm:text-sm text-center text-gray-300 group-hover:text-[#D4AF37] transition-colors duration-300 leading-tight px-1 w-full break-words">
                {subfolder}
              </span>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center mt-auto">
        <p className="text-[#666666] text-sm">© 2025 Yan Firdaus | HCD | HCGA | PT SSS - PT GSM</p>
      </footer>
    </div>
  )
}
