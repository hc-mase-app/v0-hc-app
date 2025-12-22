# Format Excel/CSV untuk Import Data Karyawan

Dokumen ini menjelaskan format lengkap untuk file Excel/CSV yang digunakan untuk import data karyawan massal ke sistem HC App.

---

## Format File yang Didukung

- **CSV** (`.csv`) - Comma-separated values
- **Excel** (`.xlsx` atau `.xls`)

---

## Struktur File

### 1. Header (Baris Pertama - WAJIB)

File harus memiliki header di baris pertama dengan nama kolom berikut (urutan bebas, tapi nama harus **persis sama**):

```
nik,nama,email_prefix,password,role,site,jabatan,departemen,poh,status_karyawan,no_ktp,no_telp,tanggal_lahir,tanggal_masuk,jenis_kelamin
```

**PENTING:**
- Nama kolom harus lowercase (huruf kecil)
- Gunakan underscore (_) bukan spasi
- Jangan tambah atau kurangi kolom

---

## Detail Setiap Kolom

### 1. **nik** ⚠️ WAJIB DIISI
- **Deskripsi:** Nomor Induk Karyawan (unik untuk setiap karyawan)
- **Format:** String/Angka
- **Contoh:** `1240201294`, `HR001`, `2230500923`
- **Validasi:** 
  - Tidak boleh kosong
  - Harus unik (tidak boleh duplikat dengan data yang sudah ada)
- **Error jika:** Kosong atau sudah terdaftar

---

### 2. **nama**
- **Deskripsi:** Nama lengkap karyawan
- **Format:** String
- **Contoh:** `Abdul Rahman`, `Siti Nurhaliza`
- **Default jika kosong:** `-`
- **Validasi:** Tidak ada

---

### 3. **email_prefix**
- **Deskripsi:** Username bagian depan email (sebelum @)
- **Format:** String (tanpa @domain)
- **Contoh:** `abdul`, `siti.nurhaliza`, `hr001`
- **Hasil email:** `{email_prefix}@3s-gsm.com`
- **Default jika kosong:** Menggunakan NIK sebagai prefix
  - Jika NIK = `1240201294` → Email = `1240201294@3s-gsm.com`

---

### 4. **password**
- **Deskripsi:** Password untuk login (plain text, akan di-hash di sistem)
- **Format:** String
- **Contoh:** `pass123`, `rahasia2024`
- **Default jika kosong:** `password123`
- **Rekomendasi:** Gunakan password unik per user

---

### 5. **role**
- **Deskripsi:** Role/hak akses user dalam sistem
- **Format:** String (pilihan terbatas)
- **Pilihan Valid:**
  - `user` - Karyawan biasa
  - `admin_site` - Admin lokasi/site
  - `hr_site` - HR Site
  - `dic` - Direct In-Charge (atasan langsung)
  - `pjo_site` - Penanggung Jawab Operasional Site
  - `manager_ho` - Manager Head Office
  - `hr_ho` - HR Head Office (GM)
  - `hr_ticketing` - HR Ticketing
  - `super_admin` - Super Administrator
- **Default jika kosong:** `user`
- **Validasi:** Jika tidak sesuai list, akan di-set ke `user`

---

### 6. **site**
- **Deskripsi:** Lokasi kerja karyawan
- **Format:** String
- **Contoh:** `Head Office`, `hsm`, `hms`, `plb`, `bks`, `btg`, `ktg`, `ptl`, `bjr`, `smr`, `bjm`, `mlg`, `sby`
- **Default jika kosong:** `-`
- **Pilihan:** Bebas, tapi disarankan menggunakan kode site yang sudah ada

---

### 7. **jabatan**
- **Deskripsi:** Jabatan/posisi karyawan
- **Format:** String
- **Pilihan yang tersedia:**
  - `Admin Site`
  - `GL` (Group Leader)
  - `SPV` (Supervisor)
  - `Head`
  - `Deputy`
  - `PJO` (Penanggung Jawab Operasional)
  - `Manager`
  - `GM` (General Manager)
  - `Direksi`
  - `Operator`
  - `Mekanik`
- **Default jika kosong:** `-`
- **Validasi:** Bebas, tidak dibatasi

---

### 8. **departemen**
- **Deskripsi:** Departemen/divisi karyawan
- **Format:** String
- **Contoh:** `HCGA`, `Produksi`, `Maintenance`, `Finance`, `IT`
- **Default jika kosong:** `-`
- **Validasi:** Bebas

---

### 9. **poh**
- **Deskripsi:** Person On Hire (kode penggajian)
- **Format:** String
- **Contoh:** `POH001`, `POH007`, `Makassar`
- **Default jika kosong:** `-`
- **Validasi:** Bebas

---

### 10. **status_karyawan**
- **Deskripsi:** Status kepegawaian
- **Format:** String (pilihan terbatas)
- **Pilihan Valid:**
  - `Kontrak`
  - `Tetap`
- **Default jika kosong:** `Kontrak`
- **Validasi:** Jika tidak sesuai, akan di-set ke `Kontrak`
- **PENTING:** Harus huruf besar di awal (Kontrak/Tetap, bukan kontrak/tetap)

---

### 11. **no_ktp**
- **Deskripsi:** Nomor KTP karyawan
- **Format:** String/Angka (16 digit)
- **Contoh:** `3201234567890123`, `7314033128000076`
- **Default jika kosong:** `null` (akan tampil "Belum diisi" di UI)
- **Validasi:** Tidak ada, boleh kosong

---

### 12. **no_telp**
- **Deskripsi:** Nomor telepon/WhatsApp karyawan
- **Format:** String/Angka (dengan atau tanpa +62)
- **Contoh:** `081234567890`, `+6281234567890`, `08222270489`
- **Default jika kosong:** `null` (akan tampil "Belum diisi" di UI)
- **Validasi:** Tidak ada, boleh kosong

---

### 13. **tanggal_lahir**
- **Deskripsi:** Tanggal lahir karyawan
- **Format:** Date dalam format `YYYY-MM-DD`, `DD/MM/YYYY`, atau `DD-MM-YYYY`
- **Contoh:** `1990-05-15`, `15/05/1990`, `15-05-1990`
- **Default jika kosong:** `1970-01-01`
- **Validasi:** Sistem akan otomatis parse berbagai format tanggal
- **Tips Excel:** 
  - Format cell sebagai "Text" agar tidak auto-convert
  - Atau gunakan format tanggal Excel biasa, sistem akan otomatis parse

---

### 14. **tanggal_masuk**
- **Deskripsi:** Tanggal mulai bekerja/bergabung dengan perusahaan
- **Format:** Date dalam format `YYYY-MM-DD`, `DD/MM/YYYY`, atau `DD-MM-YYYY`
- **Contoh:** `2020-01-15`, `15/01/2020`, `15-01-2020`
- **Default jika kosong:** Tanggal hari ini (saat import)
- **Validasi:** Sistem akan otomatis parse berbagai format tanggal
- **Tips Excel:** 
  - Format cell sebagai "Text" agar tidak auto-convert
  - Atau gunakan format tanggal Excel biasa (akan di-convert otomatis)
  - Excel serial number juga didukung (misal: 44562 akan di-convert ke tanggal)

---

### 15. **jenis_kelamin**
- **Deskripsi:** Jenis kelamin karyawan
- **Format:** String
- **Pilihan:**
  - `Laki-laki`
  - `Perempuan`
- **Default jika kosong:** `Laki-laki`
- **Validasi:** Bebas, tapi disarankan gunakan format standar

---

## Contoh File Excel

### Excel (.xlsx)

| nik | nama | email_prefix | password | role | site | jabatan | departemen | poh | status_karyawan | no_ktp | no_telp | tanggal_lahir | tanggal_masuk | jenis_kelamin |
|-----|------|--------------|----------|------|------|---------|------------|-----|-----------------|--------|---------|---------------|---------------|---------------|
| HR001 | Dina Kusuma | dina | pass123 | hr_site | Head Office | GL | HCGA | POH007 | Tetap | 3201234567890129 | 081234567896 | 1990-05-15 | 2015-03-01 | Perempuan |
| 1240201294 | Abdul Rahman | abdul | mypass | user | hsm | Operator | Produksi | Makassar | Kontrak | 7314033128000076 | 082227048965 | 1995-08-20 | 2020-06-15 | Laki-laki |
| SPV002 | Budi Santoso | budi.s | pass456 | dic | hms | SPV | Maintenance | POH003 | Tetap | | 08567891234 | 10/03/1988 | 01/01/2018 | Laki-laki |

**Catatan untuk contoh:**
- Baris 1: Format tanggal YYYY-MM-DD (recommended)
- Baris 2: Format tanggal YYYY-MM-DD
- Baris 3: Format tanggal DD/MM/YYYY (juga didukung), No KTP kosong

---

### CSV (.csv)

```csv
nik,nama,email_prefix,password,role,site,jabatan,departemen,poh,status_karyawan,no_ktp,no_telp,tanggal_lahir,tanggal_masuk,jenis_kelamin
HR001,Dina Kusuma,dina,pass123,hr_site,Head Office,GL,HCGA,POH007,Tetap,3201234567890129,081234567896,1990-05-15,2015-03-01,Perempuan
1240201294,Abdul Rahman,abdul,mypass,user,hsm,Operator,Produksi,Makassar,Kontrak,7314033128000076,082227048965,1995-08-20,2020-06-15,Laki-laki
SPV002,Budi Santoso,budi.s,pass456,dic,hms,SPV,Maintenance,POH003,Tetap,,08567891234,10/03/1988,01/01/2018,Laki-laki
```

---

## Tips Membuat File Excel

### 1. **Untuk Excel (.xlsx)**
- Gunakan sheet pertama untuk data
- Format semua cell sebagai "Text" agar tidak ada auto-convert
- Pastikan tidak ada baris kosong di tengah data
- Simpan dengan "Save As" → pilih Excel Workbook (.xlsx)

### 2. **Untuk CSV (.csv)**
- Gunakan comma (,) sebagai separator
- Jika ada text yang mengandung comma, bungkus dengan quotes: `"Nama, dengan comma"`
- Encoding: UTF-8 (agar karakter Indonesia tidak rusak)
- Line ending: Unix (LF) atau Windows (CRLF) keduanya didukung

### 3. **Hindari Kesalahan Umum**
- ❌ Menambah kolom ekstra yang tidak ada di header
- ❌ Mengubah nama header (misal: `nik` jadi `NIK` atau `Nik`)
- ❌ Baris kosong di tengah data
- ❌ Format tanggal yang ambigu (misal: 01/02/2020 → apakah 1 Feb atau 2 Jan?)
- ❌ Duplikat NIK
- ❌ Role atau status yang tidak valid

### 4. **Format Tanggal yang Aman**
- ✅ **YYYY-MM-DD** (paling aman dan tidak ambigu) → `2020-01-15`
- ✅ **DD/MM/YYYY** (akan di-parse dengan benar) → `15/01/2020`
- ✅ **DD-MM-YYYY** (akan di-parse dengan benar) → `15-01-2020`
- ⚠️ **Excel serial** (akan di-convert otomatis) → `44562` jadi `2022-01-15`
- ❌ **MM/DD/YYYY** (ambigu, bisa salah parse)

---

## Validasi dan Error Handling

### Yang Akan Di-reject (Error)
1. **NIK kosong** - Baris akan dilewati
2. **NIK duplikat** dengan data yang sudah ada - Baris akan dilewati
3. **File tidak punya header** - Import gagal total
4. **File kosong** (tidak ada data) - Import gagal total

### Yang Akan Di-auto-fix
1. **Role tidak valid** → Di-set ke `user`
2. **Status tidak valid** → Di-set ke `Kontrak`
3. **Field kosong** (kecuali NIK) → Diisi default value atau `null`

### Preview Sebelum Import
Sistem akan menampilkan **preview data** sebelum import dengan informasi:
- Jumlah data yang akan diimport
- Jumlah baris yang di-skip (error)
- Detail error per baris
- Tabel preview (maksimal 50 baris pertama)

Anda bisa **review dan konfirmasi** sebelum data benar-benar masuk ke database.

---

## FAQ

**Q: Apakah urutan kolom harus sama persis?**  
A: Tidak, urutan bebas. Yang penting nama header-nya harus persis sama (lowercase + underscore).

**Q: Format tanggal apa yang paling aman?**  
A: **YYYY-MM-DD** (contoh: 2020-01-15) adalah format paling aman dan tidak ambigu.

**Q: Bagaimana jika tanggal_masuk kosong?**  
A: Sistem akan otomatis mengisi dengan tanggal hari ini (tanggal saat import dilakukan).

**Q: Apakah Excel serial number untuk tanggal didukung?**  
A: Ya, sistem akan otomatis convert angka serial Excel (misal: 44562) menjadi tanggal yang benar.

**Q: Bolehkah ada kolom tambahan?**  
A: Tidak disarankan. Kolom tambahan akan diabaikan, tapi bisa membingungkan.

---

## Troubleshooting

### Error: "NIK sudah terdaftar"
- **Penyebab:** NIK yang Anda input sudah ada di database
- **Solusi:** Ganti NIK atau hapus baris tersebut dari file

### Error: "File harus memiliki header"
- **Penyebab:** Baris pertama tidak berisi header yang valid
- **Solusi:** Pastikan baris pertama adalah header dengan nama kolom yang benar

### Error: "Gagal membaca file"
- **Penyebab:** File corrupt atau format tidak didukung
- **Solusi:** Buka file di Excel, lalu "Save As" dengan format .xlsx atau .csv yang baru

### Data tanggal menjadi angka (misal: 44562)
- **Penyebab:** Excel menyimpan tanggal sebagai serial number
- **Solusi:** Tidak masalah! Sistem akan otomatis convert ke format tanggal yang benar. Atau format cell sebagai "Text" sebelum input tanggal untuk menghindari auto-convert.

### Tanggal_masuk kosong untuk beberapa data
- **Penyebab:** Kolom tanggal_masuk tidak diisi
- **Solusi:** Sistem akan otomatis mengisi dengan tanggal hari ini. Jika ingin tanggal spesifik, isi manual di Excel.

---

## Template Download

Untuk memudahkan, Anda bisa **export data existing** dari halaman manajemen user sebagai template:
1. Klik tombol "Export Excel"
2. Buka file hasil export
3. Hapus data lama, isi dengan data baru
4. Save dan upload kembali

Template ini sudah memiliki header dan format yang benar.

---

**Dokumen ini dibuat:** Desember 2024  
**Versi sistem:** v1.0  
**Update terakhir:** Desember 2024 (menambahkan kolom tanggal_masuk)  
**Kontak support:** Tim HCGA
