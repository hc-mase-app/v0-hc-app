export type UserRole = "user" | "hr_site" | "dic" | "pjo_site" | "hr_ho" | "hr_ticketing" | "super_admin"

export type LeaveStatus = "pending_dic" | "pending_pjo" | "pending_hr_ho" | "approved" | "rejected"

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
}

export interface ApprovalHistory {
  id: string
  requestId: string
  approverUserId: string
  approverName: string
  approverRole: UserRole
  action: "approved" | "rejected"
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

export interface AssessmentValidation {
  createdByUserId: string
  createdByName: string
  createdByRole: string
  createdAt: string
  knownByHRUserId?: string
  knownByHRName?: string
  knownByHRAt?: string
  approvedByPJOUserId?: string
  approvedByPJOName?: string
  approvedByPJOAt?: string
  receivedByHRHOUserId?: string
  receivedByHRHOName?: string
  receivedByHRHOAt?: string
}

export interface EmployeeAssessment {
  id: string
  employeeNik: string
  employeeName: string
  employeeJabatan: string
  employeeDepartemen: string
  employeeSite: string
  employeeStartDate: string
  employeeStatus: "Kontrak" | "Tetap"
  assessmentPeriod: string // e.g., "2025-01 to 2025-03"

  // Assessment sections
  kepribadian: AssessmentDimension[]
  prestasi: AssessmentDimension[]
  kehadiran: AssessmentAttendance
  indisipliner: AssessmentDiscipline

  // Additional info
  strengths: string
  weaknesses: string
  recommendations: AssessmentRecommendation[]

  // Validation workflow
  validation: AssessmentValidation

  // Metadata
  createdAt: string
  updatedAt: string
  status: "draft" | "submitted" | "approved" | "rejected"
}
