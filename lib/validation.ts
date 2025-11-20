/**
 * Validation utilities for leave request data
 * Provides comprehensive input validation with detailed error messages
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface LeaveRequestInput {
  nik?: string
  userNik?: string
  jenisCuti?: string
  jenisPengajuanCuti?: string
  tanggalPengajuan?: string
  periodeAwal?: string
  tanggalMulai?: string
  periodeAkhir?: string
  tanggalSelesai?: string
  jumlahHari?: number
  berangkatDari?: string
  tujuan?: string
  tanggalKeberangkatan?: string
  cutiPeriodikBerikutnya?: string
  tanggalCutiPeriodikBerikutnya?: string
  catatan?: string
  lamaOnsite?: number
  submittedBy?: string
  site?: string
  departemen?: string
  jenisPengajuan?: string // Added for conditional validation
}

/**
 * Validate NIK format (should be non-empty string)
 */
function validateNik(nik: string | undefined): string | null {
  if (!nik || nik.trim() === "") {
    return "NIK karyawan diperlukan"
  }
  if (nik.length < 3) {
    return "NIK tidak valid (minimal 3 karakter)"
  }
  return null
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate(date: string | undefined, fieldName: string): string | null {
  if (!date || date.trim() === "") {
    return `${fieldName} diperlukan`
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return `${fieldName} harus dalam format YYYY-MM-DD`
  }

  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    return `${fieldName} tidak valid`
  }

  return null
}

/**
 * Validate date range
 */
function validateDateRange(startDate: string, endDate: string): string | null {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (end < start) {
    return "Tanggal selesai tidak boleh lebih awal dari tanggal mulai"
  }

  return null
}

/**
 * Validate jumlah hari (must be positive integer)
 */
function validateJumlahHari(jumlahHari: number | undefined): string | null {
  if (jumlahHari === undefined || jumlahHari === null) {
    return "Jumlah hari diperlukan"
  }

  if (!Number.isInteger(jumlahHari) || jumlahHari <= 0) {
    return "Jumlah hari harus berupa angka positif"
  }

  if (jumlahHari > 365) {
    return "Jumlah hari maksimal 365 hari"
  }

  return null
}

/**
 * Validate jenis cuti
 */
function validateJenisCuti(jenisCuti: string | undefined): string | null {
  if (!jenisCuti || jenisCuti.trim() === "") {
    return "Jenis cuti diperlukan"
  }

  const validTypes = ["Cuti Tahunan", "Cuti Sakit", "Cuti Periodik", "Cuti Khusus"]
  if (!validTypes.includes(jenisCuti)) {
    return `Jenis cuti tidak valid. Pilihan: ${validTypes.join(", ")}`
  }

  return null
}

/**
 * Validate site and departemen (required for workflow routing)
 */
function validateSiteAndDepartemen(site: string | undefined, departemen: string | undefined): string[] {
  const errors: string[] = []

  if (!site || site.trim() === "") {
    errors.push("Site diperlukan")
  }

  if (!departemen || departemen.trim() === "") {
    errors.push("Departemen diperlukan")
  }

  return errors
}

/**
 * Comprehensive validation for leave request creation
 */
export function validateLeaveRequestCreate(input: LeaveRequestInput): ValidationResult {
  const errors: string[] = []

  console.log("[v0] validateLeaveRequestCreate - jenisPengajuan:", input.jenisPengajuan)
  console.log("[v0] validateLeaveRequestCreate - berangkatDari:", input.berangkatDari)
  console.log("[v0] validateLeaveRequestCreate - tujuan:", input.tujuan)

  // Required field validations
  const nik = input.userNik || input.nik
  const nikError = validateNik(nik)
  if (nikError) errors.push(nikError)

  const jenisCuti = input.jenisCuti || input.jenisPengajuanCuti
  const jenisCutiError = validateJenisCuti(jenisCuti)
  if (jenisCutiError) errors.push(jenisCutiError)

  const tanggalPengajuanError = validateDate(input.tanggalPengajuan, "Tanggal pengajuan")
  if (tanggalPengajuanError) errors.push(tanggalPengajuanError)

  const periodeAwal = input.periodeAwal || input.tanggalMulai
  const periodeAwalError = validateDate(periodeAwal, "Tanggal mulai cuti")
  if (periodeAwalError) errors.push(periodeAwalError)

  const periodeAkhir = input.periodeAkhir || input.tanggalSelesai
  const periodeAkhirError = validateDate(periodeAkhir, "Tanggal selesai cuti")
  if (periodeAkhirError) errors.push(periodeAkhirError)

  // Date range validation
  if (periodeAwal && periodeAkhir && !periodeAwalError && !periodeAkhirError) {
    const dateRangeError = validateDateRange(periodeAwal, periodeAkhir)
    if (dateRangeError) errors.push(dateRangeError)
  }

  const jumlahHariError = validateJumlahHari(input.jumlahHari)
  if (jumlahHariError) errors.push(jumlahHariError)

  // Workflow routing requirements
  const siteDepErrors = validateSiteAndDepartemen(input.site, input.departemen)
  errors.push(...siteDepErrors)

  if (!input.submittedBy || input.submittedBy.trim() === "") {
    errors.push("submittedBy diperlukan")
  }

  // Note: jenisPengajuan is passed as part of the input, default to 'dengan_tiket' if not specified
  const jenisPengajuan = input.jenisPengajuan || 'dengan_tiket'
  
  // Only validate travel fields if jenisPengajuan is 'dengan_tiket'
  // For 'lokal', these fields are optional and can be null
  if (jenisPengajuan === 'dengan_tiket') {
    console.log("[v0] Checking travel fields for 'dengan_tiket'")
    if (!input.berangkatDari || input.berangkatDari.trim() === "") {
      errors.push("Berangkat dari diperlukan")
    }
    if (!input.tujuan || input.tujuan.trim() === "") {
      errors.push("Tujuan diperlukan")
    }
    if (!input.tanggalKeberangkatan || input.tanggalKeberangkatan.trim() === "") {
      errors.push("Tanggal keberangkatan diperlukan")
    }
  } else {
    console.log("[v0] Skipping travel fields validation for 'lokal'")
  }

  // Optional field validations (only if provided)
  if (input.lamaOnsite !== undefined && input.lamaOnsite !== null) {
    if (!Number.isInteger(input.lamaOnsite) || input.lamaOnsite < 0) {
      errors.push("Lama onsite harus berupa angka positif atau 0")
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validation for leave request updates
 */
export function validateLeaveRequestUpdate(updates: Partial<LeaveRequestInput>): ValidationResult {
  const errors: string[] = []

  // Only validate fields that are being updated
  if (updates.jenisCuti || updates.jenisPengajuanCuti) {
    const jenisCutiError = validateJenisCuti(updates.jenisCuti || updates.jenisPengajuanCuti)
    if (jenisCutiError) errors.push(jenisCutiError)
  }

  if (updates.tanggalPengajuan) {
    const error = validateDate(updates.tanggalPengajuan, "Tanggal pengajuan")
    if (error) errors.push(error)
  }

  if (updates.periodeAwal || updates.tanggalMulai) {
    const error = validateDate(updates.periodeAwal || updates.tanggalMulai, "Tanggal mulai cuti")
    if (error) errors.push(error)
  }

  if (updates.periodeAkhir || updates.tanggalSelesai) {
    const error = validateDate(updates.periodeAkhir || updates.tanggalSelesai, "Tanggal selesai cuti")
    if (error) errors.push(error)
  }

  if (updates.jumlahHari !== undefined) {
    const error = validateJumlahHari(updates.jumlahHari)
    if (error) errors.push(error)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Safe integer parsing with validation
 */
export function parsePositiveInt(value: any, fieldName: string): [number | null, string | null] {
  if (value === undefined || value === null || value === "") {
    return [null, null]
  }

  const parsed = Number(value)

  if (isNaN(parsed)) {
    return [null, `${fieldName} harus berupa angka`]
  }

  if (!Number.isInteger(parsed)) {
    return [null, `${fieldName} harus berupa bilangan bulat`]
  }

  if (parsed < 0) {
    return [null, `${fieldName} tidak boleh negatif`]
  }

  return [parsed, null]
}

/**
 * Sanitize string input (trim and remove dangerous characters)
 */
export function sanitizeString(value: string | undefined): string {
  if (!value) return ""
  return value.trim().replace(/[<>]/g, "")
}

/**
 * Validate booking code format
 */
export function validateBookingCode(bookingCode: string | undefined): string | null {
  if (!bookingCode || bookingCode.trim() === "") {
    return "Booking code diperlukan"
  }

  if (bookingCode.length < 3) {
    return "Booking code tidak valid (minimal 3 karakter)"
  }

  return null
}
