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
  role: "dic" | "pjo" | "pjo_site" | "manager_ho" | "hr_ho"
  onSuccess: () => void
  approverNik?: string
}

export function ApprovalActions({ request, role, onSuccess, approverNik }: ApprovalActionsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showApproveInput, setShowApproveInput] = useState(false)
  const [approveNotes, setApproveNotes] = useState("")
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectNotes, setRejectNotes] = useState("")
  const { toast } = useToast()

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!showApproveInput) {
      setShowApproveInput(true)
      return
    }

    if (!approverNik) {
      toast({
        title: "Error",
        description: "Approver NIK tidak ditemukan. Silakan login kembali.",
        variant: "destructive",
      })
      return
    }

    setIsApproving(true)
    console.log("[v0] Starting approval process", { requestId: request.id, role, approverNik })

    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          requestId: request.id,
          approverNik: approverNik,
          approverRole: role,
          notes: approveNotes,
        }),
      })

      const data = await response.json()
      console.log("[v0] Approval response", data)

      if (data.success) {
        toast({
          title: "Berhasil",
          description: "Pengajuan cuti berhasil disetujui",
        })
        setShowApproveInput(false)
        setApproveNotes("")
        onSuccess()
      } else {
        toast({
          title: "Gagal",
          description: data.message || "Terjadi kesalahan",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Approval error", error)
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

    if (!approverNik) {
      toast({
        title: "Error",
        description: "Approver NIK tidak ditemukan. Silakan login kembali.",
        variant: "destructive",
      })
      return
    }

    setIsRejecting(true)
    console.log("[v0] Starting rejection process", { requestId: request.id, role, approverNik })

    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          requestId: request.id,
          approverNik: approverNik,
          approverRole: role,
          notes: rejectNotes,
        }),
      })

      const data = await response.json()
      console.log("[v0] Rejection response", data)

      if (data.success) {
        toast({
          title: "Berhasil",
          description: "Pengajuan cuti berhasil ditolak",
        })
        setShowRejectInput(false)
        setRejectNotes("")
        onSuccess()
      } else {
        toast({
          title: "Gagal",
          description: data.message || "Terjadi kesalahan",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Rejection error", error)
      toast({
        title: "Error",
        description: "Gagal menghubungi server",
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  const handleCancelApprove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowApproveInput(false)
    setApproveNotes("")
  }

  const handleCancelReject = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowRejectInput(false)
    setRejectNotes("")
  }

  if (showApproveInput) {
    return (
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <Textarea
          placeholder="Catatan persetujuan (opsional)..."
          value={approveNotes}
          onChange={(e) => setApproveNotes(e.target.value)}
          className="text-xs min-h-[60px]"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={handleApprove}
            disabled={isApproving}
            className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {isApproving ? "Menyetujui..." : "Konfirmasi Setuju"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelApprove}
            disabled={isApproving}
            className="text-xs h-8 bg-transparent"
          >
            Batal
          </Button>
        </div>
      </div>
    )
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
        Setuju
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
