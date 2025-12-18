import { NextResponse } from "next/server"
import { getBlobStorageUsage } from "@/lib/vercel-blob-storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const usage = await getBlobStorageUsage()

    const FREE_TIER_LIMIT = 10 * 1024 * 1024 * 1024 // 10GB in bytes
    const usagePercentage = (usage.totalSize / FREE_TIER_LIMIT) * 100

    return NextResponse.json({
      success: true,
      data: {
        totalSize: usage.totalSize,
        fileCount: usage.fileCount,
        freeTierLimit: FREE_TIER_LIMIT,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        shouldAlert: usagePercentage >= 90,
      },
    })
  } catch (error) {
    console.error("[v0] Storage usage error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get storage usage",
      },
      { status: 500 },
    )
  }
}
