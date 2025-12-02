# Setup Database Neon untuk HCGA IMS

## Langkah 1: Jalankan SQL Scripts di Neon Dashboard

1. Login ke Neon Dashboard: https://console.neon.tech
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy dan paste script berikut satu per satu:

### Script 1: Create Table (Jalankan dulu)

Copy seluruh isi dari file `scripts/001_create_documents_table.sql` atau gunakan script ini:

\`\`\`sql
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  drive_id VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  size VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_name ON documents(name);

COMMENT ON TABLE documents IS 'Stores metadata for Google Drive documents in HCGA IMS';
\`\`\`

Klik **Run** atau tekan **Ctrl+Enter**.

### Script 2: Seed Data (Optional - Jalankan setelah script 1)

Copy seluruh isi dari file `scripts/002_seed_initial_documents.sql`:

\`\`\`sql
INSERT INTO documents (name, drive_id, category, size, uploaded_at) VALUES
('SK - GSM - 111. Yan Firdaus - Head HC Development - HO Jakarta', '1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug', 'sk', '236.32 KB', '2025-12-02')
ON CONFLICT (drive_id) DO NOTHING;
\`\`\`

Klik **Run** atau tekan **Ctrl+Enter**.

## Langkah 2: Verify Table Created

Jalankan query untuk memastikan table berhasil dibuat:

\`\`\`sql
SELECT * FROM documents;
\`\`\`

Harusnya muncul 1 row dengan document SK.

## Langkah 3: Update Environment Variable (Jika Belum)

Pastikan `DATABASE_URL` sudah ada di Vercel environment variables.

Format: `postgresql://username:password@host/database?sslmode=require`

Cara dapatkan connection string:
1. Di Neon Console, klik **Dashboard**
2. Scroll ke bawah ke section **Connection Details**
3. Copy **Connection String**
4. Paste ke Vercel environment variable dengan nama `DATABASE_URL`

## Langkah 4: Access Admin Panel

Setelah table dibuat, Anda bisa langsung:
- Admin Panel: `/admin/documents` - Untuk add/edit/delete dokumen
- User View: `/hcga-ims/sk` - Untuk melihat dokumen (user biasa)

## Fitur Admin Panel

- **Add Document**: Tambah dokumen baru dengan Google Drive ID
- **Edit Document**: Update informasi dokumen
- **Delete Document**: Hapus dokumen dari database
- **Filter by Category**: Lihat dokumen per kategori

## Troubleshooting

### Error: "relation documents does not exist"
**Penyebab**: Table belum dibuat di database.
**Solusi**: Jalankan Script 1 (create table) di Neon SQL Editor.

### Error: "value too long for type character varying"
**Penyebab**: Schema lama dengan kolom terlalu kecil.
**Solusi**: Drop table dan recreate dengan script baru:
\`\`\`sql
DROP TABLE IF EXISTS documents;
-- Lalu jalankan Script 1 lagi
\`\`\`

### Documents tidak muncul setelah upload
**Penyebab**: Kemungkinan DATABASE_URL salah atau database connection error.
**Solusi**: 
1. Check browser console untuk error message
2. Verify DATABASE_URL di Vercel environment variables
3. Test connection di Neon SQL Editor: `SELECT * FROM documents;`

## Tips

1. **Cara mendapatkan Google Drive ID dari link**:
   - Link: `https://drive.google.com/file/d/1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug/view`
   - ID: `1aklY4tO7p5UhFoUYF2PSOP6VfL55Fdug` (bagian di tengah)

2. **File size bersifat opsional**, tapi membantu user mengetahui ukuran file sebelum download

3. **Update dokumen tidak perlu deploy ulang** - Perubahan langsung terlihat di aplikasi karena data disimpan di database, bukan di kode

4. **Categories yang tersedia**:
   - `sk` - Surat Keputusan
   - `form` - Form
   - `sop-ik` - SOP IK
   - `sop-sdm` - SOP SDM
   - `internal-memo` - Internal Memo
   - `work-instruction` - Work Instruction
