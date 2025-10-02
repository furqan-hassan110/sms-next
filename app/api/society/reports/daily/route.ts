import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get daily payments
    const payments = await sql`
      SELECT 
        fp.id,
        s.name as student_name,
        fp.amount_paid as amount,
        fp.payment_date,
        fp.payment_method,
        fp.reference_number
      FROM fee_payments fp
      LEFT JOIN students s ON fp.voucher_id = s.id
      WHERE DATE(fp.payment_date) = ${date}
      ORDER BY fp.payment_date DESC
    `

    // Calculate totals
    const totalCollection = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const totalTransactions = payments.length

    const stats = {
      totalCollection,
      totalTransactions,
      payments: payments.map(p => ({
        id: p.id,
        student_name: p.student_name || 'Unknown Student',
        amount: Number(p.amount || 0),
        payment_date: p.payment_date,
        payment_method: p.payment_method,
        reference_number: p.reference_number
      }))
    }

    return NextResponse.json({ 
      success: true, 
      stats 
    })
  } catch (error) {
    console.error("Daily report error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Server error" 
    }, { status: 500 })
  }
}