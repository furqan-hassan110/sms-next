import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Get basic counts
    const [users, students, vouchers, payments] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users WHERE is_active = true`,
      sql`SELECT COUNT(*) as count FROM students WHERE is_active = true`,
      sql`SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid, COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending FROM fee_vouchers`,
      sql`SELECT SUM(amount_paid) as total, SUM(CASE WHEN DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE) THEN amount_paid ELSE 0 END) as monthly FROM fee_payments`,
    ])

    const stats = {
      totalUsers: Number.parseInt(users[0].count),
      totalStudents: Number.parseInt(students[0].count),
      totalVouchers: Number.parseInt(vouchers[0].total),
      paidVouchers: Number.parseInt(vouchers[0].paid),
      pendingVouchers: Number.parseInt(vouchers[0].pending),
      totalRevenue: Number.parseFloat(payments[0].total) || 0,
      monthlyRevenue: Number.parseFloat(payments[0].monthly) || 0,
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error("Get admin stats error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
