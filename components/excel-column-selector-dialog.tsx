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
  // User Data (dari relasi users)
  { id: "nik", label: "NIK", default: true },
  { id: "namaKaryawan", label: "NAMA KARYAWAN", default: true },
  { id: "email", label: "EMAIL", default: false },
  { id: "jabatan", label: "JABATAN", default: true },
  { id: "departemen", label: "DEPARTEMEN", default: true },
  { id: "site", label: "SITE", default: true },
  { id: "role", label: "ROLE", default: false },
  { id: "hakTiket", label: "HAK TIKET", default: true },
  { id: "poh", label: "POH", default: true },
  { id: "noKtp", label: "NO KTP", default: true },
  { id: "noTelp", label: "NO TELP", default: true },

  // Leave Request Data (dari leave_requests)
  { id: "jenisCuti", label: "JENIS CUTI", default: true },
  { id: "tanggalPengajuan", label: "TANGGAL PENGAJUAN", default: true },
  { id: "periodeAwal", label: "PERIODE AWAL", default: true },
  { id: "periodeAkhir", label: "PERIODE AKHIR", default: true },
  { id: "jumlahHari", label: "JUMLAH HARI", default: true },
  { id: "tanggalKeberangkatan", label: "TANGGAL KEBERANGKATAN", default: true },
  { id: "berangkatDari", label: "BERANGKAT DARI", default: true },
  { id: "tujuan", label: "TUJUAN", default: true },
  { id: "catatan", label: "CATATAN", default: false },
  { id: "cutiPeriodikBerikutnya", label: "CUTI PERIODIK BERIKUTNYA", default: false },

  // Workflow Status
  { id: "status", label: "STATUS", default: true },

  // Ticketing
  { id: "bookingCode", label: "KODE BOOKING", default: true },
  { id: "namaPesawat", label: "NAMA PESAWAT", default: true },
  { id: "rutePesawat", label: "RUTE PESAWAT", default: true },
  { id: "tanggalIssuedTiket", label: "TANGGAL ISSUED TIKET", default: false },

  // Ticket Departure
  { id: "tiketBerangkatCode", label: "TIKET BERANGKAT - KODE", default: false },
  { id: "tiketBerangkatMaskapai", label: "TIKET BERANGKAT - MASKAPAI", default: false },
  { id: "tiketBerangkatJam", label: "TIKET BERANGKAT - JAM", default: false },
  { id: "tiketBerangkatRute", label: "TIKET BERANGKAT - RUTE", default: false },

  // Ticket Return
  { id: "tiketBalikCode", label: "TIKET BALIK - KODE", default: false },
  { id: "tiketBalikMaskapai", label: "TIKET BALIK - MASKAPAI", default: false },
  { id: "tiketBalikJam", label: "TIKET BALIK - JAM", default: false },
  { id: "tiketBalikRute", label: "TIKET BALIK - RUTE", default: false },

  // Metadata
  { id: "createdAt", label: "DIBUAT PADA", default: false },
  { id: "updatedAt", label: "DIUPDATE PADA", default: false },
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
          <DialogTitle>Export Excel Custom - Pilih Kolom Database</DialogTitle>
          <DialogDescription>Pilih kolom data dari database yang ingin Anda export ke file Excel.</DialogDescription>
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
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 border-b pb-1">Data Karyawan</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {AVAILABLE_COLUMNS.slice(0, 11).map((column) => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.id}
                        checked={selectedColumns.includes(column.id)}
                        onCheckedChange={() => handleToggleColumn(column.id)}
                      />
                      <Label htmlFor={column.id} className="text-xs font-normal cursor-pointer flex-1">
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 border-b pb-1">Data Pengajuan Cuti</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {AVAILABLE_COLUMNS.slice(11, 22).map((column) => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.id}
                        checked={selectedColumns.includes(column.id)}
                        onCheckedChange={() => handleToggleColumn(column.id)}
                      />
                      <Label htmlFor={column.id} className="text-xs font-normal cursor-pointer flex-1">
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 border-b pb-1">Data Tiket</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {AVAILABLE_COLUMNS.slice(22, 36).map((column) => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.id}
                        checked={selectedColumns.includes(column.id)}
                        onCheckedChange={() => handleToggleColumn(column.id)}
                      />
                      <Label htmlFor={column.id} className="text-xs font-normal cursor-pointer flex-1">
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Catatan:</strong> Export Custom menampilkan data sesuai dengan field di database. Untuk format
              Finance, gunakan "Export Excel Default".
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
