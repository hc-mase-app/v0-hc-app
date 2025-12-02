# Cara Menambahkan Dokumen ke HCGA IMS

Panduan lengkap untuk menambahkan dokumen baru ke sistem HCGA IMS menggunakan Google Drive.

## Langkah 1: Upload File ke Google Drive

1. Buka Google Drive Anda
2. Upload file PDF yang ingin ditambahkan
3. Klik kanan pada file → **Share** → **Get Link**
4. Set akses menjadi **"Anyone with the link"**
5. Copy link yang muncul (contoh: `https://drive.google.com/file/d/1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug/view`)

## Langkah 2: Extract File ID dari Link

Dari link Google Drive seperti:
\`\`\`
https://drive.google.com/file/d/1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug/view?usp=drive_link
\`\`\`

**File ID** adalah bagian setelah `/d/` dan sebelum `/view`:
\`\`\`
1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug
\`\`\`

## Langkah 3: Edit File JSON

### Manual Edit (Recommended untuk 1-5 file)

1. Buka file JSON sesuai kategori di folder `public/google-drive-documents/`:
   - SK → `sk/documents.json`
   - Form → `form/documents.json`
   - SOP & IK → `sop-ik/documents.json`
   - SOP SDM → `sop-sdm/documents.json`
   - Internal Memo → `internal-memo/documents.json`
   - Work Instruction → `work-instruction/documents.json`

2. Tambahkan entry baru ke array `documents`:

\`\`\`json
{
  "documents": [
    {
      "name": "Nama Dokumen (tampil di aplikasi)",
      "driveId": "FILE_ID_DARI_GOOGLE_DRIVE",
      "size": "236 KB",
      "uploadedAt": "2/12/2025",
      "category": "sk"
    }
  ]
}
\`\`\`

### Menggunakan Python Script (Recommended untuk banyak file)

Jika Anda punya banyak file, gunakan helper script:

\`\`\`bash
python scripts/google-drive-json-generator.py
\`\`\`

Script akan meminta Anda:
1. Paste Google Drive links (satu per baris)
2. Input nama dokumen untuk setiap link
3. Pilih kategori (sk/form/sop-ik/dll)
4. Otomatis generate JSON dan save ke file yang benar

## Contoh Lengkap

### File: `public/google-drive-documents/sk/documents.json`

\`\`\`json
{
  "documents": [
    {
      "name": "SK - GSM - 111. Yan Firdaus - Head HC Development - HO Jakarta",
      "driveId": "1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug",
      "size": "236.32 KB",
      "uploadedAt": "2/12/2025",
      "category": "sk"
    },
    {
      "name": "SK - SSS - 025. Promosi Jabatan Manager",
      "driveId": "ABC123xyz456DEF",
      "size": "180 KB",
      "uploadedAt": "5/12/2025",
      "category": "sk"
    }
  ]
}
\`\`\`

## Field Descriptions

| Field | Required | Contoh | Keterangan |
|-------|----------|--------|------------|
| `name` | ✅ Yes | "SK - GSM - 111. Yan Firdaus" | Nama dokumen yang tampil di aplikasi |
| `driveId` | ✅ Yes | "1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug" | File ID dari Google Drive |
| `size` | ❌ No | "236.32 KB" | Ukuran file (opsional) |
| `uploadedAt` | ❌ No | "2/12/2025" | Tanggal upload (opsional) |
| `category` | ✅ Yes | "sk" | Kategori: sk, form, sop-ik, sop-sdm, internal-memo, work-instruction |

## Kategori yang Tersedia

| Kategori Code | Nama Lengkap | File Path |
|---------------|--------------|-----------|
| `sk` | Surat Keputusan | `public/google-drive-documents/sk/documents.json` |
| `form` | Form | `public/google-drive-documents/form/documents.json` |
| `sop-ik` | SOP & Instruksi Kerja | `public/google-drive-documents/sop-ik/documents.json` |
| `sop-sdm` | SOP SDM | `public/google-drive-documents/sop-sdm/documents.json` |
| `internal-memo` | Internal Memo | `public/google-drive-documents/internal-memo/documents.json` |
| `work-instruction` | Work Instruction | `public/google-drive-documents/work-instruction/documents.json` |

## Tips & Troubleshooting

### Dokumen tidak muncul?
- Pastikan file JSON valid (bisa cek di https://jsonlint.com)
- Pastikan Google Drive link sudah di-set "Anyone with the link"
- Refresh halaman browser (Ctrl+F5)

### Preview tidak bisa dibuka?
- Pastikan file adalah PDF
- Coba klik "Buka Tab Baru" untuk lihat di Google Drive langsung
- Beberapa file mungkin perlu login Google Drive

### Cara menghapus dokumen?
- Hapus entry dari array `documents` di file JSON
- Atau set array kosong: `"documents": []`

## Need Help?

Jika ada masalah, hubungi admin atau buka issue di repository.
