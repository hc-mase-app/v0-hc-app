import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const publicR2Url = "https://pub-1dce790269ec4d33ad6a101fbac473d2.r2.dev"

function generateR2Url(key: string): string {
  return `${publicR2Url}/${key}`
}

async function getDocumentsFromR2(category: string) {
  try {
    const metadataUrl = `/r2-documents/${category}/documents.json`
    const response = await fetch(metadataUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    })

    if (response.ok) {
      const data = await response.json()
      return data.documents || []
    }
  } catch (error) {
    // Silent fail
  }

  return []
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const key = searchParams.get("key")

    // If key is provided, return direct URL
    if (key) {
      const url = generateR2Url(key)
      return NextResponse.json({ url })
    }

    // List documents in category folder
    if (!category) {
      return NextResponse.json({ error: "Category parameter required" }, { status: 400 })
    }

    const documents = await getDocumentsFromR2(category)

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
