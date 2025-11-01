import type { User } from "./types"

export const INITIAL_USERS: User[] = [
  {
    id: "1",
    nik: "HR001",
    nama: "Budi Santoso",
    email: "budi@3s-gsm.com",
    password: "password123",
    role: "hr_site",
    site: "Head Office",
    jabatan: "Admin Site",
    departemen: "HCGA",
    poh: "POH001",
    statusKaryawan: "Tetap",
    noKtp: "3201234567890123",
    noTelp: "081234567890",
    tanggalBergabung: "2020-01-15",
  },
  {
    id: "2",
    nik: "MGR001",
    nama: "Siti Nurhaliza",
    email: "siti@3s-gsm.com",
    password: "password123",
    role: "dic",
    site: "bsf",
    jabatan: "Manager",
    departemen: "Operation",
    poh: "POH002",
    statusKaryawan: "Tetap",
    noKtp: "3201234567890124",
    noTelp: "081234567891",
    tanggalBergabung: "2018-03-20",
  },
  {
    id: "3",
    nik: "PJO001",
    nama: "Ahmad Wijaya",
    email: "ahmad@3s-gsm.com",
    password: "password123",
    role: "pjo_site",
    site: "wbn",
    jabatan: "PJO",
    departemen: "Produksi",
    poh: "POH003",
    statusKaryawan: "Tetap",
    noKtp: "3201234567890125",
    noTelp: "081234567892",
    tanggalBergabung: "2017-06-10",
  },
  {
    id: "4",
    nik: "HRHO001",
    nama: "Dewi Lestari",
    email: "dewi@3s-gsm.com",
    password: "password123",
    role: "hr_ho",
    site: "Head Office",
    jabatan: "GM",
    departemen: "HCGA",
    poh: "POH004",
    statusKaryawan: "Tetap",
    noKtp: "3201234567890126",
    noTelp: "081234567893",
    tanggalBergabung: "2015-02-01",
  },
  {
    id: "5",
    nik: "TICK001",
    nama: "Rudi Hartono",
    email: "rudi@3s-gsm.com",
    password: "password123",
    role: "hr_ticketing",
    site: "Head Office",
    jabatan: "SPV",
    departemen: "HCGA",
    poh: "POH005",
    statusKaryawan: "Tetap",
    noKtp: "3201234567890127",
    noTelp: "081234567894",
    tanggalBergabung: "2019-08-15",
  },
  {
    id: "6",
    nik: "ADMIN001",
    nama: "Super Admin",
    email: "admin@3s-gsm.com",
    password: "admin123",
    role: "super_admin",
    site: "Head Office",
    jabatan: "Direksi",
    departemen: "BOD",
    poh: "POH006",
    statusKaryawan: "Tetap",
    noKtp: "3201234567890128",
    noTelp: "081234567895",
    tanggalBergabung: "2015-01-01",
  },
  {
    id: "7",
    nik: "USR001",
    nama: "Andi Wijaya",
    email: "andi@3s-gsm.com",
    password: "password123",
    role: "user",
    site: "bsf",
    jabatan: "Staff",
    departemen: "Operation",
    poh: "POH002",
    statusKaryawan: "Tetap",
    noKtp: "3201234567890129",
    noTelp: "081234567896",
    tanggalBergabung: "2021-05-10",
  },
]

export const SITES = ["Head Office", "wbn", "hsm", "bsf", "mhm", "psn", "bekb", "abn", "ke", "tcmm", "tcm", "im", "tmu"]

export const LEAVE_TYPES = ["Cuti Periodik", "Cuti Tahunan", "Cuti Emergency", "Dinas Luar", "Ijin PP"]

export function initializeMockData() {
  if (typeof window === "undefined") return

  // Initialize users if not exists
  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify(INITIAL_USERS))
  }

  // Initialize leave requests if not exists
  if (!localStorage.getItem("leaveRequests")) {
    localStorage.setItem("leaveRequests", JSON.stringify([]))
  }

  // Initialize approval history if not exists
  if (!localStorage.getItem("approvalHistory")) {
    localStorage.setItem("approvalHistory", JSON.stringify([]))
  }
}
