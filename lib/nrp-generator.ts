import { ENTITAS_OPTIONS } from "./nrp-types"

export function getEntitasCode(entitas: string): string {
  const found = ENTITAS_OPTIONS.find((e) => e.value === entitas)
  return found?.code || "0"
}

export function generateNRP(entitas: string, tanggalMasuk: Date, nomorUrut: number): string {
  // Digit 1: Kode entitas
  const kodeEntitas = getEntitasCode(entitas)

  // Digit 2-3: Tahun (2 digit terakhir)
  const tahun = tanggalMasuk.getFullYear().toString().slice(-2)

  // Digit 4-5: Bulan (2 digit)
  const bulan = (tanggalMasuk.getMonth() + 1).toString().padStart(2, "0")

  // Digit 6-10: Nomor urut (5 digit)
  const urut = nomorUrut.toString().padStart(5, "0")

  return `${kodeEntitas}${tahun}${bulan}${urut}`
}

export function parseNRP(nrp: string): {
  kodeEntitas: string
  tahun: string
  bulan: string
  nomorUrut: string
} {
  return {
    kodeEntitas: nrp.slice(0, 1),
    tahun: nrp.slice(1, 3),
    bulan: nrp.slice(3, 5),
    nomorUrut: nrp.slice(5, 10),
  }
}
