import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function formatDate(dateString: string): string {
  if (!dateString) return "-"
  const date = new Date(dateString)
  // Check if date is valid
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return "-"
  const date = new Date(dateString)
  // Check if date is valid
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatMonthYear(dateString: string): string {
  if (!dateString) return "-"
  const date = new Date(dateString)
  // Check if date is valid
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
  })
}

export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates
  return diffDays
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_dic: "Menunggu DIC",
    pending_pjo: "Menunggu PJO",
    pending_hr_ho: "Menunggu HR HO",
    di_proses: "Diproses",
    tiket_partial_issued: "Tiket Sebagian Terbit",
    tiket_issued: "Tiket Diterbitkan",
    ditolak_dic: "Ditolak DIC",
    ditolak_pjo: "Ditolak PJO",
    ditolak_hr_ho: "Ditolak HR HO",
    approved: "Disetujui",
    rejected: "Ditolak",
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_dic: "bg-yellow-100 text-yellow-800",
    pending_pjo: "bg-blue-100 text-blue-800",
    pending_hr_ho: "bg-purple-100 text-purple-800",
    di_proses: "bg-indigo-100 text-indigo-800",
    tiket_partial_issued: "bg-green-100 text-green-800",
    tiket_issued: "bg-green-100 text-green-800",
    ditolak_dic: "bg-red-100 text-red-800",
    ditolak_pjo: "bg-red-100 text-red-800",
    ditolak_hr_ho: "bg-red-100 text-red-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    user: "User",
    hr_site: "HR Site",
    dic: "DIC",
    pjo_site: "PJO Site",
    hr_ho: "HR Head Office",
    hr_ticketing: "HR Ticketing",
    super_admin: "Super Admin",
  }
  return labels[role] || role
}

export function getDetailedTicketStatus(
  status: string,
  statusTiketBerangkat?: string,
  statusTiketPulang?: string,
): string {
  // Cek apakah ada tiket yang sudah issued
  const tiketBerangkatIssued = statusTiketBerangkat === "issued"
  const tiketPulangIssued = statusTiketPulang === "issued"

  // Jika minimal satu tiket sudah issued, tampilkan status detail
  if (tiketBerangkatIssued || tiketPulangIssued) {
    if (tiketBerangkatIssued && tiketPulangIssued) {
      return "Tiket Lengkap"
    } else if (tiketBerangkatIssued) {
      return "Tiket Berangkat Terbit"
    } else if (tiketPulangIssued) {
      return "Tiket Balik Terbit"
    }
  }

  // Jika tidak ada tiket yang issued, return label biasa
  return getStatusLabel(status)
}
