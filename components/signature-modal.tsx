"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (signatureData: string) => void
  title: string
}

export function SignatureModal({ isOpen, onClose, onSave, title }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Set drawing style
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [isOpen])

  const getCoordinates = (canvas: HTMLCanvasElement, e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    return { x, y }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)
    const { x, y } = getCoordinates(canvas, e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(canvas, e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const signatureData = canvas.toDataURL("image/png")
    onSave(signatureData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#1a1a1a] border-[#D4AF37]">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37] text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-slate-300 text-sm">Tanda tangani di area putih di bawah ini:</p>

          <canvas
            ref={canvasRef}
            className="w-full border-2 border-[#D4AF37] rounded-lg bg-white cursor-crosshair touch-none"
            style={{ height: "300px" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={clearSignature}
            disabled={!hasSignature}
            className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black bg-transparent"
          >
            <X className="h-4 w-4 mr-2" />
            Hapus
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasSignature}
            className="bg-[#D4AF37] hover:bg-[#c49d2f] text-black"
          >
            Simpan Tanda Tangan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
