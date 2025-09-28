// app/api/parent/dashboard/route.ts
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

    // Get fee records
    const studentFees = await sql`
      SELECT 
        sf.id,
        sf.student_id,
        sf.fee_type,
        sf.amount,
        sf.due_date,
        sf.status,
        sf.payment_date
      FROM student_fees sf
      WHERE sf.student_id IN (${studentIds.join(',')})
      ORDER BY sf.due_date DESC
    `

    // Calculate statistics
    const totalStudents = students.length
    const totalPendingFees = studentFees.filter(fee => fee.status === 'pending').length
    const totalDueAmount = studentFees
      .filter(fee => fee.status === 'pending' || fee.status === 'overdue')
      .reduce((sum, fee) => sum + Number(fee.amount), 0)

    // Calculate next month fees
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextMonthFees = studentFees
      .filter(fee => {
        const dueDate = new Date(fee.due_date)
        return dueDate.getMonth() === nextMonth.getMonth() && 
               dueDate.getFullYear() === nextMonth.getFullYear()
      })
      .reduce((sum, fee) => sum + Number(fee.amount), 0)

    const dashboardData = {
      totalStudents,
      totalPendingFees,
      totalDueAmount,
      nextMonthFees,
      studentFees: studentFees.map(fee => {
        const student = students.find(s => s.id === fee.student_id)
        return {
          id: fee.id,
          student_id: student?.student_id || '',
          student_name: student?.name || '',
          class: student?.class || '',
          section: student?.section || '',
          fee_type: fee.fee_type,
          amount: Number(fee.amount),
          due_date: fee.due_date,
          status: fee.status,
          payment_date: fee.payment_date
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