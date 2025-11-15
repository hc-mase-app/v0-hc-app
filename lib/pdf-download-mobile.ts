export async function downloadPDFCapacitor(pdfDataUri: string, fileName: string) {
  try {
    // Dynamic import untuk menghindari error jika Capacitor tidak tersedia
    const { Filesystem, Directory } = await import("@capacitor/filesystem")

    // Convert data URI ke base64
    const base64Data = pdfDataUri.split(",")[1]

    // Simpan file ke Documents directory
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    })

    // Optional: Share file
    try {
      const { Share } = await import("@capacitor/share")
      await Share.share({
        title: "Tiket Perjalanan Karyawan",
        text: `Tiket perjalanan: ${fileName}`,
        dialogTitle: "Bagikan tiket",
      })
    } catch {
      // Share not available, continue silently
      console.log("[v0] Share plugin not available")
    }

    console.log("[v0] PDF saved to Documents:", fileName)
    return true
  } catch (error) {
    console.error("[v0] Capacitor file download error:", error)
    throw error
  }
}

export function isCapacitorAvailable(): boolean {
  if (typeof window === "undefined") return false
  return !!(window as any).Capacitor
}
