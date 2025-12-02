# Migration Guide: Menambahkan Subfolder ke HCGA IMS

## Problem
Anda mendapatkan error: `column "subfolder" does not exist`

## Solution
Anda perlu menjalankan SQL migration di Neon database untuk menambahkan kolom `subfolder`.

## Langkah-langkah:

### 1. Login ke Neon Console
- Buka https://console.neon.tech
- Login dengan akun Anda
- Pilih project database yang digunakan untuk HCGA IMS

### 2. Buka SQL Editor
- Di sidebar, klik **SQL Editor**
- Akan muncul editor SQL

### 3. Jalankan Migration Script
Copy script berikut dan paste ke SQL Editor, lalu klik **Run**:

\`\`\`sql
-- Add subfolder column to documents table
ALTER TABLE documents ADD COLUMN subfolder VARCHAR(100);

-- Add index for faster queries by subfolder
CREATE INDEX idx_documents_subfolder ON documents(subfolder);

-- Add composite index for category + subfolder queries
CREATE INDEX idx_documents_category_subfolder ON documents(category, subfolder);

COMMENT ON COLUMN documents.subfolder IS 'Subfolder grouping for documents within a category, e.g., PT GSM, PT SSS';
\`\`\`

### 4. Verifikasi Migration Berhasil
Jalankan query berikut untuk memastikan kolom sudah ditambahkan:

\`\`\`sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents';
\`\`\`

Anda harus melihat kolom `subfolder` dengan type `character varying`.

### 5. Update Existing Data (Optional)
Jika Anda ingin mengelompokkan dokumen yang sudah ada ke subfolder tertentu:

\`\`\`sql
-- Contoh: Update dokumen SOP-IK untuk PT GSM
UPDATE documents 
SET subfolder = 'PT GSM' 
WHERE category = 'sop-ik' AND name LIKE '%GSM%';

-- Contoh: Update dokumen SOP-IK untuk PT SSS
UPDATE documents 
SET subfolder = 'PT SSS' 
WHERE category = 'sop-ik' AND name LIKE '%SSS%';
\`\`\`

### 6. Refresh Aplikasi
Setelah migration berhasil, refresh aplikasi HCGA IMS dan sistem subfolder akan berfungsi.

## Catatan Penting:
- Dokumen dengan `subfolder = NULL` akan tetap muncul di semua subfolder
- Anda bisa menambahkan subfolder baru dari Admin Panel (`/admin/documents`)
- Migration ini aman dan tidak akan menghapus data yang sudah ada
