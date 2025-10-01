import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"
import { hashPassword } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const students = await sql`
      SELECT id, student_id, name, class, section, father_name, mother_name, 
             phone, address, admission_date, is_active, email
      FROM students
      WHERE is_active = true
      ORDER BY name
    `

    return NextResponse.json({ success: true, students })
  } catch (error) {
    console.error("Get students error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
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

    // Check if student ID already exists
    const existingStudent = await sql`
      SELECT id FROM students WHERE student_id = ${student_id}
    `

    if (existingStudent.length > 0) {
      return NextResponse.json({ success: false, error: "Student ID already exists" }, { status: 400 })
    }

    // Check if email already exists in users table
    if (email) {
      const existingEmail = await sql`
        SELECT id FROM users WHERE email = ${email}
      `
      if (existingEmail.length > 0) {
        return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 })
      }
    }

    if (!password) {
      return NextResponse.json({ success: false, error: "Password is required" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // TRANSACTION START - Dono tables mein ek saath entry
    let userId: number | null = null
    
    try {
      // Pehle users table mein entry create karo
      const userResult = await sql`
        INSERT INTO users (name, email, role, password_hash, is_active)
        VALUES (${name}, ${email}, 'student', ${passwordHash}, true)
        RETURNING id
      `

      userId = userResult[0].id

      // Phir students table mein entry create karo
      await sql`
        INSERT INTO students (id, student_id, name, class, section, father_name, mother_name, 
                             phone, address, admission_date, email, password_hash)
        VALUES (${userId}, ${student_id}, ${name}, ${studentClass}, ${section}, ${father_name}, 
               ${mother_name}, ${phone}, ${address}, ${admission_date}, ${email}, ${passwordHash})
      `

      return NextResponse.json({ success: true, message: "Student created successfully" })

    } catch (error: any) {
      // Agar error aaye to transaction rollback (users table se delete karo)
      if (userId) {
        await sql`DELETE FROM users WHERE id = ${userId}`
      }
      throw error;
    }

  } catch (error: any) {
    console.error("Create student error:", error)
    
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