// app/api/parent/dashboard/route.ts - FIXED VERSION
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "parent") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get parent's linked students
    const students = await sql`
      SELECT s.id, s.student_id, s.name, s.class, s.section, s.father_name, s.mother_name
      FROM students s
      INNER JOIN parent_student ps ON s.id = ps.student_id
      INNER JOIN parents p ON ps.parent_id = p.id
      WHERE p.user_id = ${currentUser.id}
    `

    if (students.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: {
          totalStudents: 0,
          totalPendingFees: 0,
          totalDueAmount: 0,
          nextMonthFees: 0,
          studentFees: [],
          students: []
        }
      })
    }

    const studentIds = students.map(s => s.id)

    // Get ALL vouchers with their payment status - FIXED: using sql() for array
    const vouchersWithStatus = await sql`
      SELECT 
        fv.id,
        fv.student_id,
        fv.amount,
        fv.due_date,
        fv.created_at,
        CASE 
          WHEN fp.id IS NOT NULL THEN 'paid'
          ELSE 'pending'
        END as status,
        fp.payment_date,
        fp.payment_method,
        fp.reference_number
      FROM fee_vouchers fv
      LEFT JOIN fee_payments fp ON fv.id = fp.voucher_id
      WHERE fv.student_id IN ${sql(studentIds)}
      ORDER BY fv.due_date DESC
    `

    // Get separate paid fees for statistics - FIXED: using sql() for array
    const paidFees = await sql`
      SELECT 
        id,
        voucher_id as student_id,
        amount_paid as amount,
        payment_date
      FROM fee_payments 
      WHERE voucher_id IN ${sql(studentIds)}
    `

    // Calculate statistics
    const totalStudents = students.length
    const totalPendingFees = vouchersWithStatus.filter(fee => fee.status === 'pending').length
    const totalDueAmount = vouchersWithStatus
      .filter(fee => fee.status === 'pending')
      .reduce((sum, fee) => sum + Number(fee.amount || 0), 0)
    
    const totalPaidAmount = paidFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0)

    // Calculate next month pending fees
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextMonthFees = vouchersWithStatus
      .filter(fee => {
        if (!fee.due_date || fee.status === 'paid') return false
        const dueDate = new Date(fee.due_date)
        return dueDate.getMonth() === nextMonth.getMonth() && 
               dueDate.getFullYear() === nextMonth.getFullYear()
      })
      .reduce((sum, fee) => sum + Number(fee.amount || 0), 0)

    const dashboardData = {
      totalStudents,
      totalPendingFees,
      totalDueAmount,
      totalPaidAmount,
      nextMonthFees,
      studentFees: vouchersWithStatus.map(fee => {
        const student = students.find(s => s.id === fee.student_id)
        return {
          id: fee.id,
          student_id: student?.student_id || '',
          student_name: student?.name || '',
          class: student?.class || '',
          section: student?.section || '',
          fee_type: fee.payment_method || 'Fee Voucher',
          amount: Number(fee.amount || 0),
          due_date: fee.due_date,
          payment_date: fee.payment_date,
          status: fee.status,
          reference_number: fee.reference_number
        }
      }),
      students: students.map(student => ({
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        class: student.class,
        section: student.section,
        father_name: student.father_name,
        mother_name: student.mother_name
      }))
    }

    return NextResponse.json({ 
      success: true, 
      data: dashboardData 
    })
  } catch (error) {
    console.error("Parent dashboard error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Server error" 
    }, { status: 500 })
  }
}