import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const vouchers = await sql`
      SELECT 
        fv.id,
        fv.voucher_number,
        fv.amount,
        fv.due_date,
        fv.status,
        fv.created_at,
        s.name as student_name,
        s.student_id,
        ft.name as fee_type_name
      FROM fee_vouchers fv
      JOIN students s ON fv.student_id = s.id
      JOIN fee_types ft ON fv.fee_type_id = ft.id
      ORDER BY fv.created_at DESC
    `

    return NextResponse.json({ success: true, vouchers })
  } catch (error) {
    console.error("Get vouchers error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "accountant"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { student_id, fee_type_id, due_date } = await request.json()

    if (!student_id || !fee_type_id || !due_date) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Get fee type amount
    const feeType = await sql`
      SELECT amount FROM fee_types WHERE id = ${fee_type_id}
    `

    if (feeType.length === 0) {
      return NextResponse.json({ success: false, error: "Fee type not found" }, { status: 404 })
    }

    // Generate voucher number
    const voucherNumber = `FV${Date.now()}`

    await sql`
      INSERT INTO fee_vouchers (voucher_number, student_id, fee_type_id, amount, due_date, created_by)
      VALUES (${voucherNumber}, ${student_id}, ${fee_type_id}, ${feeType[0].amount}, ${due_date}, ${currentUser.id})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Create voucher error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
