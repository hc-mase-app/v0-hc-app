export interface Karyawan {
  id: string
  nrp: string
  nama_karyawan: string
  jabatan: string
  departemen: string
  tanggal_masuk_kerja: string
  site: string
  entitas: string
  level?: string // Changed level from number to string for text-based hierarchy
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
  nrp?: string
  level?: string // Changed level to string only (text-based)
}

export interface PaginationParams {
  page: number
  limit: number
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
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
  "ACCOUNTING & TAX", // Changed "FAT" to "ACCOUNTING & TAX"
  "IT",
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

export const LEVEL_OPTIONS = [
  "General Manager",
  "Manager",
  "PJO",
  "Deputy PJO",
  "Head",
  "Supervisor",
  "Group Leader",
  "Admin",
  "Operator",
  "Driver",
  "Mekanik",
  "Helper",
] as const
