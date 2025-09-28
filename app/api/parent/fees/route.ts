// app/api/parent/fee/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get parent's linked students using parent_student table
    const students = await sql`
      SELECT s.id, s.student_id, s.name, s.class, s.section
      FROM students s
      INNER JOIN parent_student ps ON s.id = ps.student_id
      INNER JOIN parents p ON ps.parent_id = p.id
      WHERE p.user_id = ${currentUser.id}
    `

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, error: "No students linked to this parent" },
        { status: 400 }
      )
    }

    const studentIds = students.map(s => s.id)

    // Get fee details for all linked students
    const fees = await sql`
      SELECT 
        sf.id,
        sf.student_id,
        s.student_id as student_code,
        s.name as student_name,
        s.class,
        s.section,
        sf.fee_type,
        sf.amount,
        sf.due_date,
        sf.status,
        sf.payment_date,
        COALESCE(sf.paid_amount, 0) as paid_amount,
        (sf.amount - COALESCE(sf.paid_amount, 0)) AS remaining
      FROM student_fees sf
      INNER JOIN students s ON sf.student_id = s.id
      WHERE sf.student_id IN (${studentIds.join(',')})
      ORDER BY sf.due_date DESC
    `

    return NextResponse.json({
      success: true,
      data: fees.map(fee => ({
        id: fee.id,
        student_id: fee.student_id,
        student_code: fee.student_code,
        student_name: fee.student_name,
        class: fee.class,
        section: fee.section,
        fee_type: fee.fee_type,
        amount: Number(fee.amount),
        paid_amount: Number(fee.paid_amount),
        remaining: Number(fee.remaining),
        due_date: fee.due_date,
        status: fee.status,
        payment_date: fee.payment_date
      }))
    })
  } catch (error) {
    console.error("Fetch parent fees error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}