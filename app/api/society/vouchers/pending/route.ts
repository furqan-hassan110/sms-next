import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Allow society_member, owner, admin roles
    const allowedRoles = ["society_member", "owner", "admin"]
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized role" }, { status: 401 })
    }

    // Get pending vouchers (vouchers without payments) - SIMPLIFIED
    const vouchers = await sql`
      SELECT 
        fv.id,
        fv.student_id,
        s.name as student_name,
        s.student_id as student_code,
        fv.amount,
        fv.due_date,
        fv.created_at
      FROM fee_vouchers fv
      LEFT JOIN students s ON fv.student_id = s.id
      LEFT JOIN fee_payments fp ON fv.id = fp.voucher_id
      WHERE fp.id IS NULL
      ORDER BY fv.due_date ASC
    `

    // Calculate days overdue in JavaScript instead of SQL
    const vouchersWithOverdue = vouchers.map(v => {
      const dueDate = new Date(v.due_date).getTime(); // Convert to timestamp
      const today = new Date().getTime(); // Convert to timestamp
      const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)))
      
      return {
        id: v.id,
        student_id: v.student_code,
        student_name: v.student_name,
        amount: Number(v.amount || 0),
        due_date: v.due_date,
        created_at: v.created_at,
        days_overdue: daysOverdue
      }
    })

    return NextResponse.json({ 
      success: true, 
      vouchers: vouchersWithOverdue
    })
  } catch (error) {
    console.error("Get pending vouchers error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Server error" 
    }, { status: 500 })
  }
}