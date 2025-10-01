import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const feeTypes = await sql`
      SELECT id, name, description, amount, is_active
      FROM fee_types
      WHERE is_active = true
      ORDER BY name
    `

    return NextResponse.json({ success: true, feeTypes })
  } catch (error) {
    console.error("Get fee types error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
