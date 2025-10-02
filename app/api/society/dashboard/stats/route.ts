// In /app/api/society/dashboard/stats/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    console.log("Current user:", currentUser)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // FIX: Include society_member in allowed roles
    const allowedRoles = ["society", "society_member", "owner", "admin"]
    if (!allowedRoles.includes(currentUser.role)) {
      console.log("User role not allowed:", currentUser.role)
      return NextResponse.json({ success: false, error: "Unauthorized role" }, { status: 401 })
    }

    // Rest of your code remains the same...
    const today = new Date().toISOString().split('T')[0]
    const todayCollection = await sql`
      SELECT COALESCE(SUM(amount_paid), 0) as total
      FROM fee_payments 
      WHERE DATE(payment_date) = ${today}
    `

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const monthlyCollection = await sql`
      SELECT COALESCE(SUM(amount_paid), 0) as total
      FROM fee_payments 
      WHERE EXTRACT(MONTH FROM payment_date) = ${currentMonth}
      AND EXTRACT(YEAR FROM payment_date) = ${currentYear}
    `

    const pendingVouchers = await sql`
      SELECT COUNT(*) as count
      FROM fee_vouchers fv
      LEFT JOIN fee_payments fp ON fv.id = fp.voucher_id
      WHERE fp.id IS NULL
    `

    const recentPayments = await sql`
      SELECT 
        fp.id,
        fp.reference_number as voucher_number,
        s.name as student_name,
        fp.amount_paid as amount,
        fp.payment_date,
        'paid' as status
      FROM fee_payments fp
      LEFT JOIN students s ON fp.voucher_id = s.id
      ORDER BY fp.payment_date DESC
      LIMIT 10
    `

    const stats = {
      todayCollection: Number(todayCollection[0]?.total || 0),
      monthlyCollection: Number(monthlyCollection[0]?.total || 0),
      pendingVouchers: Number(pendingVouchers[0]?.count || 0),
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        student_name: payment.student_name || 'Unknown Student',
        amount: Number(payment.amount || 0),
        payment_date: payment.payment_date,
        voucher_number: payment.voucher_number || `V-${payment.id}`
      }))
    }

    return NextResponse.json({ 
      success: true, 
      stats 
    })
  } catch (error) {
    console.error("Society dashboard stats error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Server error" 
    }, { status: 500 })
  }
}