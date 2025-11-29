export interface Karyawan {
  id: string
  nrp: string
  nama_karyawan: string
  jabatan: string
  departemen: string
  tanggal_masuk_kerja: string
  site: string
  entitas: string
  created_at: string
  updated_at: string
}

export interface KaryawanInput {
  nama_karyawan: string
  jabatan: string
  departemen: string
  tanggal_masuk_kerja: string
  site: string
  entitas: string
}

export const ENTITAS_OPTIONS = [
  { value: "PT SSS", code: "1" },
  { value: "PT GSM", code: "2" },
] as const

export const DEPARTEMEN_OPTIONS = [
  "OPERATION",
  "ENGINEERING",
  "PRODUKSI",
  "PLANT",
  "HCGA",
  "SCM",
  "FINANCE",
  "FAT",
] as const

export const SITE_OPTIONS = [
  "HEAD OFFICE",
  "BSF",
  "ABN",
  "BEKB",
  "HSM",
  "IM",
  "KE",
  "MHM",
  "POSITION",
  "TCM",
  "TCMM",
  "WBN",
] as const
