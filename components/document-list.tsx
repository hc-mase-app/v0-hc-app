"use client"

import { useState, useEffect } from "react"
import { FileText, Loader2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DocumentCategory } from "@/lib/cloudflare-r2"
import { GoogleDriveViewerModal } from "./google-drive-viewer-modal"

interface Document {
  id?: number
  name: string
  driveId: string
  size?: string
  uploadedAt?: string
  category: string
  subfolder?: string
}

interface DocumentListProps {
  category: DocumentCategory
  subfolder?: string
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })
  } catch {
    return dateString
  }
}

export function DocumentList({ category, subfolder }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchDocuments() {
      setLoading(true)
      setError(null)

      try {
        let url = `/api/google-drive-documents?category=${encodeURIComponent(category)}`
        if (subfolder && subfolder !== "all") {
          url += `&subfolder=${encodeURIComponent(subfolder)}`
        }

        console.log(`[v0] Fetching from: ${url}`)

        const response = await fetch(url, {
          signal: controller.signal,
          cache: "no-store", // Always fetch fresh data from server
        })

        console.log(`[v0] API Response Status: ${response.status}`)

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`[v0] API Error:`, errorData)
          throw new Error(errorData.details || "Dokumen tidak ditemukan")
        }

        const data = await response.json()
        console.log(`[v0] Successfully fetched ${data.documents?.length || 0} documents`)
        setDocuments(data.documents || [])
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("[v0] Document fetch was aborted")
          return
        }

        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        console.error("[v0] Document fetch error:", errorMessage)
        setError("Gagal memuat dokumen dari database")
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()

    return () => controller.abort()
  }, [category, subfolder])

  const handleView = (doc: Document) => {
    setSelectedDocument(doc)
    setViewerOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
          <p className="text-sm text-gray-400">Memuat dokumen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <p className="text-xs text-gray-500">Periksa koneksi database atau hubungi admin</p>
        <p className="text-xs text-gray-600 mt-3">
          Kategori: {category} {subfolder && `| Subfolder: ${subfolder}`}
        </p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p className="text-sm text-gray-400 mb-1">Belum ada dokumen</p>
        <p className="text-xs text-gray-500">Tambahkan dokumen melalui admin panel</p>
        <p className="text-xs text-gray-600 mt-3">
          Kategori: {category} {subfolder && `| Subfolder: ${subfolder}`}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-3">
        {documents.map((doc, index) => (
          <div
            key={doc.id || index}
            className="p-4 rounded-lg bg-[#1a1a1a] border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#D4AF37]" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white mb-2">{doc.name}</h4>
                {(doc.size || doc.uploadedAt) && (
                  <p className="text-xs text-gray-500 mb-3">
                    {doc.size} {doc.uploadedAt && `• ${formatDate(doc.uploadedAt)}`}
                  </p>
                )}

                <Button
                  onClick={() => handleView(doc)}
                  className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black w-full sm:w-auto"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <GoogleDriveViewerModal open={viewerOpen} onOpenChange={setViewerOpen} document={selectedDocument} />
    </>
  )
}
