/**
 * Vercel Blob Storage Integration
 * Solusi paling mudah untuk Vercel deployment
 *
 * Free Tier: 10GB storage
 *
 * Setup:
 * 1. Tidak perlu setup manual
 * 2. Vercel otomatis generate BLOB_READ_WRITE_TOKEN
 * 3. Tinggal pakai!
 */

import { put, del, list } from "@vercel/blob"

export interface BlobUploadResult {
  key: string
  url: string
  size: number
  contentType: string
  downloadUrl: string
}

/**
 * Upload file to Vercel Blob
 */
export async function uploadToBlob(file: File, folderPath: string, fileName: string): Promise<BlobUploadResult> {
  try {
    const filePath = `${folderPath}/${fileName}`

    console.log("[v0] Starting Vercel Blob upload:", {
      path: filePath,
      fileSize: file.size,
      fileType: file.type,
    })

    const blob = await put(filePath, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
      addRandomSuffix: false, // Gunakan nama file yang sudah kita set
    })

    console.log("[v0] Vercel Blob upload successful:", blob.url)

    return {
      key: filePath,
      url: blob.url,
      size: file.size,
      contentType: file.type || "application/octet-stream",
      downloadUrl: blob.downloadUrl,
    }
  } catch (error) {
    console.error("[v0] Vercel Blob upload error:", error)
    throw new Error(`Failed to upload to Vercel Blob: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Delete file from Vercel Blob
 */
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url)
    console.log("[v0] Vercel Blob delete successful:", url)
  } catch (error) {
    console.error("[v0] Vercel Blob delete error:", error)
    throw error
  }
}

/**
 * List all files in Vercel Blob with optional prefix filter
 */
export async function listBlobFiles(prefix?: string): Promise<any[]> {
  try {
    const { blobs } = await list({
      prefix: prefix || "",
    })
    return blobs
  } catch (error) {
    console.error("[v0] Vercel Blob list error:", error)
    throw error
  }
}

/**
 * Get total storage usage from Vercel Blob
 */
export async function getBlobStorageUsage(): Promise<{ totalSize: number; fileCount: number }> {
  try {
    const { blobs } = await list()
    const totalSize = blobs.reduce((sum, blob) => sum + blob.size, 0)
    return {
      totalSize,
      fileCount: blobs.length,
    }
  } catch (error) {
    console.error("[v0] Vercel Blob storage usage error:", error)
    throw error
  }
}
