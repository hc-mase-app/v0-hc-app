"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { addKaryawan } from "@/app/nrp-generator/actions"
import { ENTITAS_OPTIONS, DEPARTEMEN_OPTIONS, SITE_OPTIONS } from "@/lib/nrp-types"
import { UserPlus, Loader2 } from "lucide-react"

interface NRPFormProps {
  onSuccess?: () => void
}

export function NRPForm({ onSuccess }: NRPFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [entitas, setEntitas] = useState<string>("")
  const [departemen, setDepartemen] = useState<string>("")
  const [site, setSite] = useState<string>("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)

    const input = {
      nama_karyawan: formData.get("nama_karyawan") as string,
      jabatan: formData.get("jabatan") as string,
      departemen: formData.get("departemen") as string,
      tanggal_masuk_kerja: formData.get("tanggal_masuk_kerja") as string,
      site: formData.get("site") as string,
      entitas: formData.get("entitas") as string,
    }

    const result = await addKaryawan(input)

    if (result.success) {
      setSuccess(`NRP berhasil di-generate: ${result.data?.nrp}`)
      setEntitas("")
      setDepartemen("")
      setSite("")
      ;(e.target as HTMLFormElement).reset()
      onSuccess?.()
    } else {
      setError(result.error || "Terjadi kesalahan")
    }

    setLoading(false)
  }

  return (
    <Card className="border-[#D4AF37]/20 bg-[#0a0a0a]">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nama_karyawan" className="text-white/80">
                Nama Karyawan
              </Label>
              <Input
                id="nama_karyawan"
                name="nama_karyawan"
                required
                className="bg-[#1a1a1a] border-[#333] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jabatan" className="text-white/80">
                Jabatan
              </Label>
              <Input id="jabatan" name="jabatan" required className="bg-[#1a1a1a] border-[#333] text-white" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departemen" className="text-white/80">
                Departemen
              </Label>
              <Select name="departemen" value={departemen} onValueChange={setDepartemen} required>
                <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white">
                  <SelectValue placeholder="Pilih Departemen" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  {DEPARTEMEN_OPTIONS.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-white">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal_masuk_kerja" className="text-white/80">
                Tanggal Masuk Kerja
              </Label>
              <Input
                id="tanggal_masuk_kerja"
                name="tanggal_masuk_kerja"
                type="date"
                required
                className="bg-[#1a1a1a] border-[#333] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site" className="text-white/80">
                Site
              </Label>
              <Select name="site" value={site} onValueChange={setSite} required>
                <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white">
                  <SelectValue placeholder="Pilih Site" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  {SITE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-white">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entitas" className="text-white/80">
                Entitas
              </Label>
              <Select name="entitas" value={entitas} onValueChange={setEntitas} required>
                <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white">
                  <SelectValue placeholder="Pilih Entitas" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  {ENTITAS_OPTIONS.map((ent) => (
                    <SelectItem key={ent.code} value={ent.value} className="text-white">
                      {ent.value} ({ent.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {success && <p className="text-sm text-emerald-500 font-medium">{success}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Generate NRP
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
