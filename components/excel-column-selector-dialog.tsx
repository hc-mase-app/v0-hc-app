"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"

interface ExcelColumnSelectorDialogProps {
  open: boolean
  onClose: () => void
  onExport: (selectedColumns: string[]) => void
  isExporting: boolean
}

const AVAILABLE_COLUMNS = [
  { id: "nama", label: "NAMA", default: true },
  { id: "tglInvoice", label: "TGL INVOICE", default: true },
  { id: "nomorInvoice", label: "NOMOR INVOICE", default: true },
  { id: "site", label: "SITE", default: true },
  { id: "nik", label: "NIK KARYAWAN", default: true },
  { id: "namaKaryawan", label: "NAMA KARYAWAN", default: true },
  { id: "jabatan", label: "JABATAN", default: true },
  { id: "hakTiketKaryawan", label: "HAK TIKET KARYAWAN", default: true },
  { id: "pohTiketKaryawan", label: "POH TIKET KARYAWAN", default: true },
  { id: "namaPesawat", label: "NAMA PESAWAT", default: true },
  { id: "lamaOnsite", label: "LAMA ONSITE", default: true },
  { id: "notes", label: "NOTES", default: true },
  { id: "notesLainnya", label: "NOTES LAINNYA", default: true },
  { id: "tglIssuedTiket", label: "TGL ISSUED TIKET", default: true },
  { id: "tglTiket", label: "TGL TIKET", default: true },
  { id: "rutePesawat", label: "RUTE PESAWAT", default: true },
  { id: "keteranganPotonganGaji", label: "KETERANGAN POTONG GAJI", default: true },
  { id: "nilaiRefundTiket", label: "NILAI REFUND TIKET", default: true },
  { id: "keteranganRefund", label: "KETERANGAN REFUND", default: true },
  { id: "harga", label: "HARGA", default: true },
  { id: "dpp", label: "DPP", default: true },
]

export function ExcelColumnSelectorDialog({ open, onClose, onExport, isExporting }: ExcelColumnSelectorDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.filter((col) => col.default).map((col) => col.id),
  )

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]))
  }

  const handleSelectAll = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map((col) => col.id))
  }

  const handleDeselectAll = () => {
    setSelectedColumns([])
  }

  const handleExport = () => {
    onExport(selectedColumns)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pilih Kolom untuk Export Excel</DialogTitle>
          <DialogDescription>
            Pilih kolom data yang ingin Anda export ke file Excel. Anda bisa pilih semua atau hanya kolom tertentu saja.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Pilih Semua
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Hapus Semua
            </Button>
            <div className="ml-auto text-sm text-slate-600">
              {selectedColumns.length} dari {AVAILABLE_COLUMNS.length} kolom dipilih
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_COLUMNS.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => handleToggleColumn(column.id)}
                  />
                  <Label htmlFor={column.id} className="text-sm font-normal cursor-pointer flex-1">
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Catatan:</strong> Semakin banyak kolom yang dipilih, semakin lengkap data yang diexport. Anda bisa
              mengatur ulang pilihan kolom setiap kali akan export.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Batal
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedColumns.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Mengexport..." : `Export ${selectedColumns.length} Kolom`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
