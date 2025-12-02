import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    if (!category) {
      return NextResponse.json({ error: "Category parameter required" }, { status: 400 })
    }

    const documents = await sql`
      SELECT 
        id,
        name,
        drive_id as "driveId",
        category,
        size,
        uploaded_at as "uploadedAt",
        created_at as "createdAt"
      FROM documents
      WHERE category = ${category}
      ORDER BY uploaded_at DESC
      LIMIT 100
    `

    return NextResponse.json(
      { documents },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
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
