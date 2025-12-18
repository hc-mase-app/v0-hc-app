/**
 * Google Drive Storage Integration
 * Menggunakan Google Drive API dengan Personal Gmail Account (GRATIS)
 *
 * Setup Steps:
 * 1. Buat project di Google Cloud Console: https://console.cloud.google.com
 * 2. Enable Google Drive API
 * 3. Buat OAuth 2.0 Credentials (Web Application)
 * 4. Tambahkan authorized redirect URIs
 * 5. Buat Service Account untuk server-side upload
 * 6. Download JSON key dan convert ke base64
 *
 * Environment Variables Required:
 * - GOOGLE_DRIVE_CLIENT_ID
 * - GOOGLE_DRIVE_CLIENT_SECRET
 * - GOOGLE_DRIVE_REFRESH_TOKEN (atau Service Account JSON)
 * - GOOGLE_DRIVE_FOLDER_ID (Optional: Folder khusus untuk evidence)
 */

export interface GoogleDriveUploadResult {
  fileId: string
  fileName: string
  webViewLink: string
  webContentLink: string
  size: number
  mimeType: string
}

interface GoogleDriveAuth {
  access_token: string
  expires_in: number
}

/**
 * Get OAuth2 Access Token using Refresh Token
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Drive credentials not configured")
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`)
  }

  const data: GoogleDriveAuth = await response.json()
  return data.access_token
}

/**
 * Upload file to Google Drive
 */
export async function uploadToGoogleDrive(
  file: File,
  folderPath: string,
  fileName: string,
): Promise<GoogleDriveUploadResult> {
  try {
    const accessToken = await getAccessToken()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    // Step 1: Create file metadata
    const metadata = {
      name: fileName,
      mimeType: file.type,
      parents: folderId ? [folderId] : undefined,
      description: `Evidence file - ${folderPath}`,
    }

    // Step 2: Get file buffer
    const fileBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)

    // Step 3: Create multipart body
    const boundary = "-------314159265358979323846"
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const metadataPart = delimiter + "Content-Type: application/json; charset=UTF-8\r\n\r\n" + JSON.stringify(metadata)

    const filePart =
      delimiter +
      `Content-Type: ${file.type}\r\n` +
      "Content-Transfer-Encoding: base64\r\n\r\n" +
      Buffer.from(uint8Array).toString("base64")

    const multipartBody = metadataPart + filePart + closeDelimiter

    // Step 4: Upload to Google Drive
    const uploadResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=*",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      },
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Google Drive upload failed: ${errorText}`)
    }

    const uploadResult = await uploadResponse.json()

    // Step 5: Set file permissions to "anyone with link can view"
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    })

    // Step 6: Get shareable link
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${uploadResult.id}?fields=id,name,webViewLink,webContentLink,size,mimeType`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const fileData = await fileResponse.json()

    return {
      fileId: fileData.id,
      fileName: fileData.name,
      webViewLink: fileData.webViewLink, // Link untuk view di browser
      webContentLink: fileData.webContentLink, // Link untuk download
      size: Number.parseInt(fileData.size),
      mimeType: fileData.mimeType,
    }
  } catch (error) {
    console.error("[v0] Google Drive upload error:", error)
    throw new Error(`Failed to upload to Google Drive: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Delete file from Google Drive
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<void> {
  try {
    const accessToken = await getAccessToken()

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`)
    }
  } catch (error) {
    console.error("[v0] Google Drive delete error:", error)
    throw error
  }
}
