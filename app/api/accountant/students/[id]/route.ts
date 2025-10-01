import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"
import { hashPassword } from "@/lib/auth"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "accountant") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const {
      student_id,
      name,
      class: studentClass,
      section,
      father_name,
      mother_name,
      phone,
      address,
      admission_date,
      email,
      password
    } = await request.json()
    
    const studentId = Number.parseInt(params.id)

    // Check if student exists
    const existingStudent = await sql`
      SELECT id FROM students WHERE id = ${studentId}
    `

    if (existingStudent.length === 0) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 })
    }

    // Check if student ID already exists for other students
    const existingStudentID = await sql`
      SELECT id FROM students WHERE student_id = ${student_id} AND id != ${studentId}
    `

    if (existingStudentID.length > 0) {
      return NextResponse.json({ success: false, error: "Student ID already exists" }, { status: 400 })
    }

    // Check if email already exists for other users
    if (email) {
      const existingEmail = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${studentId}
      `
      if (existingEmail.length > 0) {
        return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 })
      }
    }

    // Hash password if provided
    let passwordHash = null
    if (password) {
      passwordHash = await hashPassword(password)
    }

    // Dono tables update karo
    // Pehle users table update karo
    let userUpdateQuery = `
      UPDATE users 
      SET name = $1, email = $2, updated_at = NOW()
    `
    const userParams = [name, email]

    if (password) {
      userUpdateQuery += `, password_hash = $3`
      userParams.push(passwordHash)
    }

    userUpdateQuery += ` WHERE id = $${userParams.length + 1}`
    userParams.push(studentId)

    await sql.unsafe(userUpdateQuery, userParams)

    // Phir students table update karo
    let studentUpdateQuery = `
      UPDATE students 
      SET student_id = $1, name = $2, class = $3, section = $4, 
          father_name = $5, mother_name = $6, phone = $7, 
          address = $8, admission_date = $9, email = $10, updated_at = NOW()
    `
    const studentParams = [
      student_id, name, studentClass, section, father_name, 
      mother_name, phone, address, admission_date, email
    ]

    if (password) {
      studentUpdateQuery += `, password_hash = $${studentParams.length + 1}`
      studentParams.push(passwordHash)
    }

    studentUpdateQuery += ` WHERE id = $${studentParams.length + 1}`
    studentParams.push(studentId)

    await sql.unsafe(studentUpdateQuery, studentParams)

    return NextResponse.json({ success: true, message: "Student updated successfully" })

  } catch (error: any) {
    console.error("Update student error:", error)
    
    if (error.code === '23505') {
      if (error.constraint === 'users_email_key') {
        return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 })
      }
      if (error.constraint === 'students_email_key') {
        return NextResponse.json({ success: false, error: "Email already exists in students" }, { status: 400 })
      }
    }
    
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const studentId = Number.parseInt(params.id)

    // Users table mein is_active false karo, students table automatically update ho jayega CASCADE se
    await sql`
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${studentId}
    `

    return NextResponse.json({ success: true, message: "Student deleted successfully" })
  } catch (error) {
    console.error("Delete student error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}