"use server"

import {
  addKaryawan as serviceAddKaryawan,
  deleteKaryawan as serviceDeleteKaryawan,
  getKaryawanList as serviceGetKaryawanList,
  getAllKaryawanForExport as serviceGetAllKaryawanForExport,
  bulkAddKaryawan as serviceBulkAddKaryawan,
} from "@/lib/services/nrp-service"
import type { KaryawanInput, PaginationParams } from "@/lib/nrp-types"
import { revalidatePath } from "next/cache"

export async function addKaryawan(input: KaryawanInput) {
  const result = await serviceAddKaryawan(input)
  if (result.success) {
    revalidatePath("/nrp-generator")
  }
  return result
}

export async function deleteKaryawan(id: string) {
  const result = await serviceDeleteKaryawan(id)
  if (result.success) {
    revalidatePath("/nrp-generator")
  }
  return result
}

export async function getKaryawanList(params?: PaginationParams) {
  return serviceGetKaryawanList(params)
}

export async function getAllKaryawanForExport(search?: string) {
  return serviceGetAllKaryawanForExport(search)
}

export async function bulkAddKaryawan(inputs: KaryawanInput[]) {
  const result = await serviceBulkAddKaryawan(inputs)
  revalidatePath("/nrp-generator")
  return result
}
