export const runtime = "nodejs"

import type { NextRequest } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const key = searchParams.get("key")

  if (!key) {
    return Response.json({ error: "Missing key parameter" }, { status: 400 })
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return Response.json({ error: "R2 credentials not configured" }, { status: 500 })
  }

  try {
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      return Response.json({ error: "File not found" }, { status: 404 })
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }

    const buffer = Buffer.concat(chunks)

    // Get filename from key
    const filename = key.split("/").pop() || "download"

    // Return file with proper headers for download
    return new Response(buffer, {
      headers: {
        "Content-Type": response.ContentType || "application/pdf",
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("R2 download error:", error)
    return Response.json(
      { error: "Failed to download file", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
