"use client"

import type { ApprovalHistory } from "@/lib/types"
import { formatDate, getStatusColor, getDetailedTicketStatus } from "@/lib/utils"
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface ApprovalTimelineProps {
  history: ApprovalHistory[]
  currentStatus: string
  statusTiketBerangkat?: string
  statusTiketBalik?: string
}

export function ApprovalTimeline({ history, currentStatus, statusTiketBerangkat, statusTiketBalik }: ApprovalTimelineProps) {
  console.log("[v0] ApprovalTimeline - Raw history:", history)
  console.log("[v0] ApprovalTimeline - statusTiketBerangkat:", statusTiketBerangkat)
  console.log("[v0] ApprovalTimeline - statusTiketBalik:", statusTiketBalik)
  
  const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const filteredHistory = sortedHistory.filter((entry, index, arr) => {
    // Selalu tampilkan non-ticket actions
    if (entry.action !== 'tiket_berangkat_issued' && entry.action !== 'tiket_balik_issued') {
      return true
    }
    
    // Untuk ticket actions, ambil entry terakhir untuk SETIAP tipe
    const lastIndexOfSameAction = arr.map(e => e.action).lastIndexOf(entry.action)
    const shouldShow = index === lastIndexOfSameAction
    
    console.log(`[v0] Filter check - action: ${entry.action}, index: ${index}, lastIndex: ${lastIndexOfSameAction}, show: ${shouldShow}`)
    
    return shouldShow
  })

  console.log("[v0] ApprovalTimeline - Filtered history:", filteredHistory)

  const getActionIcon = (action: string) => {
    if (action === "approved") return <CheckCircle className="h-5 w-5 text-green-600" />
    if (action === "rejected") return <XCircle className="h-5 w-5 text-red-600" />
    return <Clock className="h-5 w-5 text-slate-400" />
  }

  const getActionLabel = (action: string) => {
    if (action === "approved") return "Disetujui"
    if (action === "rejected") return "Ditolak"
    if (action === "tiket_berangkat_issued") return "Tiket Berangkat Terbit"
    if (action === "tiket_balik_issued") return "Tiket Balik Terbit"
    if (action === "tiket_issued") return "Tiket Lengkap"
    if (action === "tiket_partial_issued") return "Tiket Sebagian Terbit"
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

  const getCurrentStatusLabel = () => {
    return getDetailedTicketStatus(currentStatus, statusTiketBerangkat, statusTiketBalik)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">Riwayat Persetujuan</h3>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Belum ada riwayat persetujuan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center">{getActionIcon(entry.action)}</div>
                {index < filteredHistory.length - 1 && <div className="w-0.5 h-12 bg-slate-200 mt-2" />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900">{entry.approverName}</span>
                  <Badge variant="outline" className="text-xs">
                    {getRoleLabel(entry.approverRole)}
                  </Badge>
                  <Badge
                    className={`text-xs ${
                      entry.action === "approved" || 
                      entry.action === "tiket_berangkat_issued" || 
                      entry.action === "tiket_balik_issued" || 
                      entry.action === "tiket_issued" ||
                      entry.action === "tiket_partial_issued"
                        ? "bg-green-100 text-green-800 hover:bg-green-100" 
                        : entry.action === "rejected"
                          ? "bg-red-100 text-red-800 hover:bg-red-100"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    }`}
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
            {getCurrentStatusLabel()}
          </Badge>
        </p>
      </div>
    </div>
  )
}
