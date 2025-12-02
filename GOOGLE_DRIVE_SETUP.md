# Setup Google Drive untuk HCGA IMS

Sistem sekarang menggunakan Google Drive untuk menyimpan dan menampilkan dokumen.

## Cara Setup

### 1. Upload Dokumen ke Google Drive

1. Buat folder di Google Drive untuk setiap kategori:
   - SK (Surat Keputusan)
   - Form
   - SOP-IK (SOP & Instruksi Kerja)
   - SOP-SDM
   - Internal Memo
   - Work Instruction

2. Upload file PDF ke folder yang sesuai

3. Untuk setiap file, klik kanan → Get Link → Set ke "Anyone with the link"

### 2. Dapatkan File ID dari Google Drive Link

Dari link seperti:
\`\`\`
https://drive.google.com/file/d/1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug/view?usp=drive_link
\`\`\`

File ID adalah: `1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug`

### 3. Buat File JSON untuk Setiap Kategori

Buat file di `public/google-drive-documents/{category}/documents.json`

Contoh untuk SK (`public/google-drive-documents/sk/documents.json`):

\`\`\`json
{
  "documents": [
    {
      "name": "SK - GSM - 111. Yan Firdaus - Head HC Development",
      "driveId": "1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug",
      "size": "236.32 KB",
      "uploadedAt": "2/12/2025",
      "category": "sk"
    },
    {
      "name": "SK - GSM - 112. Another Document",
      "driveId": "FILE_ID_HERE",
      "size": "150 KB",
      "uploadedAt": "3/12/2025",
      "category": "sk"
    }
  ]
}
\`\`\`

### 4. Struktur Folder

\`\`\`
public/
  google-drive-documents/
    sk/
      documents.json
    form/
      documents.json
    sop-ik/
      documents.json
    sop-sdm/
      documents.json
    internal-memo/
      documents.json
    work-instruction/
      documents.json
\`\`\`

## Fitur

- **Preview dalam aplikasi**: File PDF akan ditampilkan langsung dalam modal
- **Download**: Tombol download langsung dari Google Drive
- **Buka Tab Baru**: Buka dokumen di tab baru Google Drive
- **Responsive**: Bekerja di semua device

## Keuntungan Google Drive

✅ Tidak perlu setup CORS  
✅ Tidak perlu konfigurasi kompleks  
✅ Preview langsung work di browser  
✅ Download mudah  
✅ Free storage (15GB per akun)  
✅ Familiar untuk semua user  

## Catatan

- Pastikan setiap file di Google Drive sudah di-set ke "Anyone with the link" agar bisa diakses
- File ID bisa berupa full URL atau hanya ID saja, sistem akan extract otomatis
- Size dan uploadedAt bersifat opsional
