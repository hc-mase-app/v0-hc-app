"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Upload, FileText, Calendar, User, MapPin, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface ActivityType {
  id: number
  activity_code: string
  activity_name: string
  description: string
}

interface SubordinateOption {
  id: number
  nik: string
  name: string
  jabatan: string
}

export default function TmsEvidencePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Form data
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [subordinateId, setSubordinateId] = useState<string>("")
  const [activityTypeId, setActivityTypeId] = useState<string>("")
  const [activityDate, setActivityDate] = useState<string>("")
  const [location, setLocation] = useState<string>("")

  // Options
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [subordinates, setSubordinates] = useState<SubordinateOption[]>([])

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      setIsLoading(true)

      // Load activity types
      const activityTypesRes = await fetch("/api/tms/activity-types")
      if (activityTypesRes.ok) {
        const data = await activityTypesRes.json()
        setActivityTypes(data)
      }

      // Load subordinates (bawahan langsung user)
      const subordinatesRes = await fetch("/api/tms/subordinates")
      if (subordinatesRes.ok) {
        const data = await subordinatesRes.json()
        setSubordinates(data)
      }
    } catch (error) {
      console.error("[v0] Load options error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (PDF, JPG, PNG)
      const validTypes = ["application/pdf", "image/jpeg", "image/png"]
      if (!validTypes.includes(file.type)) {
        setUploadError("Hanya file PDF, JPG, atau PNG yang diizinkan")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Ukuran file maksimal 10MB")
        return
      }

      setSelectedFile(file)
      setUploadError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!selectedFile) {
      setUploadError("File evidence harus dipilih")
      return
    }
    if (!subordinateId) {
      setUploadError("Bawahan harus dipilih")
      return
    }
    if (!activityTypeId) {
      setUploadError("Tipe aktivitas harus dipilih")
      return
    }
    if (!activityDate) {
      setUploadError("Tanggal kegiatan harus diisi")
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("subordinate_id", subordinateId)
      formData.append("activity_type_id", activityTypeId)
      formData.append("activity_date", activityDate)
      formData.append("location", location)

      const response = await fetch("/api/tms/evidence/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadSuccess(true)
        // Reset form
        setSelectedFile(null)
        setSubordinateId("")
        setActivityTypeId("")
        setActivityDate("")
        setLocation("")
        // Reset file input
        const fileInput = document.getElementById("file-input") as HTMLInputElement
        if (fileInput) fileInput.value = ""

        // Auto close success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000)
      } else {
        setUploadError(result.error || "Gagal upload evidence")
      }
    } catch (error) {
      console.error("[v0] Upload evidence error:", error)
      setUploadError("Terjadi kesalahan saat upload")
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4AF37] text-lg">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#D4AF37]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Upload Evidence Leadership</h1>
                <p className="text-sm text-gray-400">Upload bukti aktivitas kepemimpinan</p>
              </div>
            </div>
            <Upload className="w-8 h-8 text-[#D4AF37]" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          {uploadSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="text-green-400">
                <div className="font-semibold">Evidence berhasil diupload!</div>
                <div className="text-sm">Data telah tersimpan dan akan diproses untuk monitoring target.</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div className="text-red-400">
                <div className="font-semibold">Upload Gagal</div>
                <div className="text-sm">{uploadError}</div>
              </div>
            </div>
          )}

          {/* Upload Form */}
          <Card className="bg-[#1a1a1a] border-[#D4AF37]/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4AF37]" />
                Form Upload Evidence
              </CardTitle>
              <CardDescription className="text-gray-400">
                Lengkapi semua data dan upload file evidence aktivitas kepemimpinan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file-input" className="text-white font-medium">
                    File Evidence <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="file-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="bg-[#0a0a0a] border-[#D4AF37]/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#D4AF37] file:text-black hover:file:bg-[#D4AF37]/90"
                    />
                  </div>
                  <p className="text-xs text-gray-300">Format: PDF, JPG, PNG (Max 10MB)</p>
                  {selectedFile && (
                    <div className="mt-2 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-[#D4AF37]">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <span className="text-gray-300">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subordinate Selection */}
                <div className="space-y-2">
                  <Label htmlFor="subordinate" className="text-white font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    Bawahan Langsung <span className="text-red-500">*</span>
                  </Label>
                  <Select value={subordinateId} onValueChange={setSubordinateId}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white placeholder:text-gray-300">
                      <SelectValue placeholder="Pilih bawahan yang menerima aktivitas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subordinates.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>
                          {sub.name} ({sub.nik}) - {sub.jabatan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subordinates.length === 0 && (
                    <p className="text-xs text-yellow-400">
                      Tidak ada bawahan langsung ditemukan. Pastikan hierarki sudah diatur.
                    </p>
                  )}
                </div>

                {/* Activity Type */}
                <div className="space-y-2">
                  <Label htmlFor="activity-type" className="text-white font-medium">
                    Tipe Aktivitas <span className="text-red-500">*</span>
                  </Label>
                  <Select value={activityTypeId} onValueChange={setActivityTypeId}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white placeholder:text-gray-300">
                      <SelectValue placeholder="Pilih tipe aktivitas kepemimpinan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          <div>
                            <div className="font-semibold">{type.activity_name}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Activity Date */}
                <div className="space-y-2">
                  <Label htmlFor="activity-date" className="text-white font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    Tanggal Kegiatan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="activity-date"
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white"
                  />
                  <p className="text-xs text-gray-300">Tanggal saat aktivitas kepemimpinan dilakukan</p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                    Lokasi Kegiatan
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Ruang Rapat, Area Produksi, dll"
                    className="bg-[#1a1a1a] border-[#D4AF37]/30 text-white placeholder:text-gray-300"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-800"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || !selectedFile || !subordinateId || !activityTypeId || !activityDate}
                    className="flex-1 bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Evidence
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="mt-6 bg-[#D4AF37]/5 border-[#D4AF37]/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-200 space-y-2">
                  <p className="font-semibold text-white">Catatan Penting:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>File evidence akan disimpan di Google Drive dan tidak dapat dihapus setelah upload</li>
                    <li>Pastikan data yang diinput sudah benar sebelum upload</li>
                    <li>Evidence hanya dihitung untuk periode bulan berjalan</li>
                    <li>Satu bawahan minimal perlu 1 evidence per bulan untuk tercapai target</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
