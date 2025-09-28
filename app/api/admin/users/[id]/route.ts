import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hashPassword } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { name, email, role, password, cnic, phone, address, occupation, emergency_contact } =
      await request.json()
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

    // ✅ If role = parent → update parents table too
    if (role === "parent") {
      const parentExists = await sql`
        SELECT id FROM parents WHERE user_id = ${userId}
      `

      if (parentExists.length > 0) {
        // Update existing parent record
        await sql`
          UPDATE parents
          SET cnic = ${cnic || null},
              phone = ${phone || null},
              address = ${address || null},
              occupation = ${occupation || null},
              emergency_contact = ${emergency_contact || null}
          WHERE user_id = ${userId}
        `
      } else {
        // Insert new parent record (if missing)
        await sql`
          INSERT INTO parents (user_id, cnic, phone, address, occupation, emergency_contact)
          VALUES (${userId}, ${cnic || null}, ${phone || null}, ${address || null}, ${occupation || null}, ${emergency_contact || null})
        `
      }
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

    // Deactivate user
    await sql`
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${userId}
    `

    // Optional: deactivate parent row also if exists
    await sql`
      UPDATE parents
      SET is_active = false
      WHERE user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

