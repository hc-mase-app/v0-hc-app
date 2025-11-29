"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Karyawan } from "@/lib/nrp-types"
import { deleteKaryawan } from "@/app/nrp-generator/actions"
import { Trash2, Loader2, Users } from "lucide-react"

interface KaryawanTableProps {
  data: Karyawan[]
  onRefresh?: () => void
}

export function KaryawanTable({ data, onRefresh }: KaryawanTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deleteKaryawan(id)
    onRefresh?.()
    setDeletingId(null)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  function getEntitasBadgeColor(entitas: string) {
    if (entitas.includes("SSS")) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-[#666] mb-4" />
        <p className="text-[#666]">Belum ada data karyawan</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#333] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-[#333] bg-[#1a1a1a] hover:bg-[#1a1a1a]">
            <TableHead className="text-[#D4AF37] font-semibold">NRP</TableHead>
            <TableHead className="text-[#D4AF37] font-semibold">Nama Karyawan</TableHead>
            <TableHead className="text-[#D4AF37] font-semibold">Jabatan</TableHead>
            <TableHead className="text-[#D4AF37] font-semibold">Departemen</TableHead>
            <TableHead className="text-[#D4AF37] font-semibold">Tgl Masuk</TableHead>
            <TableHead className="text-[#D4AF37] font-semibold">Site</TableHead>
            <TableHead className="text-[#D4AF37] font-semibold">Entitas</TableHead>
            <TableHead className="text-[#D4AF37] font-semibold text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((karyawan) => (
            <TableRow key={karyawan.id} className="border-[#333] hover:bg-[#1a1a1a]">
              <TableCell className="font-mono text-[#D4AF37] font-medium">{karyawan.nrp}</TableCell>
              <TableCell className="text-white">{karyawan.nama_karyawan}</TableCell>
              <TableCell className="text-white/70">{karyawan.jabatan}</TableCell>
              <TableCell className="text-white/70">{karyawan.departemen}</TableCell>
              <TableCell className="text-white/70">{formatDate(karyawan.tanggal_masuk_kerja)}</TableCell>
              <TableCell className="text-white/70">{karyawan.site}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getEntitasBadgeColor(karyawan.entitas)}>
                  {karyawan.entitas.includes("SSS") ? "SSS" : "GSM"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      {deletingId === karyawan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#1a1a1a] border-[#333]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Hapus Data Karyawan?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60">
                        Apakah Anda yakin ingin menghapus data {karyawan.nama_karyawan} dengan NRP {karyawan.nrp}?
                        Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#333] text-white border-[#444] hover:bg-[#444]">
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(karyawan.id)}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
