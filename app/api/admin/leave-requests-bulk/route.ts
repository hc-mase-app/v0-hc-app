import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const row of data) {
      try {
        // Validate required fields
        if (!row.nik || !row.tanggalMulai || !row.tanggalSelesai) {
          failedCount++
          errors.push(`Row dengan NIK ${row.nik || "undefined"}: Missing required fields`)
          continue
        }

        // Check if user exists
        const userExists = await sql`
          SELECT nik FROM users WHERE nik = ${row.nik}
        `

        if (userExists.length === 0) {
          failedCount++
          errors.push(`NIK ${row.nik} tidak ditemukan di database users`)
          continue
        }

        // Insert leave request
        await sql`
          INSERT INTO leave_requests (
            nik, 
            jenis_pengajuan_cuti, 
            jenis_pengajuan,
            tanggal_pengajuan, 
            tanggal_keberangkatan,
            tanggal_mulai, 
            tanggal_selesai, 
            jumlah_hari, 
            berangkat_dari, 
            tujuan, 
            sisa_cuti_tahunan,
            catatan, 
            alasan,
            status,
            lama_onsite,
            submitted_by,
            submitted_by_name
          ) VALUES (
            ${row.nik},
            ${row.jenisPengajuanCuti || row.jenis_cuti || "Cuti Tahunan"},
            ${row.jenisPengajuan || "lokal"},
            ${row.tanggalPengajuan || new Date().toISOString().split("T")[0]},
            ${row.tanggalKeberangkatan || row.tanggalMulai},
            ${row.tanggalMulai},
            ${row.tanggalSelesai},
            ${row.jumlahHari || 1},
            ${row.berangkatDari || ""},
            ${row.tujuan || ""},
            ${row.sisaCutiTahunan || 12},
            ${row.catatan || ""},
            ${row.alasan || ""},
            ${row.status || "pending_dic"},
            ${row.lamaOnsite || null},
            ${row.submittedBy || null},
            ${row.submittedByName || null}
          )
        `

        successCount++
      } catch (error) {
        failedCount++
        errors.push(`Row dengan NIK ${row.nik}: ${String(error)}`)
        console.error(`[API Admin] Error inserting row:`, error)
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10), // Return max 10 errors
    })
  } catch (error) {
    console.error("[API Admin] Error in bulk upload:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
