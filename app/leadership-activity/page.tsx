"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ArrowLeft, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"

export default function LeadershipActivityPage() {
  const router = useRouter()
  const [selectedCompany, setSelectedCompany] = useState("")
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState("")

  // Form data states
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

  // Signature states
  const [signatures, setSignatures] = useState({
    atasan: { data: null as string | null, nama: "", tanggal: "" },
    karyawan: { data: null as string | null, nama: "", tanggal: "" },
    pjo: { data: null as string | null, nama: "", tanggal: "" },
    hcga: { data: null as string | null, nama: "", tanggal: "" },
  })

  const canvasRefs = {
    atasan: useRef<HTMLCanvasElement>(null),
    karyawan: useRef<HTMLCanvasElement>(null),
    pjo: useRef<HTMLCanvasElement>(null),
    hcga: useRef<HTMLCanvasElement>(null),
  }

  const [isDrawing, setIsDrawing] = useState({
    atasan: false,
    karyawan: false,
    pjo: false,
    hcga: false,
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

    // Initialize all canvases with high resolution
    Object.values(canvasRefs).forEach((ref) => {
      const canvas = ref.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set high resolution for better quality
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      // Set drawing style
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
    })
  }, [])

  const getCoordinates = (
    canvas: HTMLCanvasElement,
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    return { x, y }
  }

  const startDrawing = (
    key: keyof typeof canvasRefs,
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault()
    const canvas = canvasRefs[key].current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing((prev) => ({ ...prev, [key]: true }))

    const { x, y } = getCoordinates(canvas, e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (
    key: keyof typeof canvasRefs,
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault()
    if (!isDrawing[key]) return

    const canvas = canvasRefs[key].current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(canvas, e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = (key: keyof typeof canvasRefs) => {
    setIsDrawing((prev) => ({ ...prev, [key]: false }))
  }

  const clearSignature = (key: keyof typeof canvasRefs) => {
    const canvas = canvasRefs[key].current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatures((prev) => ({
      ...prev,
      [key]: { ...prev[key], data: null },
    }))
  }

  const saveSignature = (key: keyof typeof canvasRefs) => {
    const canvas = canvasRefs[key].current
    if (!canvas) return

    const dataUrl = canvas.toDataURL()
    setSignatures((prev) => ({
      ...prev,
      [key]: { ...prev[key], data: dataUrl },
    }))
    alert(`Tanda tangan ${key} disimpan!`)
  }

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if (!validTypes.includes(file.type)) {
      setPhotoError("Format file tidak didukung. Harap pilih file gambar (JPEG, PNG, atau GIF).")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setPhotoError("Ukuran file terlalu besar. Maksimal 5MB.")
      return
    }

    setPhotoError("")
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotoData(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Export to print/PDF
  const handleExport = () => {
    const printContent = createPrintContent()
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Tidak dapat membuka jendela print. Pastikan popup tidak diblokir.")
      return
    }

    printWindow.document.write(printContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const createPrintContent = () => {
    const logoSrc = selectedCompany ? companyLogos[selectedCompany as keyof typeof companyLogos] : ""

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Leadership Activity - ${formData.nama || "Karyawan"}</title>
    <style>
        @media print { @page { margin: 15mm; } body { margin: 0; font-size: 12px; } }
        body { font-family: Arial, sans-serif; line-height: 1.4; margin: 20px; color: #000; }
        .header { display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 15px; }
        .logo { margin-right: 20px; max-width: 80px; max-height: 80px; }
        .title { text-align: center; font-size: 18px; font-weight: bold; color: #2c3e50; flex: 1; }
        .section { margin-bottom: 15px; }
        .section-title { background: #e0e0e0; padding: 8px; font-weight: bold; border: 1px solid #000; }
        .section-content { border: 1px solid #000; padding: 8px; border-top: none; min-height: 60px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #000; }
        .grid-item { background: white; padding: 8px; border: 1px solid #000; }
        .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
        .signature-box { text-align: center; width: 23%; }
        .signature-img { max-width: 150px; max-height: 60px; margin: 10px 0; }
        .photo-section { text-align: center; margin-top: 30px; page-break-inside: avoid; }
        .photo-img { max-width: 500px; max-height: 400px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        ${logoSrc ? `<img src="${logoSrc}" class="logo" alt="Logo">` : ""}
        <div class="title">FORMULIR LEADERSHIP ACTIVITY</div>
    </div>
    
    <div class="section">
        <div class="section-title">ACTIVITY</div>
        <div class="section-content">
            ${activities.length > 0 ? activities.map((a) => `☑ ${a}`).join(" ") : "□ Coaching □ Directing □ Mentoring □ Motivating/Counseling"}
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">DATA KARYAWAN</div>
        <div class="grid">
            <div class="grid-item"><strong>NIK:</strong> ${formData.nik}</div>
            <div class="grid-item"><strong>Departemen:</strong> ${formData.departemen}</div>
            <div class="grid-item"><strong>Nama:</strong> ${formData.nama}</div>
            <div class="grid-item"><strong>Lokasi Kerja:</strong> ${formData.lokasi}</div>
            <div class="grid-item"><strong>Jabatan:</strong> ${formData.jabatan}</div>
            <div class="grid-item"><strong>Tanggal Masuk:</strong> ${formData.tanggal_masuk}</div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">MASALAH</div>
        <div class="section-content">${formData.masalah}</div>
    </div>
    
    <div class="section">
        <div class="section-title">TINDAK LANJUT / SOLUSI</div>
        <div class="section-content">${formData.tindak_lanjut}</div>
    </div>
    
    <div class="section">
        <div class="section-title">KOMITMEN</div>
        <div class="section-content">${formData.komitmen}</div>
    </div>
    
    <div class="section">
        <div class="section-title">CATATAN</div>
        <div class="section-content">${formData.catatan}</div>
    </div>
    
    <div class="signatures">
        ${Object.entries(signatures)
          .map(([key, sig]) => {
            const titles = {
              atasan: { title: "Dibuat oleh,", subtitle: "Atasan Langsung" },
              karyawan: { title: "Diterima oleh,", subtitle: "Karyawan" },
              pjo: { title: "Diketahui oleh,", subtitle: "PJO / Mgr. / GM / Dir." },
              hcga: { title: "HCGA", subtitle: "Dic / Pic" },
            }
            return `
            <div class="signature-box">
                <p><strong>${titles[key as keyof typeof titles].title}</strong></p>
                <p>${titles[key as keyof typeof titles].subtitle}</p>
                ${sig.data ? `<img src="${sig.data}" class="signature-img" alt="Signature">` : '<div style="height: 60px;"></div>'}
                <p style="border-top: 1px solid #000; padding-top: 5px;">${sig.nama}</p>
                <p>${sig.tanggal}</p>
            </div>
          `
          })
          .join("")}
    </div>
    
    ${
      photoData
        ? `
    <div class="photo-section">
        <h2>BUKTI PERTEMUAN (FOTO)</h2>
        <img src="${photoData}" class="photo-img" alt="Bukti Foto">
    </div>
    `
        : ""
    }
</body>
</html>
    `
  }

  const handleActivityChange = (activity: string) => {
    setActivities((prev) => (prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]))
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          {Object.entries({
            atasan: { title: "Dibuat oleh,", subtitle: "Atasan Langsung" },
            karyawan: { title: "Diterima oleh,", subtitle: "Karyawan" },
            pjo: { title: "Diketahui oleh,", subtitle: "PJO / Mgr. / GM / Dir." },
            hcga: { title: "HCGA", subtitle: "Dic / Pic" },
          }).map(([key, info]) => (
            <div key={key} className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a]">
              <p className="font-semibold text-[#D4AF37]">{info.title}</p>
              <p className="text-sm text-slate-400 mb-2">{info.subtitle}</p>

              <canvas
                ref={canvasRefs[key as keyof typeof canvasRefs]}
                className="border border-[#3a3a3a] bg-white rounded mb-2 w-full touch-none cursor-crosshair"
                style={{ width: "100%", height: "100px" }}
                onMouseDown={(e) => startDrawing(key as keyof typeof canvasRefs, e)}
                onMouseMove={(e) => draw(key as keyof typeof canvasRefs, e)}
                onMouseUp={() => stopDrawing(key as keyof typeof canvasRefs)}
                onMouseLeave={() => stopDrawing(key as keyof typeof canvasRefs)}
                onTouchStart={(e) => startDrawing(key as keyof typeof canvasRefs, e)}
                onTouchMove={(e) => draw(key as keyof typeof canvasRefs, e)}
                onTouchEnd={() => stopDrawing(key as keyof typeof canvasRefs)}
              />

              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => clearSignature(key as keyof typeof canvasRefs)}
                  className="flex-1 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                >
                  Hapus
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => saveSignature(key as keyof typeof canvasRefs)}
                  className="flex-1 bg-[#D4AF37] text-black hover:bg-[#c49d2f]"
                >
                  Simpan
                </Button>
              </div>

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
            className="bg-[#D4AF37] hover:bg-[#c49d2f] text-black px-8 py-3 text-lg font-semibold"
          >
            📄 Simpan sebagai PDF
          </Button>
        </div>

        <div className="text-center mt-6 text-slate-500 text-sm">
          <p>Form Leadership Activity</p>
          <p>- Yan -</p>
        </div>
      </div>
    </div>
  )
}
