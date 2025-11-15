import { DashboardLayout } from "@/components/dashboard-layout"

export default function Loading() {
  return (
    <DashboardLayout title="Pengajuan Cuti">
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded animate-pulse" />
      </div>
    </DashboardLayout>
  )
}
