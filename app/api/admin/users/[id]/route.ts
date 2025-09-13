import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"
import { hashPassword } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { name, email, role, password } = await request.json()
    const userId = Number.parseInt(params.id)

    if (!name || !email || !role) {
      return NextResponse.json({ success: false, error: "Name, email, and role are required" }, { status: 400 })
    }

    // Check if email is already taken by another user
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} AND id != ${userId}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, error: "Email is already taken by another user" }, { status: 400 })
    }

    if (password) {
      const passwordHash = await hashPassword(password)
      await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, role = ${role}, password_hash = ${passwordHash}, updated_at = NOW()
        WHERE id = ${userId}
      `
    } else {
      await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, role = ${role}, updated_at = NOW()
        WHERE id = ${userId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)

    // Prevent deleting own account
    if (currentUser.id === userId) {
      return NextResponse.json({ success: false, error: "Cannot delete your own account" }, { status: 400 })
    }

    await sql`
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
