import type { NextRequest } from "next/server"
import {
  getPendingRequestsForRole,
  getAllRequestsForRole,
  getUserRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  createLeaveRequest,
  updateBookingCodeSeparate, // Menambahkan import fungsi baru
  getApprovalHistory,
  getStatisticsForRole,
  type UserRole,
} from "@/lib/approval-workflow"
import { ensureLeaveRequestsSchema } from "@/lib/db-migration"
import { successResponse, errorResponse, withErrorHandling } from "@/lib/api-response"

let migrationInitialized: Promise<any> | null = null

async function ensureMigration() {
  if (!migrationInitialized) {
    console.log("[v0] Initializing database schema...")
    migrationInitialized = ensureLeaveRequestsSchema()
  }
  return migrationInitialized
}

export async function GET(request: NextRequest) {
  try {
    await ensureMigration()

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")

    console.log(`[v0] Workflow API GET - action: ${action}`)

    switch (action) {
      case "pending": {
        const role = searchParams.get("role") as UserRole
        const site = searchParams.get("site")
        const departemen = searchParams.get("departemen")

        if (!role || !site) {
          return errorResponse("Role and site required", 400)
        }

        console.log(`[v0] Fetching pending requests for role: ${role}, site: ${site}, dept: ${departemen}`)
        const [result, error] = await withErrorHandling(() =>
          getPendingRequestsForRole(role, site, departemen || undefined),
        )

        if (error) return errorResponse(error)

        console.log(`[v0] Pending requests result:`, result?.length || 0, "rows")
        return successResponse(Array.isArray(result) ? result : [])
      }

      case "all": {
        const role = searchParams.get("role") as UserRole
        const site = searchParams.get("site")
        const departemen = searchParams.get("departemen")

        if (!role || !site) {
          return errorResponse("Role and site required", 400)
        }

        console.log(`[v0] Fetching all requests for role: ${role}, site: ${site}, dept: ${departemen}`)
        const [result, error] = await withErrorHandling(() =>
          getAllRequestsForRole(role, site, departemen || undefined),
        )

        if (error) return errorResponse(error)

        console.log(`[v0] All requests result:`, result?.length || 0, "rows")
        return successResponse(Array.isArray(result) ? result : [])
      }

      case "user-requests": {
        const nik = searchParams.get("nik")
        if (!nik) {
          return errorResponse("NIK required", 400)
        }

        const [result, error] = await withErrorHandling(() => getUserRequests(nik))
        if (error) return errorResponse(error)

        return successResponse(result)
      }

      case "detail": {
        const id = searchParams.get("id")
        if (!id) {
          return errorResponse("ID required", 400)
        }

        const [result, error] = await withErrorHandling(() => getRequestById(id))
        if (error) return errorResponse(error)

        return successResponse(result)
      }

      case "history": {
        const id = searchParams.get("id")
        if (!id) {
          return errorResponse("ID required", 400)
        }

        const [result, error] = await withErrorHandling(() => getApprovalHistory(id))
        if (error) return errorResponse(error)

        return successResponse(result)
      }

      case "stats": {
        const role = searchParams.get("role") as UserRole
        const site = searchParams.get("site")
        const departemen = searchParams.get("departemen")

        if (!role || !site) {
          return errorResponse("Role and site required", 400)
        }

        const [result, error] = await withErrorHandling(() => getStatisticsForRole(role, site, departemen || undefined))

        if (error) return errorResponse(error)

        return successResponse(result, result as any)
      }

      default:
        return errorResponse("Invalid action", 400)
    }
  } catch (error) {
    console.error("[Workflow API] GET error:", error)
    return errorResponse(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureMigration()

    const data = await request.json()
    const { action } = data

    console.log("[v0] Workflow API POST received:", { action, data })

    switch (action) {
      case "create": {
        const {
          nik,
          jenisCuti,
          jenisPengajuan,
          tanggalPengajuan,
          periodeAwal,
          periodeAkhir,
          jumlahHari,
          berangkatDari,
          tujuan,
          tanggalKeberangkatan,
          cutiPeriodikBerikutnya,
          catatan,
          lamaOnsite,
          submittedBy,
          site,
          departemen,
        } = data

        if (!site || !departemen) {
          return errorResponse("Site and departemen are required", 400)
        }

        const [result, error] = await withErrorHandling(() =>
          createLeaveRequest({
            nik,
            jenisCuti,
            jenisPengajuan,
            tanggalPengajuan,
            periodeAwal,
            periodeAkhir,
            jumlahHari,
            berangkatDari,
            tujuan,
            tanggalKeberangkatan,
            cutiPeriodikBerikutnya,
            catatan,
            lamaOnsite,
            submittedBy,
            site,
            departemen,
          }),
        )

        if (error) return errorResponse(error)

        console.log("[v0] Leave request creation result:", result)
        return successResponse(result)
      }

      case "approve": {
        const { requestId, approverNik, approverRole, notes } = data

        const [result, error] = await withErrorHandling(() =>
          approveRequest(requestId, approverNik, approverRole, notes || ""),
        )

        if (error) return errorResponse(error)

        console.log("[v0] Approval result:", result)
        return successResponse(result)
      }

      case "reject": {
        const { requestId, approverNik, approverRole, notes } = data
        if (!notes || notes.trim() === "") {
          return errorResponse("Rejection reason required", 400)
        }

        const [result, error] = await withErrorHandling(() =>
          rejectRequest(requestId, approverNik, approverRole, notes),
        )

        if (error) return errorResponse(error)

        console.log("[v0] Rejection result:", result)
        return successResponse(result)
      }

      case "update-booking": {
        const {
          requestId,
          tiketBerangkat,
          tiketBalik,
          bookingCode,
          namaPesawat,
          jamKeberangkatan,
          bookingCodeBalik,
          namaPesawatBalik,
          jamKeberangkatanBalik,
          tanggalBerangkatBalik,
          berangkatDariBalik,
          tujuanBalik,
          updatedBy,
        } = data

        if (!tiketBerangkat && !tiketBalik) {
          return errorResponse("Pilih minimal satu tiket (berangkat atau balik)", 400)
        }

        if (tiketBerangkat && (!bookingCode || bookingCode.trim() === "")) {
          return errorResponse("Kode booking tiket berangkat harus diisi", 400)
        }

        if (tiketBalik && (!bookingCodeBalik || bookingCodeBalik.trim() === "")) {
          return errorResponse("Kode booking tiket balik harus diisi", 400)
        }

        const [result, error] = await withErrorHandling(() =>
          updateBookingCodeSeparate(
            requestId,
            {
              tiketBerangkat,
              tiketBalik,
              bookingCode,
              namaPesawat,
              jamKeberangkatan,
              bookingCodeBalik,
              namaPesawatBalik,
              jamKeberangkatanBalik,
              tanggalBerangkatBalik,
              berangkatDariBalik,
              tujuanBalik,
            },
            updatedBy,
          ),
        )

        if (error) return errorResponse(error)

        console.log("[v0] Booking code update result:", result)
        return successResponse(result)
      }

      default:
        return errorResponse("Invalid action", 400)
    }
  } catch (error) {
    console.error("[v0] Workflow API POST error:", error)
    return errorResponse(error instanceof Error ? error : new Error(String(error)))
  }
}
