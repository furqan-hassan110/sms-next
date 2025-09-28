
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hashPassword } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const users = await sql`
      SELECT u.id, u.email, u.name, u.role, u.is_active, u.created_at,
             p.cnic, p.phone, p.address, p.occupation, p.emergency_contact
      FROM users u
      LEFT JOIN parents p ON u.id = p.user_id
      ORDER BY u.created_at DESC
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

    const { name, email, role, password, cnic, phone, address, occupation, emergency_contact } =
      await request.json()

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

    // Insert into users table
    const [newUser] = await sql`
      INSERT INTO users (name, email, role, password_hash)
      VALUES (${name}, ${email}, ${role}, ${passwordHash})
      RETURNING id
    `

    // ✅ If role = parent → insert into parents table
    if (role === "parent") {
      await sql`
        INSERT INTO parents (user_id, cnic, phone, address, occupation, emergency_contact)
        VALUES (${newUser.id}, ${cnic || null}, ${phone || null}, ${address || null}, ${occupation || null}, ${emergency_contact || null})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

