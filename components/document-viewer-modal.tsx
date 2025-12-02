"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, Loader2, FileText, AlertCircle } from "lucide-react"
import { formatFileSize, isPDF, isOfficeDocument } from "@/lib/cloudflare-r2"

interface Document {
  key: string
  name: string
  size: number
  lastModified: Date
  category: string
}

interface DocumentViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: Document | null
}

export function DocumentViewerModal({ open, onOpenChange, document }: DocumentViewerModalProps) {
  const [loading, setLoading] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && document && !signedUrl) {
      setLoading(true)
      setError(null)
      fetch(`/api/r2-documents?key=${encodeURIComponent(document.key)}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.url) {
            setSignedUrl(data.url)
          } else {
            setError("URL dokumen tidak tersedia")
          }
        })
        .catch((error) => {
          console.error("[v0] Failed to get document URL:", error)
          setError("Gagal memuat URL dokumen")
        })
        .finally(() => {
          setLoading(false)
        })
    }

    if (!open) {
      setSignedUrl(null)
      setError(null)
    }
  }, [open, document, signedUrl])

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen)
  }

  const handleDownload = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleOpenNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    }
  }

  if (!document) return null

  const canPreview = isPDF(document.name)
  const isOffice = isOfficeDocument(document.name)

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col bg-[#0a0a0a] border-[#D4AF37]/30">
        <DialogHeader className="pr-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-white truncate">{document.name}</DialogTitle>
                <p className="text-sm text-gray-400 mt-1">
                  {formatFileSize(document.size)} • {new Date(document.lastModified).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={handleOpenNewTab}
                variant="outline"
                size="sm"
                className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent flex-1 md:flex-initial"
                disabled={loading || !signedUrl}
              >
                <ExternalLink className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Buka Tab Baru</span>
              </Button>
              <Button
                onClick={handleDownload}
                size="sm"
                className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black flex-1 md:flex-initial"
                disabled={loading || !signedUrl}
              >
                <Download className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Download</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border border-[#D4AF37]/20 bg-white">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                <p className="text-sm text-gray-600">Memuat dokumen...</p>
              </div>
            </div>
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat Dokumen</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={handleDownload} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black">
                  <Download className="w-4 h-4 mr-2" />
                  Download Saja
                </Button>
              </div>
            </div>
          ) : signedUrl && canPreview ? (
            <object data={signedUrl} type="application/pdf" className="w-full h-full" aria-label={document.name}>
              <div className="w-full h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Browser Tidak Mendukung Preview PDF</h3>
                  <p className="text-gray-600 mb-6">
                    Silakan download dokumen atau buka di tab baru untuk melihat kontennya.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={handleOpenNewTab}
                      variant="outline"
                      className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Buka Tab Baru
                    </Button>
                    <Button onClick={handleDownload} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </object>
          ) : signedUrl && isOffice ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <FileText className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Tidak Tersedia</h3>
                <p className="text-gray-600 mb-6">
                  File Office dokumen tidak dapat ditampilkan langsung. Silakan download untuk membuka di aplikasi
                  Office.
                </p>
                <Button onClick={handleDownload} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black">
                  <Download className="w-4 h-4 mr-2" />
                  Download Dokumen
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Dokumen Tidak Dapat Ditampilkan</h3>
                <p className="text-gray-600 mb-6">Silakan download dokumen untuk melihat kontennya.</p>
                <Button onClick={handleDownload} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black">
                  <Download className="w-4 h-4 mr-2" />
                  Download Dokumen
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
