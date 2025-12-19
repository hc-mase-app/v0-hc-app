import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/services/user-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nik,
      name,
      email,
      password,
      role,
      site,
      jabatan,
      departemen,
      poh,
      statusKaryawan,
      noKtp,
      noTelp,
      tanggalLahir,
      tanggalBergabung,
      jenisKelamin,
    } = body

    // Validation
    if (!nik || !name || !email || !password || !role) {
      return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 })
    }

    // Create user
    const newUser = await createUser({
      nik,
      name,
      email,
      password,
      role,
      site,
      jabatan,
      departemen,
      poh,
      statusKaryawan,
      noKtp,
      noTelp,
      tanggalLahir,
      jenisKelamin,
    })

    return NextResponse.json({
      success: true,
      message: `User ${name} berhasil ditambahkan`,
      user: newUser,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal menambahkan user",
      },
      { status: 500 },
    )
  }
}
