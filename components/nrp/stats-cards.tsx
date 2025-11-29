import { Card, CardContent } from "@/components/ui/card"
import type { Karyawan } from "@/lib/nrp-types"

interface StatsCardsProps {
  data: Karyawan[]
}

export function StatsCards({ data }: StatsCardsProps) {
  const totalKaryawan = data.length
  const totalSSS = data.filter((k) => k.entitas.includes("SSS")).length
  const totalGSM = data.filter((k) => k.entitas.includes("GSM")).length
  const latestNRP = data.length > 0 ? data[0]?.nrp : "-"

  return (
    <div className="space-y-3">
      {/* Row 1: Total Karyawan and NRP Terakhir */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-[#D4AF37]/20 bg-[#0a0a0a]">
          <CardContent className="p-4">
            <p className="text-xs text-[#888]">Total</p>
            <p className="text-2xl font-bold text-[#D4AF37]">{totalKaryawan}</p>
          </CardContent>
        </Card>
        <Card className="border-[#D4AF37]/20 bg-[#0a0a0a]">
          <CardContent className="p-4">
            <p className="text-xs text-[#888]">NRP Terakhir</p>
            <p className="text-lg font-mono font-bold text-[#D4AF37] truncate">{latestNRP}</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: PT GSM and PT SSS */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-emerald-500/20 bg-[#0a0a0a]">
          <CardContent className="p-4">
            <p className="text-xs text-[#888]">PT GSM</p>
            <p className="text-2xl font-bold text-emerald-400">{totalGSM}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-[#0a0a0a]">
          <CardContent className="p-4">
            <p className="text-xs text-[#888]">PT SSS</p>
            <p className="text-2xl font-bold text-blue-400">{totalSSS}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
