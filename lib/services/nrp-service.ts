/**
 * NRP Generator Service Layer
 * Centralized business logic for NRP generation and karyawan management
 */

import { sql } from "@/lib/neon-db"
import { generateNRP, getEntitasCode } from "@/lib/nrp-generator"
import type { KaryawanInput, Karyawan, PaginationParams, PaginatedResponse } from "@/lib/nrp-types"

// ============================================
// NRP Counter Operations
// ============================================

async function getNextNomorUrut(kodeEntitas: string, tahun: string): Promise<number> {
  const existingCounter = await sql`
    SELECT last_nomor_urut FROM nrp_counter 
    WHERE entitas_code = ${kodeEntitas} AND tahun = ${tahun}
  `

  if (existingCounter.length > 0) {
    const currentUrut = existingCounter[0].last_nomor_urut
    const nextUrut = currentUrut + 1

    await sql`
      UPDATE nrp_counter 
      SET last_nomor_urut = ${nextUrut}, updated_at = CURRENT_TIMESTAMP
      WHERE entitas_code = ${kodeEntitas} AND tahun = ${tahun}
    `
    return nextUrut
  } else {
    const lastKaryawan = await sql`
      SELECT nrp FROM karyawan 
      WHERE nrp LIKE ${`${kodeEntitas}${tahun}%`}
      ORDER BY nrp DESC 
      LIMIT 1
    `

    let startingUrut = 1
    if (lastKaryawan.length > 0 && lastKaryawan[0].nrp) {
      startingUrut = Number.parseInt(lastKaryawan[0].nrp.slice(5, 9), 10) + 1
    }

    await sql`
      INSERT INTO nrp_counter (entitas_code, tahun, last_nomor_urut)
      VALUES (${kodeEntitas}, ${tahun}, ${startingUrut})
    `
    return startingUrut
  }
}

// ============================================
// Karyawan CRUD Operations
// ============================================

export async function addKaryawan(
  input: KaryawanInput,
): Promise<{ success: boolean; data?: Karyawan; error?: string }> {
  try {
    const tanggalMasuk = new Date(input.tanggal_masuk_kerja)
    const tahun = tanggalMasuk.getFullYear().toString().slice(-2)
    const kodeEntitas = getEntitasCode(input.entitas)

    const nomorUrut = await getNextNomorUrut(kodeEntitas, tahun)
    const nrp = generateNRP(input.entitas, tanggalMasuk, nomorUrut)

    const result = await sql`
      INSERT INTO karyawan (nrp, nama_karyawan, jabatan, departemen, tanggal_masuk_kerja, site, entitas)
      VALUES (${nrp}, ${input.nama_karyawan}, ${input.jabatan}, ${input.departemen}, ${input.tanggal_masuk_kerja}, ${input.site}, ${input.entitas})
      RETURNING *
    `

    return { success: true, data: result[0] as Karyawan }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deleteKaryawan(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`DELETE FROM karyawan WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getKaryawanList(
  params?: PaginationParams,
): Promise<{ success: boolean; error?: string; data: PaginatedResponse<Karyawan> }> {
  try {
    const page = params?.page || 1
    const limit = params?.limit || 50
    const offset = (page - 1) * limit
    const search = params?.search

    let countResult: { count: string }[]
    if (search) {
      const searchPattern = `%${search}%`
      countResult = await sql`
        SELECT COUNT(*) as count FROM karyawan 
        WHERE nama_karyawan ILIKE ${searchPattern} OR nrp ILIKE ${searchPattern}
      `
    } else {
      countResult = await sql`SELECT COUNT(*) as count FROM karyawan`
    }

    const total = Number.parseInt(countResult[0].count, 10)
    const totalPages = Math.ceil(total / limit)

    let result: Karyawan[]
    if (search) {
      const searchPattern = `%${search}%`
      result = await sql`
        SELECT id, nrp, nama_karyawan, jabatan, departemen, tanggal_masuk_kerja, site, entitas, created_at, updated_at
        FROM karyawan 
        WHERE nama_karyawan ILIKE ${searchPattern} OR nrp ILIKE ${searchPattern}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      result = await sql`
        SELECT id, nrp, nama_karyawan, jabatan, departemen, tanggal_masuk_kerja, site, entitas, created_at, updated_at
        FROM karyawan 
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return {
      success: true,
      data: {
        data: result,
        pagination: { page, limit, total, totalPages },
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } },
    }
  }
}

export async function getAllKaryawanForExport(
  search?: string,
): Promise<{ success: boolean; error?: string; data: Karyawan[] }> {
  try {
    let result: Karyawan[]

    if (search) {
      const searchPattern = `%${search}%`
      result = await sql`
        SELECT id, nrp, nama_karyawan, jabatan, departemen, tanggal_masuk_kerja, site, entitas, created_at, updated_at
        FROM karyawan 
        WHERE nama_karyawan ILIKE ${searchPattern} OR nrp ILIKE ${searchPattern}
        ORDER BY created_at DESC
      `
    } else {
      result = await sql`
        SELECT id, nrp, nama_karyawan, jabatan, departemen, tanggal_masuk_kerja, site, entitas, created_at, updated_at
        FROM karyawan 
        ORDER BY created_at DESC
      `
    }

    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function bulkAddKaryawan(inputs: KaryawanInput[]): Promise<{
  successCount: number
  failedCount: number
  errors: string[]
}> {
  let successCount = 0
  let failedCount = 0
  const errors: string[] = []

  for (const input of inputs) {
    try {
      const tanggalMasuk = new Date(input.tanggal_masuk_kerja)
      const tahun = tanggalMasuk.getFullYear().toString().slice(-2)
      const kodeEntitas = getEntitasCode(input.entitas)

      let nrp: string
      if (input.nrp) {
        const existing = await sql`SELECT nrp FROM karyawan WHERE nrp = ${input.nrp}`
        if (existing.length > 0) {
          throw new Error(`NRP ${input.nrp} sudah terdaftar untuk ${input.nama_karyawan}`)
        }
        nrp = input.nrp
      } else {
        const nomorUrut = await getNextNomorUrut(kodeEntitas, tahun)
        nrp = generateNRP(input.entitas, tanggalMasuk, nomorUrut)
      }

      await sql`
        INSERT INTO karyawan (nrp, nama_karyawan, jabatan, departemen, tanggal_masuk_kerja, site, entitas)
        VALUES (${nrp}, ${input.nama_karyawan}, ${input.jabatan}, ${input.departemen}, ${input.tanggal_masuk_kerja}, ${input.site}, ${input.entitas})
      `

      successCount++
    } catch (error) {
      failedCount++
      errors.push(error instanceof Error ? error.message : "Unknown error")
    }
  }

  return { successCount, failedCount, errors }
}
