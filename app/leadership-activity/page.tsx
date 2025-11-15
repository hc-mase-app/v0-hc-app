"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, X, Edit, Loader2, Save, FolderOpen, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from "react"
import Image from "next/image"
import { SignatureModal } from "@/components/signature-modal"

interface SavedDraft {
  id: string
  name: string
  selectedCompany: string
  activities: string[]
  formData: any
  signatures: any
  photoData: string | null
  savedAt: string
}

export default function LeadershipActivityPage() {
  const router = useRouter()
  const [selectedCompany, setSelectedCompany] = useState("")
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([])
  const [showDraftsList, setShowDraftsList] = useState(false)
  const [draftName, setDraftName] = useState("")

  const [signatureModalOpen, setSignatureModalOpen] = useState(false)
  const [currentSignatureKey, setCurrentSignatureKey] = useState<string>("")

  const [activities, setActivities] = useState<string[]>([])
  const [formData, setFormData] = useState({
    nik: "",
    departemen: "",
    nama: "",
    lokasi: "",
    jabatan: "",
    tanggal_masuk: "",
    masalah: "",
    tindak_lanjut: "",
    komitmen: "",
    catatan: "",
  })

  const [signatures, setSignatures] = useState({
    atasan: { data: null as string | null, nama: "", tanggal: "" },
    karyawan: { data: null as string | null, nama: "", tanggal: "" },
    pjo: { data: null as string | null, nama: "", tanggal: "" },
    hcga: { data: null as string | null, nama: "", tanggal: "" },
  })

  const companyLogos = {
    pt_sss: "/sss-logo.png",
    pt_gsm: "/gsm-logo.png",
  }

  useEffect(() => {
    const today = new Date().toLocaleDateString("id-ID")
    setSignatures((prev) => ({
      atasan: { ...prev.atasan, tanggal: today },
      karyawan: { ...prev.karyawan, tanggal: today },
      pjo: { ...prev.pjo, tanggal: today },
      hcga: { ...prev.hcga, tanggal: today },
    }))
    
    loadAllDrafts()
  }, [])

  const handleSaveSignature = (signatureData: string) => {
    setSignatures((prev) => ({
      ...prev,
      [currentSignatureKey]: {
        ...prev[currentSignatureKey as keyof typeof signatures],
        data: signatureData,
      },
    }))
  }

  const clearSignature = (key: string) => {
    setSignatures((prev) => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof signatures],
        data: null,
      },
    }))
  }

  const handleExport = async () => {
    if (isExporting) {
      console.log("[v0] Export already in progress, ignoring duplicate request")
      return
    }

    if (!selectedCompany) {
      alert("Silakan pilih perusahaan terlebih dahulu")
      return
    }

    if (!formData.nama?.trim()) {
      alert("Nama harus diisi")
      return
    }

    if (!formData.nik?.trim()) {
      alert("NIK harus diisi")
      return
    }

    if (activities.length === 0) {
      alert("Silakan pilih minimal 1 activity")
      return
    }

    if (!formData.masalah?.trim()) {
      alert("Masalah harus diisi")
      return
    }

    if (!formData.tindak_lanjut?.trim()) {
      alert("Tindak lanjut/solusi harus diisi")
      return
    }

    if (!formData.komitmen?.trim()) {
      alert("Komitmen harus diisi")
      return
    }

    const hasSignature = Object.values(signatures).some(sig => sig.data !== null)
    if (!hasSignature) {
      alert("Minimal harus ada 1 tanda tangan")
      return
    }

    const capturedSignatures: Record<string, string | null> = {
      atasan: signatures.atasan.data,
      karyawan: signatures.karyawan.data,
      pjo: signatures.pjo.data,
      hcga: signatures.hcga.data,
    }

    setIsExporting(true)
    let objectUrl: string | null = null

    try {
      console.log("[v0] Starting PDF generation...")
      
      let logoDataURL = null
      const logoSrc = companyLogos[selectedCompany as keyof typeof companyLogos]
      if (logoSrc) {
        try {
          const response = await fetch(logoSrc)
          if (!response.ok) throw new Error('Logo fetch failed')
          
          const blob = await response.blob()
          
          if (blob.size > 100 * 1024) {
            console.warn('[v0] Logo size large:', blob.size, 'bytes')
          }
          
          logoDataURL = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        } catch (e) {
          console.error("[v0] Error loading logo:", e)
        }
      }

      let processedPhotoData = photoData
      let photoDimensions = null
      if (photoData) {
        try {
          const img = document.createElement('img')
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              photoDimensions = { width: img.width, height: img.height }
              console.log("[v0] Photo dimensions:", photoDimensions)
              resolve()
            }
            img.onerror = reject
            img.src = photoData
          })
        } catch (e) {
          console.error("[v0] Error getting photo dimensions:", e)
        }
        
        if (photoData.length > 500 * 1024) {
          console.warn('[v0] Photo size large, may affect performance on mobile')
        }
      }

      console.log("[v0] Sending PDF generation request...")
      
      const response = await fetch("/api/pdf/leadership-activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activities,
          formData,
          signatures,
          capturedSignatures,
          photoData: processedPhotoData,
          photoDimensions,
          logoDataURL,
        }),
      })

      console.log("[v0] PDF response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }))
        throw new Error(errorData.message || "Failed to generate PDF")
      }

      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `Leadership_Activity_${formData.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

      const blob = await response.blob()
      console.log("[v0] PDF blob size:", blob.size, "bytes")
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty')
      }
      
      objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = objectUrl
      a.download = filename
      
      document.body.appendChild(a)
      
      try {
        a.click()
        console.log("[v0] PDF download initiated successfully")
      } catch (e) {
        console.error("[v0] Click download failed, trying alternative:", e)
        window.open(objectUrl, '_blank')
        console.log("[v0] PDF opened in new tab for manual download")
      }
      
      setTimeout(() => {
        if (objectUrl) {
          window.URL.revokeObjectURL(objectUrl)
        }
        document.body.removeChild(a)
      }, 100)

      alert("PDF berhasil didownload! Cek folder Download Anda.")
    } catch (error) {
      console.error("[v0] Error exporting PDF:", error)
      
      let errorMessage = 'Terjadi kesalahan saat membuat PDF'
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Koneksi ke server gagal. Periksa koneksi internet Anda.'
        } else if (error.message.includes('empty')) {
          errorMessage = 'PDF yang dihasilkan kosong. Silakan coba lagi.'
        } else {
          errorMessage = error.message
        }
      }
      
      alert(`Gagal export ke PDF: ${errorMessage}`)
      
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleActivityChange = (activity: string) => {
    setActivities((prev) => (prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setPhotoError("Tidak ada file yang dipilih")
      setPhotoData(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("File yang dipilih bukan gambar")
      setPhotoData(null)
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setPhotoError("Ukuran file terlalu besar (maksimal 5MB)")
      setPhotoData(null)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      
      const img = document.createElement('img')
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        const maxDimension = 1920
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
          setPhotoData(compressedDataUrl)
          setPhotoError("")
        }
      }
      img.src = dataUrl
    }
    reader.onerror = () => {
      setPhotoError("Gagal membaca file")
      setPhotoData(null)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveData = () => {
    const name = prompt("Nama draft (contoh: NIK - Nama Karyawan):", formData.nik && formData.nama ? `${formData.nik} - ${formData.nama}` : "")
    
    if (!name || !name.trim()) {
      alert("Nama draft tidak boleh kosong")
      return
    }

    try {
      setIsSaving(true)
      
      const newDraft: SavedDraft = {
        id: Date.now().toString(),
        name: name.trim(),
        selectedCompany,
        activities,
        formData,
        signatures,
        photoData,
        savedAt: new Date().toISOString()
      }
      
      const existingDrafts = loadAllDraftsFromStorage()
      const updatedDrafts = [...existingDrafts, newDraft]
      
      localStorage.setItem('leadershipActivityDrafts', JSON.stringify(updatedDrafts))
      setSavedDrafts(updatedDrafts)
      
      setTimeout(() => {
        setIsSaving(false)
        alert(`Draft "${name}" berhasil disimpan!`)
      }, 500)
    } catch (error) {
      console.error("[v0] Error saving data:", error)
      setIsSaving(false)
      alert("Gagal menyimpan draft. Pastikan browser Anda mendukung penyimpanan lokal.")
    }
  }

  const loadAllDraftsFromStorage = (): SavedDraft[] => {
    try {
      const savedDataString = localStorage.getItem('leadershipActivityDrafts')
      if (savedDataString) {
        return JSON.parse(savedDataString)
      }
    } catch (error) {
      console.error("[v0] Error loading drafts:", error)
    }
    return []
  }

  const loadAllDrafts = () => {
    const drafts = loadAllDraftsFromStorage()
    setSavedDrafts(drafts)
  }

  const handleLoadDraft = (draft: SavedDraft) => {
    if (confirm(`Memuat draft "${draft.name}" akan mengganti data yang sedang diisi. Lanjutkan?`)) {
      setSelectedCompany(draft.selectedCompany || "")
      setActivities(draft.activities || [])
      setFormData(draft.formData || {
        nik: "",
        departemen: "",
        nama: "",
        lokasi: "",
        jabatan: "",
        tanggal_masuk: "",
        masalah: "",
        tindak_lanjut: "",
        komitmen: "",
        catatan: "",
      })
      setSignatures(draft.signatures || {
        atasan: { data: null, nama: "", tanggal: "" },
        karyawan: { data: null, nama: "", tanggal: "" },
        pjo: { data: null, nama: "", tanggal: "" },
        hcga: { data: null, nama: "", tanggal: "" },
      })
      setPhotoData(draft.photoData || null)
      
      setShowDraftsList(false)
      alert(`Draft "${draft.name}" berhasil dimuat!`)
    }
  }

  const handleDeleteDraft = (draftId: string, draftName: string) => {
    if (confirm(`Hapus draft "${draftName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        const existingDrafts = loadAllDraftsFromStorage()
        const updatedDrafts = existingDrafts.filter(d => d.id !== draftId)
        
        localStorage.setItem('leadershipActivityDrafts', JSON.stringify(updatedDrafts))
        setSavedDrafts(updatedDrafts)
        
        alert(`Draft "${draftName}" berhasil dihapus`)
      } catch (error) {
        console.error("[v0] Error deleting draft:", error)
        alert("Gagal menghapus draft")
      }
    }
  }

  const toggleDraftsList = () => {
    setShowDraftsList(!showDraftsList)
    if (!showDraftsList) {
      loadAllDrafts()
    }
  }

  const openSignatureModal = (key: string) => {
    setCurrentSignatureKey(key)
    setSignatureModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <div className="max-w-4xl mx-auto bg-[#1a1a1a] rounded-xl shadow-2xl p-6 border border-[#2a2a2a]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-[#D4AF37]">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            size="sm"
            className="text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#2a2a2a]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>

          {selectedCompany && (
            <div className="w-24 h-24 relative">
              <Image
                src={companyLogos[selectedCompany as keyof typeof companyLogos] || "/placeholder.svg"}
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          )}

          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-[#D4AF37]">LEADERSHIP ACTIVITY</h1>
          </div>

          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-3 py-2 border border-[#D4AF37] rounded-lg bg-[#2a2a2a] text-[#D4AF37]"
          >
            <option value="">-- Pilih Perusahaan --</option>
            <option value="pt_sss">PT SSS</option>
            <option value="pt_gsm">PT GSM</option>
          </select>
        </div>

        <div className="mb-6 bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] p-4 rounded-lg border border-[#D4AF37]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex-1">
              <p className="text-sm text-slate-300">
                <span className="text-[#D4AF37] font-semibold">Draft Tersimpan:</span> {savedDrafts.length} draft
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleSaveData}
                disabled={isSaving}
                size="sm"
                className="bg-[#D4AF37] hover:bg-[#c49d2f] text-black"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Draft Baru
              </Button>
              <Button
                onClick={toggleDraftsList}
                size="sm"
                variant="outline"
                className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                {showDraftsList ? "Tutup" : "Lihat"} Daftar Draft ({savedDrafts.length})
              </Button>
            </div>
          </div>

          {showDraftsList && (
            <div className="mt-4 border-t border-[#3a3a3a] pt-4">
              <h3 className="text-[#D4AF37] font-semibold mb-3">Daftar Draft Tersimpan:</h3>
              {savedDrafts.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Belum ada draft tersimpan</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {savedDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-lg border border-[#3a3a3a] hover:border-[#D4AF37] transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-slate-200 font-medium">{draft.name}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          Disimpan: {new Date(draft.savedAt).toLocaleString('id-ID')}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {draft.selectedCompany === 'pt_sss' ? 'PT SSS' : draft.selectedCompany === 'pt_gsm' ? 'PT GSM' : 'Belum pilih perusahaan'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleLoadDraft(draft)}
                          size="sm"
                          className="bg-[#D4AF37] hover:bg-[#c49d2f] text-black"
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Muat
                        </Button>
                        <Button
                          onClick={() => handleDeleteDraft(draft.id, draft.name)}
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity Type */}
        <div className="mb-6">
          <h2 className="bg-[#D4AF37] text-black px-4 py-2 font-semibold">ACTIVITY</h2>
          <div className="border border-[#D4AF37] border-t-0 p-4 flex flex-wrap gap-4">
            {["Coaching", "Directing", "Mentoring", "Motivating / Counseling"].map((activity) => (
              <label
                key={activity}
                className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-2 rounded-lg border border-[#3a3a3a] text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={activities.includes(activity)}
                  onChange={() => handleActivityChange(activity)}
                  className="accent-[#D4AF37]"
                />
                <span>{activity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Employee Data */}
        <div className="mb-6">
          <h2 className="bg-[#D4AF37] text-black px-4 py-2 font-semibold">DATA KARYAWAN</h2>
          <div className="border border-[#D4AF37] border-t-0 p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">NIK:</label>
              <input
                type="text"
                value={formData.nik}
                onChange={(e) => setFormData((prev) => ({ ...prev, nik: e.target.value }))}
                className="w-full px-3 py-2 border border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Departemen:</label>
              <input
                type="text"
                value={formData.departemen}
                onChange={(e) => setFormData((prev) => ({ ...prev, departemen: e.target.value }))}
                className="w-full px-3 py-2 border border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Nama:</label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
                className="w-full px-3 py-2 border border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Lokasi Kerja:</label>
              <input
                type="text"
                value={formData.lokasi}
                onChange={(e) => setFormData((prev) => ({ ...prev, lokasi: e.target.value }))}
                className="w-full px-3 py-2 border border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Jabatan:</label>
              <input
                type="text"
                value={formData.jabatan}
                onChange={(e) => setFormData((prev) => ({ ...prev, jabatan: e.target.value }))}
                className="w-full px-3 py-2 border border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Tanggal Masuk:</label>
              <input
                type="text"
                value={formData.tanggal_masuk}
                onChange={(e) => setFormData((prev) => ({ ...prev, tanggal_masuk: e.target.value }))}
                className="w-full px-3 py-2 border border-[#3a3a3a] rounded-lg bg-[#2a2a2a] text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Problem, Solution, Commitment */}
        {[
          { key: "masalah", title: "MASALAH", placeholder: "Jelaskan masalah yang dihadapi..." },
          {
            key: "tindak_lanjut",
            title: "TINDAK LANJUT / SOLUSI",
            placeholder: "Jelaskan tindak lanjut atau solusi...",
          },
          { key: "komitmen", title: "KOMITMEN", placeholder: "Jelaskan komitmen yang disepakati..." },
        ].map((section) => (
          <div key={section.key} className="mb-6">
            <h2 className="bg-[#D4AF37] text-black px-4 py-2 font-semibold">{section.title}</h2>
            <div className="border border-[#D4AF37] border-t-0 p-4">
              <textarea
                value={formData[section.key as keyof typeof formData]}
                onChange={(e) => setFormData((prev) => ({ ...prev, [section.key]: e.target.value }))}
                placeholder={section.placeholder}
                className="w-full px-3 py-2 border border-[#3a3a3a] rounded-lg h-24 resize-vertical bg-[#2a2a2a] text-slate-200 placeholder:text-slate-500"
              />
            </div>
          </div>
        ))}

        {/* Notes */}
        <div className="mb-6">
          <label className="block mb-2 text-slate-300">
            <span className="font-medium">Catatan:</span>
            <input
              type="text"
              value={formData.catatan}
              onChange={(e) => setFormData((prev) => ({ ...prev, catatan: e.target.value }))}
              placeholder="Tambahkan catatan jika diperlukan"
              className="ml-2 px-3 py-2 border border-[#3a3a3a] rounded-lg w-3/4 bg-[#2a2a2a] text-slate-200 placeholder:text-slate-500"
            />
          </label>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Object.entries({
            atasan: { title: "Dibuat oleh,", subtitle: "Atasan Langsung" },
            karyawan: { title: "Diterima oleh,", subtitle: "Karyawan" },
            pjo: { title: "Diketahui oleh,", subtitle: "PJO / Mgr. / GM / Dir." },
            hcga: { title: "HCGA", subtitle: "Dic / Pic" },
          }).map(([key, info]) => (
            <div key={key} className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a]">
              <p className="font-semibold text-[#D4AF37]">{info.title}</p>
              <p className="text-sm text-slate-400 mb-3">{info.subtitle}</p>

              {signatures[key as keyof typeof signatures].data ? (
                <div className="mb-3">
                  <div className="border-2 border-[#D4AF37] rounded-lg bg-white p-2 mb-2">
                    <Image
                      src={signatures[key as keyof typeof signatures].data || "/placeholder.svg"}
                      alt="Signature"
                      width={300}
                      height={100}
                      className="w-full h-24 object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openSignatureModal(key)}
                      className="flex-1 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => clearSignature(key)}
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => openSignatureModal(key)}
                  className="w-full mb-3 bg-[#D4AF37] hover:bg-[#c49d2f] text-black"
                >
                  ✍️ Tanda Tangan
                </Button>
              )}

              <input
                type="text"
                placeholder="Nama"
                value={signatures[key as keyof typeof signatures].nama}
                onChange={(e) =>
                  setSignatures((prev) => ({
                    ...prev,
                    [key]: { ...prev[key as keyof typeof signatures], nama: e.target.value },
                  }))
                }
                className="w-full px-2 py-1 border border-[#3a3a3a] rounded mb-2 text-sm bg-[#1a1a1a] text-slate-200"
              />
              <input
                type="text"
                placeholder="Tanggal"
                value={signatures[key as keyof typeof signatures].tanggal}
                onChange={(e) =>
                  setSignatures((prev) => ({
                    ...prev,
                    [key]: { ...prev[key as keyof typeof signatures], tanggal: e.target.value },
                  }))
                }
                className="w-full px-2 py-1 border border-[#3a3a3a] rounded text-sm bg-[#1a1a1a] text-slate-200"
              />
            </div>
          ))}
        </div>

        {/* Photo Upload */}
        <div className="mb-6 bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a]">
          <h3 className="font-semibold mb-3 text-lg border-b-2 border-[#D4AF37] pb-2 text-[#D4AF37]">
            BUKTI PERTEMUAN (FOTO)
          </h3>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="w-full px-3 py-2 border border-[#3a3a3a] rounded-lg mb-2 bg-[#1a1a1a] text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#D4AF37] file:text-black file:cursor-pointer"
          />
          {photoError && <p className="text-red-400 text-sm mb-2">{photoError}</p>}
          {photoData && (
            <div className="mt-3">
              <div className="relative w-full max-w-md mx-auto">
                <Image
                  src={photoData || "/placeholder.svg"}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="border border-[#3a3a3a] rounded-lg"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setPhotoData(null)}
                className="mt-2 bg-red-600 hover:bg-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Hapus Foto
              </Button>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="text-center">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#D4AF37] hover:bg-[#c49d2f] text-black px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Membuat PDF...
              </>
            ) : (
              <>
                📄 Simpan sebagai PDF
              </>
            )}
          </Button>
        </div>

        <div className="text-center mt-6 text-slate-500 text-sm">
          <p>Form Leadership Activity</p>
          <p>- Yan -</p>
        </div>
      </div>

      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSave={handleSaveSignature}
        title={`Tanda Tangan - ${
          currentSignatureKey === "atasan"
            ? "Atasan Langsung"
            : currentSignatureKey === "karyawan"
              ? "Karyawan"
              : currentSignatureKey === "pjo"
                ? "PJO / Mgr. / GM / Dir."
                : "HCGA"
        }`}
      />
    </div>
  )
}
