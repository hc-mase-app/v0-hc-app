// Cloudflare R2 Configuration and Helper Functions

interface R2Document {
  key: string
  name: string
  size: number
  lastModified: Date
  category: string
}

// Document categories mapping
export const DOCUMENT_CATEGORIES = {
  "induksi-karyawan": "Induksi Karyawan",
  form: "FORM",
  "sop-ik": "SOP & IK",
  "internal-memo": "Internal Memo",
  "bisnis-proses": "Bisnis Proses",
  sk: "SK",
} as const

export type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES

// Helper to generate signed URL for R2 object
export async function getR2SignedUrl(objectKey: string): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY

  if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 credentials not configured")
  }

  // For now, return a public URL format
  // In production, implement proper AWS S3 signature v4
  const publicUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${objectKey}`

  return publicUrl
}

// Check if file is PDF
export function isPDF(filename: string): boolean {
  return filename.toLowerCase().endsWith(".pdf")
}

// Check if file is Office document
export function isOfficeDocument(filename: string): boolean {
  const ext = filename.toLowerCase()
  return (
    ext.endsWith(".doc") ||
    ext.endsWith(".docx") ||
    ext.endsWith(".xls") ||
    ext.endsWith(".xlsx") ||
    ext.endsWith(".ppt") ||
    ext.endsWith(".pptx")
  )
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}
