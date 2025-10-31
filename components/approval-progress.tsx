"use client"

import type { LeaveRequest, ApprovalHistory } from "@/lib/types"
import { CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react"

interface ApprovalProgressProps {
  request: LeaveRequest
  history: ApprovalHistory[]
}

export function ApprovalProgress({ request, history }: ApprovalProgressProps) {
  const stages = [
    { status: "pending_dic", label: "DIC", order: 1 },
    { status: "pending_pjo", label: "PJO Site", order: 2 },
    { status: "pending_hr_ho", label: "HR HO", order: 3 },
    { status: "approved", label: "Selesai", order: 4 },
  ]

  const getStageStatus = (stageStatus: string) => {
    if (request.status === "rejected") return "rejected"
    if (stageStatus === "approved") return "completed"
    if (request.status === stageStatus) return "current"

    const stageOrder = stages.find((s) => s.status === stageStatus)?.order || 0
    const currentOrder = stages.find((s) => s.status === request.status)?.order || 0

    if (stageOrder < currentOrder) return "completed"
    return "pending"
  }

  const getStageApprover = (stageStatus: string) => {
    const historyEntry = history.find((h) => {
      if (stageStatus === "pending_dic") return h.approverRole === "dic"
      if (stageStatus === "pending_pjo") return h.approverRole === "pjo_site"
      if (stageStatus === "pending_hr_ho") return h.approverRole === "hr_ho"
      return false
    })
    return historyEntry
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">Progress Persetujuan</h3>

      <div className="flex items-center gap-2">
        {stages.map((stage, index) => {
          const stageStatus = getStageStatus(stage.status)
          const approver = getStageApprover(stage.status)

          return (
            <div key={stage.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    stageStatus === "completed"
                      ? "bg-green-100"
                      : stageStatus === "current"
                        ? "bg-blue-100"
                        : stageStatus === "rejected"
                          ? "bg-red-100"
                          : "bg-slate-100"
                  }`}
                >
                  {stageStatus === "completed" ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : stageStatus === "rejected" ? (
                    <XCircle className="w-6 h-6 text-red-600" />
                  ) : stageStatus === "current" ? (
                    <Clock className="w-6 h-6 text-blue-600" />
                  ) : (
                    <div className="w-2 h-2 bg-slate-400 rounded-full" />
                  )}
                </div>
                <p className="text-xs font-medium text-center text-slate-900">{stage.label}</p>
                {approver && <p className="text-xs text-slate-500 text-center mt-1">{approver.approverName}</p>}
              </div>

              {index < stages.length - 1 && <ChevronRight className="w-5 h-5 text-slate-300 -mx-2" />}
            </div>
          )
        })}
      </div>

      {request.status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-900 font-medium">Pengajuan Ditolak</p>
          {history.find((h) => h.action === "rejected")?.notes && (
            <p className="text-sm text-red-800 mt-1">{history.find((h) => h.action === "rejected")?.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}
