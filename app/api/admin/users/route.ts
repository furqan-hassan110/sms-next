import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"
import { hashPassword } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const users = await sql`
      SELECT id, email, name, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { name, email, role, password } = await request.json()

    if (!name || !email || !role || !password) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, error: "User with this email already exists" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    await sql`
      INSERT INTO users (name, email, role, password_hash)
      VALUES (${name}, ${email}, ${role}, ${passwordHash})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
