import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export const dynamic = "force-dynamic"
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const subfolder = searchParams.get("subfolder")

    if (!category) {
      return NextResponse.json({ error: "Category parameter required" }, { status: 400 })
    }

    let documents
    if (subfolder) {
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
    } else {
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
    return NextResponse.json(
      {
        error: "Failed to fetch documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
