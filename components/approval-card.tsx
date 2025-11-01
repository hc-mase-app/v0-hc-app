"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { LeaveRequest } from "@/lib/types"
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils"
import { Calendar, CheckCircle, XCircle, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApprovalCardProps {
  request: LeaveRequest
  onApprove?: () => void
  onReject?: () => void
  onViewDetail?: () => void
  showSite?: boolean
  readOnly?: boolean
}

export function ApprovalCard({
  request,
  onApprove,
  onReject,
  onViewDetail,
  showSite = false,
  readOnly = false,
}: ApprovalCardProps) {
  const { user } = useAuth()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  const handleApprove = async () => {
    if (!user || !notes.trim()) {
      setError("Catatan harus diisi")
      return
    }

    setError("")
    setIsApproving(true)

    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          requestId: request.id,
          approverNik: user.nik,
          approverRole: user.role,
          notes: notes,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || "Gagal menyetujui pengajuan")
        return
      }

      setNotes("")
      onApprove?.()
    } catch (error) {
      console.error("Error approving request:", error)
      setError("Gagal menyetujui pengajuan")
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!user || !notes.trim()) {
      setError("Catatan penolakan harus diisi")
      return
    }

    setError("")
    setIsRejecting(true)

    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          requestId: request.id,
          approverNik: user.nik,
          approverRole: user.role,
          notes: notes,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || "Gagal menolak pengajuan")
        return
      }

      setNotes("")
      onReject?.()
    } catch (error) {
      console.error("Error rejecting request:", error)
      setError("Gagal menolak pengajuan")
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{request.jenisPengajuanCuti}</h3>
            <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">NIK</p>
              <p className="font-medium text-slate-900">{request.userNik}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Nama</p>
              <p className="font-medium text-slate-900">{request.userName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Jabatan</p>
              <p className="font-medium text-slate-900">{request.jabatan}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Departemen</p>
              <p className="font-medium text-slate-900">{request.departemen}</p>
            </div>
            {showSite && (
              <div>
                <p className="text-xs text-slate-500">Site</p>
                <p className="font-medium text-slate-900">{request.site}</p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Tanggal Keberangkatan</p>
                <p className="font-medium text-slate-900">{formatDate(request.tanggalKeberangkatan)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="space-y-2">
            <Label htmlFor={`notes-${request.id}`}>Catatan Persetujuan/Penolakan</Label>
            <Textarea
              id={`notes-${request.id}`}
              placeholder="Masukkan catatan Anda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetail} className="flex-1 bg-transparent">
              <Eye className="h-4 w-4 mr-2" />
              Lihat Detail
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isRejecting ? "Menolak..." : "Tolak"}
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isApproving || isRejecting} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              {isApproving ? "Menyetujui..." : "Setujui"}
            </Button>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="pt-3 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onViewDetail} className="w-full bg-transparent">
            <Eye className="h-4 w-4 mr-2" />
            Lihat Detail
          </Button>
        </div>
      )}
    </div>
  )
}
