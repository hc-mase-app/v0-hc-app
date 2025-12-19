import type { UserRole } from "./types"

export interface FeaturePermission {
  key: string
  name: string
  path: string
  icon?: string
  description?: string
  allowedRoles: UserRole[]
  requireAuth: boolean
  dashboardRedirect?: Record<UserRole, string>
}

export const FEATURES: Record<string, FeaturePermission> = {
  leadtms: {
    key: "leadtms",
    name: "LEADTMS",
    path: "/tms",
    description: "Leadership Activity Monitoring System",
    allowedRoles: [
      "user",
      "admin_site",
      "hr_site",
      "dic",
      "pjo_site",
      "manager_ho",
      "hr_ho",
      "hr_ticketing",
      "super_admin",
    ],
    requireAuth: true,
  },
  penilaianPresentasi: {
    key: "penilaianPresentasi",
    name: "Penilaian Presentasi",
    path: "/penilaian-presentasi",
    description: "Sistem Penilaian Presentasi",
    allowedRoles: ["dic", "pjo_site", "hr_site", "manager_ho", "hr_ho", "super_admin"],
    requireAuth: true,
  },
  assessmentKaryawan: {
    key: "assessmentKaryawan",
    name: "Assessment Karyawan",
    path: "/assessment-karyawan",
    description: "Penilaian Kinerja Karyawan",
    allowedRoles: ["dic", "pjo_site", "hr_site", "manager_ho", "hr_ho", "super_admin"],
    requireAuth: true,
  },
  pengajuanCuti: {
    key: "pengajuanCuti",
    name: "Pengajuan Cuti",
    path: "/dashboard", // Will redirect based on role
    description: "Sistem Pengajuan Cuti & Tiket",
    allowedRoles: [
      "user",
      "admin_site",
      "hr_site",
      "dic",
      "pjo_site",
      "manager_ho",
      "hr_ho",
      "hr_ticketing",
      "super_admin",
    ],
    requireAuth: true,
    dashboardRedirect: {
      user: "/dashboard/user",
      admin_site: "/dashboard/admin-site",
      hr_site: "/dashboard/hr-site",
      dic: "/dashboard/dic",
      pjo_site: "/dashboard/pjo-site",
      manager_ho: "/dashboard/manager-ho",
      hr_ho: "/dashboard/hr-ho",
      hr_ticketing: "/dashboard/hr-ticketing",
      super_admin: "/dashboard/super-admin",
    },
  },
  hcgaIms: {
    key: "hcgaIms",
    name: "HCGA IMS",
    path: "/hcga-ims",
    description: "Integrated Management System",
    allowedRoles: [
      "user",
      "admin_site",
      "hr_site",
      "dic",
      "pjo_site",
      "manager_ho",
      "hr_ho",
      "hr_ticketing",
      "super_admin",
    ],
    requireAuth: true,
  },
  nrpGenerator: {
    key: "nrpGenerator",
    name: "NRP Generator",
    path: "/nrp-generator",
    description: "Generate NRP Karyawan",
    allowedRoles: ["hr_ho", "super_admin"],
    requireAuth: true,
  },
  psikotest: {
    key: "psikotest",
    name: "Psikotest",
    path: "/psikotest",
    description: "Tes Psikologi",
    allowedRoles: ["hr_ho", "super_admin"],
    requireAuth: true,
  },
  manajemenUsersDB: {
    key: "manajemenUsersDB",
    name: "Manajemen Database Users",
    path: "/manajemen-users-db",
    description: "Upload, View & Edit Database",
    allowedRoles: ["super_admin"],
    requireAuth: true,
  },
  development: {
    key: "development",
    name: "Development",
    path: "/development",
    description: "Development Tools",
    allowedRoles: ["hr_ho", "super_admin"],
    requireAuth: true,
  },
}

// Check if user has access to a feature
export function hasFeatureAccess(featureKey: string, userRole?: UserRole): boolean {
  const feature = FEATURES[featureKey]
  if (!feature) return false
  if (!feature.requireAuth) return true
  if (!userRole) return false
  return feature.allowedRoles.includes(userRole)
}

// Get redirect path for dashboard based on role
export function getDashboardPath(userRole: UserRole): string {
  const feature = FEATURES.pengajuanCuti
  if (feature.dashboardRedirect && feature.dashboardRedirect[userRole]) {
    return feature.dashboardRedirect[userRole]
  }
  return "/dashboard/user" // Default fallback
}

// Check if user can access hierarchy management
export function canAccessHierarchy(userRole?: UserRole): boolean {
  if (!userRole) return false
  return userRole === "super_admin"
}

// Get all accessible features for a role
export function getAccessibleFeatures(userRole?: UserRole): FeaturePermission[] {
  if (!userRole) return []
  return Object.values(FEATURES).filter((feature) => feature.allowedRoles.includes(userRole))
}
