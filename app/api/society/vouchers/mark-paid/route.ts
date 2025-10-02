import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const allowedRoles = ["society_member", "owner", "admin"]
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized role" }, { status: 401 })
    }

    // Get PAID vouchers only (vouchers WITH payments)
    const vouchers = await sql`
      SELECT 
        fv.id,
        fv.student_id,
        s.name as student_name,
        s.student_id as student_code,
        fv.amount as voucher_amount,
        fv.due_date,
        fv.created_at as voucher_created,
        fp.amount_paid,
        fp.payment_date,
        fp.payment_method,
        fp.reference_number,
        u.name as processed_by_name
      FROM fee_vouchers fv
      LEFT JOIN students s ON fv.student_id = s.id
      INNER JOIN fee_payments fp ON fv.id = fp.voucher_id
      LEFT JOIN users u ON fp.processed_by = u.id
      ORDER BY fp.payment_date DESC
    `

    const paidVouchers = vouchers.map(v => {
      const paymentDate = new Date(v.payment_date).getTime();
      const dueDate = new Date(v.due_date).getTime();
      const paidOnTime = paymentDate <= dueDate;
      
      return {
        id: v.id,
        student_id: v.student_code,
        student_name: v.student_name,
        voucher_amount: Number(v.voucher_amount || 0),
        amount_paid: Number(v.amount_paid || 0),
        due_date: v.due_date,
        payment_date: v.payment_date,
        payment_method: v.payment_method,
        reference_number: v.reference_number,
        processed_by: v.processed_by_name,
        paid_on_time: paidOnTime,
        voucher_created: v.voucher_created
      }
    })

    return NextResponse.json({ 
      success: true, 
      vouchers: paidVouchers
    })
  } catch (error) {
    console.error("Get paid vouchers error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Server error" 
    }, { status: 500 })
  }
}