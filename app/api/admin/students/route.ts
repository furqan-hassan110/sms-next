import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const students = await sql`
      SELECT id, student_id, name, class, section, father_name, phone, is_active
      FROM students
      WHERE is_active = true
      ORDER BY name
    `

    return NextResponse.json({ success: true, students })
  } catch (error) {
    console.error("Get students error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
