import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { hashPassword, getCurrentUser } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()

    // ✅ Sirf admin parent create kar sakta hai
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, email, password, cnic, phone, address, student_id } =
      await request.json()

    // ✅ Step 1: Password hash karna
    const hashedPassword = await hashPassword(password)

    // ✅ Step 2: Users table me insert
    const [user] = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${hashedPassword}, 'parent')
      RETURNING id
    `

    // ✅ Step 3: Parents table me insert
    await sql`
      INSERT INTO parents (user_id, cnic, phone, address, student_id)
      VALUES (${user.id}, ${cnic}, ${phone}, ${address}, ${student_id})
    `

    return NextResponse.json({
      success: true,
      message: "Parent created successfully",
    })
  } catch (error) {
    console.error("Create parent error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
