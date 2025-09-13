import postgres from "postgres"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Create connection pool
export const sql = postgres(process.env.DATABASE_URL, {
  ssl: false, // required for local Postgres
})

// =============================
// User Queries
// =============================

export async function getUserByEmail(email: string) {
  const result = await sql/*sql*/`
    SELECT id, email, password_hash, name, role, is_active
    FROM users
    WHERE email = ${email} AND is_active = true
  `
  return result[0] || null
}


export async function getUserById(id: number) {
  const result = await sql/*sql*/`
    SELECT id, email, name, role, is_active 
    FROM users 
    WHERE id = ${id} AND is_active = true
  `
  return result[0] || null
}

// =============================
// Session Queries
// =============================

export async function createSession(userId: number, sessionToken: string, expiresAt: Date) {
  await sql/*sql*/`
    INSERT INTO user_sessions (user_id, session_token, expires_at)
    VALUES (${userId}, ${sessionToken}, ${expiresAt})
  `
}

export async function getSessionByToken(sessionToken: string) {
  const result = await sql/*sql*/`
    SELECT s.id, s.user_id, s.expires_at, u.email, u.name, u.role
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
  `
  return result[0] || null
}

export async function deleteSession(sessionToken: string) {
  await sql/*sql*/`
    DELETE FROM user_sessions 
    WHERE session_token = ${sessionToken}
  `
}

// =============================
// Students & Fees
// =============================

export async function getStudents(limit = 50, offset = 0) {
  return await sql/*sql*/`
    SELECT * FROM students 
    WHERE is_active = true 
    ORDER BY name 
    LIMIT ${limit} OFFSET ${offset}
  `
}

export async function getFeeVouchers(studentId?: number, status?: string) {
  let query = `
    SELECT fv.*, s.name as student_name, s.student_id, ft.name as fee_type_name
    FROM fee_vouchers fv
    JOIN students s ON fv.student_id = s.id
    JOIN fee_types ft ON fv.fee_type_id = ft.id
    WHERE 1=1
  `

  const params: any[] = []

  if (studentId) {
    query += ` AND fv.student_id = $${params.length + 1}`
    params.push(studentId)
  }

  if (status) {
    query += ` AND fv.status = $${params.length + 1}`
    params.push(status)
  }

  query += ` ORDER BY fv.created_at DESC`

  return await sql.unsafe(query, params)
}

export async function getFeeTypes() {
  return await sql/*sql*/`
    SELECT * FROM fee_types 
    WHERE is_active = true 
    ORDER BY name
  `
}
