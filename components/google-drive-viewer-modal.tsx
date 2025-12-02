"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, Loader2 } from "lucide-react"
import { useState } from "react"

interface GoogleDriveViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    name: string
    driveId: string
    size?: string
    uploadedAt?: string
  } | null
}

function extractDriveId(url: string): string {
  // https://drive.google.com/file/d/FILE_ID/view
  const match = url.match(/\/d\/([^/]+)/)
  return match ? match[1] : url
}

export function GoogleDriveViewerModal({ open, onOpenChange, document }: GoogleDriveViewerModalProps) {
  const [loading, setLoading] = useState(true)

  if (!document) return null

  const fileId = extractDriveId(document.driveId)
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
  const openUrl = `https://drive.google.com/file/d/${fileId}/view`

  const handleDownload = () => {
    window.open(downloadUrl, "_blank")
  }

  const handleOpenNewTab = () => {
    window.open(openUrl, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 bg-[#0a0a0a] border-[#D4AF37]/20">
        <DialogHeader className="px-6 py-4 border-b border-[#D4AF37]/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white">{document.name}</DialogTitle>
              {document.size && document.uploadedAt && (
                <p className="text-sm text-gray-400 mt-1">
                  {document.size} • {document.uploadedAt}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleOpenNewTab}
                variant="outline"
                size="sm"
                className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Buka Tab Baru
              </Button>
              <Button onClick={handleDownload} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex-1 bg-white overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                <p className="text-sm text-gray-400">Memuat dokumen...</p>
              </div>
            </div>
          )}
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            title={document.name}
            allow="autoplay"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
