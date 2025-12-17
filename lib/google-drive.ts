// Google Drive API Integration
// Requires: GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, GOOGLE_DRIVE_FOLDER_ID

interface UploadResult {
  fileId: string
  fileUrl: string
  fileName: string
  fileType: string
}

export async function uploadToGoogleDrive(file: File, folderPath: string): Promise<UploadResult> {
  try {
    // Get Google Drive credentials from environment
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (!clientEmail || !privateKey || !parentFolderId) {
      throw new Error("Google Drive credentials not configured")
    }

    // Create JWT token for Service Account authentication
    const jwtToken = await createJWT(clientEmail, privateKey)

    // Get or create folder structure (Site/Department/Month-Year)
    const folderId = await ensureFolderStructure(jwtToken, parentFolderId, folderPath)

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create file metadata
    const metadata = {
      name: file.name,
      parents: [folderId],
      mimeType: file.type,
    }

    // Upload file using multipart request
    const boundary = "-------314159265358979323846"
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${file.type}\r\n` +
      "Content-Transfer-Encoding: base64\r\n\r\n" +
      buffer.toString("base64") +
      closeDelimiter

    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Drive upload failed: ${error}`)
    }

    const result = await response.json()

    // Set file permissions to anyone with link can view
    await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    })

    return {
      fileId: result.id,
      fileUrl: `https://drive.google.com/file/d/${result.id}/view`,
      fileName: file.name,
      fileType: file.type,
    }
  } catch (error) {
    console.error("[v0] Google Drive upload error:", error)
    throw error
  }
}

async function createJWT(clientEmail: string, privateKey: string): Promise<string> {
  // JWT Header
  const header = {
    alg: "RS256",
    typ: "JWT",
  }

  // JWT Claim Set
  const now = Math.floor(Date.now() / 1000)
  const claimSet = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }

  // Encode header and claim set
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet))
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`

  // Sign with private key
  const crypto = await import("crypto")
  const sign = crypto.createSign("RSA-SHA256")
  sign.update(signatureInput)
  const signature = sign.sign(privateKey, "base64")
  const encodedSignature = base64UrlEncode(Buffer.from(signature, "base64"))

  const jwt = `${signatureInput}.${encodedSignature}`

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

async function ensureFolderStructure(accessToken: string, parentFolderId: string, folderPath: string): Promise<string> {
  const folders = folderPath.split("/").filter(Boolean)
  let currentParentId = parentFolderId

  for (const folderName of folders) {
    // Check if folder exists
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and '${currentParentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const searchData = await searchResponse.json()

    if (searchData.files && searchData.files.length > 0) {
      // Folder exists
      currentParentId = searchData.files[0].id
    } else {
      // Create folder
      const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [currentParentId],
        }),
      })

      const createData = await createResponse.json()
      currentParentId = createData.id
    }
  }

  return currentParentId
}

function base64UrlEncode(input: string | Buffer): string {
  const base64 = Buffer.from(input).toString("base64")
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}
