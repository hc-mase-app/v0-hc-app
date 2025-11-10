import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"

export function isCapacitor(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor
}

function isPreviewEnvironment(): boolean {
  if (typeof window === "undefined") return false
  const hostname = window.location.hostname
  return hostname.includes("vusercontent.net") || hostname.includes("preview") || hostname.includes("localhost")
}

export async function downloadPDF(pdfData: string | Blob, filename: string): Promise<void> {
  try {
    if (isCapacitor() && !isPreviewEnvironment()) {
      // Mobile: Gunakan Capacitor Filesystem
      let base64Data: string

      if (pdfData instanceof Blob) {
        // Convert Blob to base64
        base64Data = await blobToBase64(pdfData)
      } else if (typeof pdfData === "string") {
        // jsPDF output string is already base64
        base64Data = pdfData
      } else {
        throw new Error("Invalid PDF data type")
      }

      // Remove data URL prefix if exists
      base64Data = base64Data.replace(/^data:application\/pdf;base64,/, "")

      // Save file to device
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents,
      })

      console.log("[v0] PDF saved to:", result.uri)

      // Share the file
      await Share.share({
        title: "Download PDF",
        text: `File ${filename} berhasil disimpan`,
        url: result.uri,
        dialogTitle: "Simpan atau Bagikan PDF",
      })
    } else {
      // Web: Gunakan blob URL download
      let blob: Blob

      if (pdfData instanceof Blob) {
        blob = pdfData
      } else if (typeof pdfData === "string") {
        // Convert base64 to blob
        const byteCharacters = atob(pdfData.replace(/^data:application\/pdf;base64,/, ""))
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        blob = new Blob([byteArray], { type: "application/pdf" })
      } else {
        throw new Error("Invalid PDF data type")
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error("[v0] Error downloading PDF:", error)
    throw error
  }
}

export async function downloadExcel(excelBuffer: ArrayBuffer, filename: string): Promise<void> {
  console.log("[v0] ========== DOWNLOAD EXCEL START ==========")
  console.log("[v0] Filename:", filename)
  console.log("[v0] Buffer size:", excelBuffer.byteLength, "bytes")
  console.log("[v0] Is Capacitor:", isCapacitor())
  console.log("[v0] Is Preview Environment:", isPreviewEnvironment())

  try {
    if (!excelBuffer || excelBuffer.byteLength === 0) {
      throw new Error("Invalid or empty Excel buffer")
    }

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    console.log("[v0] Blob created, size:", blob.size, "bytes")

    if (isCapacitor() && !isPreviewEnvironment()) {
      // Mobile: Convert to base64 and save
      console.log("[v0] Using Capacitor for mobile download")
      const base64Data = await blobToBase64(blob)
      const base64Clean = base64Data.replace(
        /^data:application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet;base64,/,
        "",
      )

      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Clean,
        directory: Directory.Documents,
      })

      console.log("[v0] Excel saved to:", result.uri)

      // Share the file
      await Share.share({
        title: "Download Excel",
        text: `File ${filename} berhasil disimpan`,
        url: result.uri,
        dialogTitle: "Simpan atau Bagikan Excel",
      })
      console.log("[v0] Share dialog shown")
    } else {
      // Web: Gunakan blob URL download
      console.log("[v0] Using web browser download")
      const url = URL.createObjectURL(blob)
      console.log("[v0] Blob URL created:", url)

      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.style.display = "none"
      document.body.appendChild(link)
      console.log("[v0] Download link appended to body")

      link.click()
      console.log("[v0] Download link clicked")

      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        console.log("[v0] Download link cleaned up")
      }, 1000)
    }

    console.log("[v0] ========== DOWNLOAD EXCEL COMPLETE ==========")
  } catch (error) {
    console.error("[v0] ========== DOWNLOAD EXCEL ERROR ==========")
    console.error("[v0] Error downloading Excel:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] ===========================================")
    throw error
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to convert blob to base64"))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
