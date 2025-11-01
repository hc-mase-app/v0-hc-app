"use client"

import type { ApprovalHistory } from "@/lib/types"
import { formatDate, getStatusColor } from "@/lib/utils"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ApprovalTimelineProps {
  history: ApprovalHistory[]
  currentStatus: string
}

export function ApprovalTimeline({ history, currentStatus }: ApprovalTimelineProps) {
  const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const getActionIcon = (action: string) => {
    if (action === "approved") return <CheckCircle className="h-5 w-5 text-green-600" />
    if (action === "rejected") return <XCircle className="h-5 w-5 text-red-600" />
    return <Clock className="h-5 w-5 text-slate-400" />
  }

  const getActionLabel = (action: string) => {
    if (action === "approved") return "Disetujui"
    if (action === "rejected") return "Ditolak"
    return "Pending"
  }

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      dic: "DIC",
      pjo_site: "PJO Site",
      hr_ho: "HR HO",
      hr_site: "HR Site",
    }
    return roleMap[role] || role
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">Riwayat Persetujuan</h3>

      {sortedHistory.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Belum ada riwayat persetujuan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedHistory.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center">{getActionIcon(entry.action)}</div>
                {index < sortedHistory.length - 1 && <div className="w-0.5 h-12 bg-slate-200 mt-2" />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900">{entry.approverName}</span>
                  <Badge variant="outline" className="text-xs">
                    {getRoleLabel(entry.approverRole)}
                  </Badge>
                  <Badge
                    className={`text-xs ${entry.action === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {getActionLabel(entry.action)}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">{formatDate(entry.timestamp)}</p>
                {entry.notes && <p className="text-sm text-slate-700 mt-2 p-2 bg-slate-50 rounded">{entry.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Status */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-slate-600">
          <span className="font-medium">Status Saat Ini:</span>{" "}
          <Badge className={getStatusColor(currentStatus)}>
            {currentStatus === "pending_dic"
              ? "Menunggu DIC"
              : currentStatus === "pending_pjo"
                ? "Menunggu PJO Site"
                : currentStatus === "pending_hr_ho"
                  ? "Menunggu HR HO"
                  : currentStatus === "approved"
                    ? "Disetujui"
                    : "Ditolak"}
          </Badge>
        </p>
      </div>
    </div>
  )
}
