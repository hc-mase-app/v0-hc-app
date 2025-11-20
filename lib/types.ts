export type UserRole = "user" | "admin_site" | "hr_site" | "dic" | "pjo_site" | "hr_ho" | "hr_ticketing" | "super_admin"

export type LeaveStatus =
  | "pending_dic"
  | "pending_pjo"
  | "pending_hr_ho"
  | "di_proses"
  | "tiket_issued"
  | "approved"
  | "ditolak_dic"
  | "ditolak_pjo"
  | "ditolak_hr_ho"

export type JenisPengajuan = "dengan_tiket" | "lokal"

export type StatusTiket = "belum_issued" | "issued"

export interface User {
  id: string
  nik: string
  nama: string
  email: string
  password: string
  role: UserRole
  site: string
  jabatan: string
  departemen: string
  poh: string
  statusKaryawan: "Kontrak" | "Tetap"
  noKtp: string
  noTelp: string
  tanggalBergabung: string
  tanggalLahir: string
  jenisKelamin: "Laki-laki" | "Perempuan"
}

export interface LeaveRequest {
  id: string
  userId: string
  userName: string
  userNik: string
  site: string
  jabatan: string
  departemen: string
  poh: string
  statusKaryawan: "Kontrak" | "Tetap"
  noKtp: string
  noTelp: string
  email: string
  tanggalLahir: string
  jenisKelamin: "Laki-laki" | "Perempuan"
  jenisPengajuanCuti: string
  jenisPengajuan?: JenisPengajuan
  tanggalPengajuan: string
  tanggalKeberangkatan: string
  tanggalMulai: string
  tanggalSelesai: string
  jumlahHari: number
  berangkatDari: string
  tujuan: string
  sisaCutiTahunan: number
  tanggalCutiPeriodikBerikutnya: string
  catatan: string
  alasan: string
  status: LeaveStatus
  createdAt: string
  updatedAt: string
  bookingCode?: string
  submittedBy?: string // ID of the person who submitted (e.g., HR Site)
  submittedByName?: string // Name of the person who submitted
  lamaOnsite?: number // Duration onsite in days (HR Site input)
  namaPesawat?: string // Airline name (HR Ticketing input)
  jamKeberangkatan?: string // Departure time (HR Ticketing input)
  bookingCodeIssuedAt?: string // Date when booking code was issued
  statusTiketBerangkat?: StatusTiket
  statusTiketBalik?: StatusTiket
  tanggalIssueTiketBerangkat?: string
  tanggalIssueTiketBalik?: string
  bookingCodeBalik?: string
  namaPesawatBalik?: string
  jamKeberangkatanBalik?: string
  tanggalBerangkatBalik?: string // Added return ticket departure date field
  berangkatDariBalik?: string // Return departure city (can be different from tujuan)
  tujuanBalik?: string // Return destination (can be different from berangkatDari)
}

export interface ApprovalHistory {
  id: string
  requestId: string
  approverUserId: string
  approverName: string
  approverRole: UserRole
  action: "approved" | "rejected" | "tiket_berangkat_issued" | "tiket_balik_issued" | "tiket_issued"
  notes: string
  timestamp: string
}

export type RecommendationType =
  | "perpanjangan_kontrak"
  | "pengangkatan_tetap"
  | "promosi"
  | "perubahan_gaji"
  | "end_kontrak"

export interface AssessmentDimension {
  id: string
  name: string
  description: string
  score: number // 1-10
  weight: number // percentage
  calculatedScore: number // score * weight
}

export interface AssessmentAttendance {
  sakit: number
  izin: number
  alpa: number
  score: number // calculated based on formula
}

export interface AssessmentDiscipline {
  teguran: number
  sp1: number
  sp2: number
  sp3: number
  score: number // calculated based on formula
}

export interface AssessmentRecommendation {
  type: RecommendationType
  selected: boolean
  months?: number // for perpanjangan_kontrak
}

export type AssessmentStatus =
  | "draft" // Being created by DIC
  | "pending_pjo" // Waiting for PJO Site approval
  | "pending_hr_site" // Waiting for HR Site final approval
  | "approved" // Approved by all
  | "rejected" // Rejected at any stage

export interface AssessmentApprovalHistory {
  id: string
  assessmentId: string
  approverUserId: string
  approverName: string
  approverRole: UserRole
  action: "approved" | "rejected"
  notes: string
  timestamp: string
}

export interface EmployeeAssessment {
  id: string
  employeeNik: string
  employeeName: string
  employeeJabatan: string
  employeeDepartemen: string
  employeeSite: string
  employeeStartDate: string
  employeeStatus: "Kontrak" | "Tetap" | "Probation"
  assessmentPeriod: string // e.g., "2025-01 to 2025-03"

  // Assessment sections
  kepribadian: AssessmentDimension[]
  prestasi: AssessmentDimension[]
  kehadiran: AssessmentAttendance
  indisipliner: AssessmentDiscipline

  // Scores and grading
  totalScore: number
  grade: string
  penalties: {
    alpa?: number
    sakit?: number
    sp1?: number
    sp2?: number
    sp3?: number
  }

  // Additional info
  strengths: string
  weaknesses: string
  recommendations: AssessmentRecommendation[]

  // Workflow fields
  status: AssessmentStatus
  createdByUserId: string
  createdByName: string
  createdByRole: string

  approvalHistory?: AssessmentApprovalHistory[]

  // Metadata
  createdAt: string
  updatedAt: string
}
