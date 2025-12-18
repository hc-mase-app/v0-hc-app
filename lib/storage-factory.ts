/**
 * Storage Factory - Abstraction Layer
 * Switch between storage providers dengan mudah
 */

import { uploadToR2 } from "./r2-storage"
import { uploadToGoogleDrive } from "./google-drive-storage"
import { uploadToBlob } from "./vercel-blob-storage"

export type StorageProvider = "r2" | "google-drive" | "vercel-blob"

export interface UnifiedUploadResult {
  key: string
  url: string
  size: number
  contentType: string
  provider: StorageProvider
}

/**
 * Get configured storage provider from environment
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || "vercel-blob"

  console.log("[v0] Storage provider configured:", provider)

  return provider as StorageProvider
}

/**
 * Upload file using configured storage provider
 */
export async function uploadFile(file: File, folderPath: string, fileName: string): Promise<UnifiedUploadResult> {
  const provider = getStorageProvider()

  console.log("[v0] Using storage provider:", provider)

  switch (provider) {
    case "google-drive": {
      const result = await uploadToGoogleDrive(file, folderPath, fileName)
      return {
        key: result.fileId,
        url: result.webViewLink,
        size: result.size,
        contentType: result.mimeType,
        provider: "google-drive",
      }
    }

    case "vercel-blob": {
      const result = await uploadToBlob(file, folderPath, fileName)
      return {
        key: result.key,
        url: result.url,
        size: result.size,
        contentType: result.contentType,
        provider: "vercel-blob",
      }
    }

    case "r2":
    default: {
      const result = await uploadToR2(file, folderPath, fileName)
      return {
        key: result.key,
        url: result.url,
        size: result.size,
        contentType: result.contentType,
        provider: "r2",
      }
    }
  }
}
