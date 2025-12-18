/**
 * Cloudflare R2 Storage - DISABLED
 * R2 memiliki masalah kompatibilitas dengan Next.js edge runtime
 * Gunakan Vercel Blob atau Google Drive sebagai gantinya
 */

export interface R2UploadResult {
  key: string
  url: string
  size: number
  contentType: string
}

export async function uploadToR2(file: File, folderPath: string, fileName: string): Promise<R2UploadResult> {
  throw new Error(
    "R2 storage tidak tersedia. Gunakan Vercel Blob atau Google Drive. Set STORAGE_PROVIDER=vercel-blob di environment variables.",
  )
}
