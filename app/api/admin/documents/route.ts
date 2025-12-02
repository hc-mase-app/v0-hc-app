import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Fetch all documents or by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let documents
    if (category) {
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
        ORDER BY created_at DESC
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
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("GET documents error:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// POST - Add new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, driveId, category, subfolder, size } = body

    if (!name || !driveId || !category) {
      return NextResponse.json({ error: "Missing required fields: name, driveId, category" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO documents (name, drive_id, category, subfolder, size)
      VALUES (${name}, ${driveId}, ${category}, ${subfolder || null}, ${size || null})
      RETURNING 
        id,
        name,
        drive_id as "driveId",
        category,
        subfolder,
        size,
        uploaded_at as "uploadedAt",
        created_at as "createdAt"
    `

    return NextResponse.json({ document: result[0] }, { status: 201 })
  } catch (error) {
    console.error("POST document error:", error)

    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json({ error: "Document with this Google Drive ID already exists" }, { status: 409 })
    }

    return NextResponse.json(
      { error: "Failed to create document", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// PUT - Update document
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, driveId, category, subfolder, size } = body

    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE documents
      SET 
        name = COALESCE(${name}, name),
        drive_id = COALESCE(${driveId}, drive_id),
        category = COALESCE(${category}, category),
        subfolder = COALESCE(${subfolder}, subfolder),
        size = COALESCE(${size}, size),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING 
        id,
        name,
        drive_id as "driveId",
        category,
        subfolder,
        size,
        uploaded_at as "uploadedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document: result[0] })
  } catch (error) {
    console.error("PUT document error:", error)
    return NextResponse.json(
      { error: "Failed to update document", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// DELETE - Remove document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM documents
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Document deleted" })
  } catch (error) {
    console.error("DELETE document error:", error)
    return NextResponse.json(
      { error: "Failed to delete document", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
