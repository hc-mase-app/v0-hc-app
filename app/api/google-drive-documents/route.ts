import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const subfolder = searchParams.get("subfolder")

    if (!category) {
      console.error("[v0] Missing category parameter in GET /api/google-drive-documents")
      return NextResponse.json({ error: "Category parameter required" }, { status: 400 })
    }

    let documents
    if (subfolder) {
      console.log(`[v0] Fetching documents for category=${category}, subfolder=${subfolder}`)
      documents = await sql`
        SELECT 
          id,
          name,
          drive_id as "driveId",
          category,
          subfolder,
          size,
          uploaded_at as "uploadedAt",
          created_at as "createdAt"
        FROM documents
        WHERE category = ${category} AND subfolder = ${subfolder}
        ORDER BY uploaded_at DESC
        LIMIT 100
      `
      console.log(`[v0] Found ${documents.length} documents with subfolder filter`)
    } else {
      console.log(`[v0] Fetching documents for category=${category} (no subfolder filter)`)
      documents = await sql`
        SELECT 
          id,
          name,
          drive_id as "driveId",
          category,
          subfolder,
          size,
          uploaded_at as "uploadedAt",
          created_at as "createdAt"
        FROM documents
        WHERE category = ${category}
        ORDER BY uploaded_at DESC
        LIMIT 100
      `
      console.log(`[v0] Found ${documents.length} documents without subfolder filter`)
    }

    return NextResponse.json(
      { documents },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          Pragma: "no-cache",
        },
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] GET /api/google-drive-documents ERROR:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : null,
    })

    return NextResponse.json(
      {
        error: "Failed to fetch documents from database",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : "Database connection error. Please contact admin.",
      },
      { status: 500 },
    )
  }
}
