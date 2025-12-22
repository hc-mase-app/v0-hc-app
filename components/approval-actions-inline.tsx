"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { LeaveRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ApprovalActionsProps {
  request: LeaveRequest
  role: "dic" | "pjo" | "manager_ho" | "hr_ho"
  onSuccess: () => void
}

export function ApprovalActions({ request, role, onSuccess }: ApprovalActionsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectNotes, setRejectNotes] = useState("")
  const { toast } = useToast()

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsApproving(true)

    try {
      const response = await fetch("/api/leave-requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          role: role,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Berhasil",
          description: "Pengajuan cuti berhasil disetujui",
        })
        onSuccess()
      } else {
        toast({
          title: "Gagal",
          description: data.message || "Terjadi kesalahan",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghubungi server",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }

    if (!rejectNotes.trim()) {
      toast({
        title: "Perhatian",
        description: "Harap masukkan alasan penolakan",
        variant: "destructive",
      })
      return
    }

    setIsRejecting(true)

    try {
      const response = await fetch("/api/leave-requests/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          role: role,
          notes: rejectNotes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Berhasil",
          description: "Pengajuan cuti berhasil ditolak",
        })
        onSuccess()
      } else {
        toast({
          title: "Gagal",
          description: data.message || "Terjadi kesalahan",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghubungi server",
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  const handleCancelReject = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowRejectInput(false)
    setRejectNotes("")
  }

  if (showRejectInput) {
    return (
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <Textarea
          placeholder="Alasan penolakan..."
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          className="text-xs min-h-[60px]"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            disabled={isRejecting}
            className="flex-1 text-xs h-8"
          >
            <XCircle className="h-3 w-3 mr-1" />
            {isRejecting ? "Menolak..." : "Konfirmasi Tolak"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelReject}
            disabled={isRejecting}
            className="text-xs h-8 bg-transparent"
          >
            Batal
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="default"
        onClick={handleApprove}
        disabled={isApproving || isRejecting}
        className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        {isApproving ? "Menyetujui..." : "Setuju"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={isApproving || isRejecting}
        className="flex-1 text-xs h-8"
      >
        <XCircle className="h-3 w-3 mr-1" />
        Tolak
      </Button>
    </div>
  )
}
