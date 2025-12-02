# Setup Dokumen R2 - Panduan Sederhana

Karena AWS SDK tidak kompatibel dengan environment v0, kami menggunakan pendekatan JSON statis yang sederhana dan reliable.

## Cara Kerja

Setiap kategori folder di R2 harus memiliki file `documents.json` yang berisi list dokumen.

## Struktur Folder di R2 Bucket

\`\`\`
hcga-documents/
├── sk/
│   ├── documents.json          # List dokumen SK
│   ├── SK_GSM_070_Melinda.pdf
│   └── SK_SSS_001_John.pdf
├── form/
│   ├── documents.json          # List form
│   └── Form-Cuti.pdf
├── sop-ik/
│   ├── documents.json
│   └── SOP-Quality-Manual.pdf
├── sop-sdm/
│   ├── documents.json
│   └── SOP-Recruitment.pdf
├── internal-memo/
│   ├── documents.json
│   └── Memo-001.pdf
└── work-instruction/
    ├── documents.json
    └── WI-Production.pdf
\`\`\`

## Format File documents.json

Upload file `documents.json` di setiap folder kategori dengan format:

\`\`\`json
{
  "documents": [
    {
      "name": "SK GSM 070 Melinda 20.03.24 HO",
      "fileName": "SK_GSM_070_Melinda_20.03.24_HO.pdf",
      "size": "241.99 KB",
      "uploadedAt": "2025-12-02",
      "category": "sk"
    },
    {
      "name": "SK SSS 001 John Doe",
      "fileName": "SK_SSS_001_John.pdf",
      "size": "156.3 KB",
      "uploadedAt": "2025-12-01",
      "category": "sk"
    }
  ]
}
\`\`\`

## Langkah-langkah Setup

### 1. Upload PDF Files

Upload file PDF Anda ke folder yang sesuai di bucket `hcga-documents`:
- SK → `/sk/`
- Form → `/form/`
- SOP IK → `/sop-ik/`
- SOP SDM → `/sop-sdm/`
- Internal Memo → `/internal-memo/`
- Work Instruction → `/work-instruction/`

### 2. Buat File documents.json

Untuk setiap folder kategori, buat file `documents.json` dengan list semua dokumen PDF yang ada di folder tersebut.

**Contoh untuk folder /sk/:**

\`\`\`json
{
  "documents": [
    {
      "name": "SK GSM 070 Melinda 20.03.24 HO",
      "fileName": "SK_GSM_070_Melinda_20.03.24_HO.pdf",
      "size": "241.99 KB",
      "uploadedAt": "2025-12-02",
      "category": "sk"
    }
  ]
}
\`\`\`

### 3. Upload documents.json

Upload file `documents.json` ke folder yang sama dengan PDF files.

Contoh: Upload `documents.json` ke `/sk/documents.json` di R2 bucket.

### 4. Test di Aplikasi

Buka aplikasi dan navigasi ke kategori yang sudah di-setup. Dokumen akan muncul otomatis.

## Update Dokumen

Setiap kali Anda upload/hapus dokumen PDF:

1. Update file `documents.json` yang sesuai
2. Upload ulang ke R2 bucket
3. Refresh aplikasi

## Public URL

Dokumen akan diakses melalui public URL:
\`\`\`
https://pub-1dce790269ec4d33ad6a101fbac473d2.r2.dev/{category}/{fileName}
\`\`\`

Pastikan Public Access sudah enabled di R2 bucket settings.
