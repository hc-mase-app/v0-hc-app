"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface UpdateNikDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  currentNik?: string
}

export function UpdateNikDialog({ open, onOpenChange, onSuccess, currentNik }: UpdateNikDialogProps) {
  const [oldNik, setOldNik] = useState(currentNik || "")
  const [newNik, setNewNik] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [affectedRows, setAffectedRows] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!oldNik.trim() || !newNik.trim()) {
      setError("NIK lama dan NIK baru harus diisi")
      return
    }

    if (oldNik.trim() === newNik.trim()) {
      setError("NIK lama dan NIK baru tidak boleh sama")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/users/update-nik", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldNik: oldNik.trim(),
          newNik: newNik.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengupdate NIK")
      }

      setSuccess(data.message)
      setAffectedRows(data.affectedRows)

      // Wait 2 seconds then close and refresh
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        // Reset form
        setOldNik("")
        setNewNik("")
        setSuccess("")
        setAffectedRows(0)
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update NIK dengan Cascade</DialogTitle>
          <DialogDescription>
            Fitur ini akan mengubah NIK di semua tabel terkait (users, leave_requests, assessments, dll)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldNik">NIK Lama (yang akan diubah)</Label>
            <Input
              id="oldNik"
              type="text"
              placeholder="Masukkan NIK lama"
              value={oldNik}
              onChange={(e) => setOldNik(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newNik">NIK Baru (yang benar)</Label>
            <Input
              id="newNik"
              type="text"
              placeholder="Masukkan NIK baru"
              value={newNik}
              onChange={(e) => setNewNik(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {success}
                <br />
                <span className="text-sm text-muted-foreground">Total data yang diupdate: {affectedRows} baris</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 font-medium">Peringatan:</p>
            <ul className="text-sm text-amber-700 mt-1 space-y-1 list-disc list-inside">
              <li>Perubahan ini akan mempengaruhi semua data historical</li>
              <li>Data yang akan diupdate: Users, Leave Requests, Assessments, TMS Hierarchy, TMS Tickets</li>
              <li>Pastikan NIK baru belum terdaftar di sistem</li>
              <li>Proses ini tidak bisa di-undo</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} variant="destructive">
              {isSubmitting ? "Memproses..." : "Update NIK"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
