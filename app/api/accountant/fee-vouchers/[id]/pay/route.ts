import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "accountant", "society_member"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { payment_method, reference_number, notes } = await request.json()
    const voucherId = Number.parseInt(params.id)

    // Get voucher details
    const voucher = await sql`
      SELECT id, amount, status FROM fee_vouchers WHERE id = ${voucherId}
    `

    if (voucher.length === 0) {
      return NextResponse.json({ success: false, error: "Voucher not found" }, { status: 404 })
    }

    if (voucher[0].status === "paid") {
      return NextResponse.json({ success: false, error: "Voucher is already paid" }, { status: 400 })
    }

    // Update voucher status
    await sql`
      UPDATE fee_vouchers 
      SET status = 'paid', payment_date = NOW(), payment_method = ${payment_method || "cash"}, updated_at = NOW()
      WHERE id = ${voucherId}
    `

    // Record payment
    await sql`
      INSERT INTO fee_payments (voucher_id, amount_paid, payment_method, reference_number, processed_by, notes)
      VALUES (${voucherId}, ${voucher[0].amount}, ${payment_method || "cash"}, ${reference_number || null}, ${currentUser.id}, ${notes || null})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Process payment error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
