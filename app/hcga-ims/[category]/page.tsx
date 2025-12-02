"use client"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentList } from "@/components/document-list"
// import { DocumentViewerModal } from "@/components/document-viewer-modal"
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/lib/cloudflare-r2"

interface Document {
  key: string
  name: string
  size: number
  lastModified: Date
  category: string
}

export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const category = params.category as DocumentCategory
  // const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  // const [viewerOpen, setViewerOpen] = useState(false)

  const categoryTitle = DOCUMENT_CATEGORIES[category] || "Dokumen"

  // const handleDocumentClick = (document: Document) => {
  //   setSelectedDocument(document)
  //   setViewerOpen(true)
  // }

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

      {/* <DocumentViewerModal open={viewerOpen} onOpenChange={setViewerOpen} document={selectedDocument} /> */}

      {/* Footer */}
      <footer className="py-6 text-center mt-auto">
        <p className="text-[#666666] text-sm">© 2025 Yan Firdaus | HCD | HCGA | PT SSS - PT GSM</p>
      </footer>
    </div>
  )
}
