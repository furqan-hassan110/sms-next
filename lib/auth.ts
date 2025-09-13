import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { getUserByEmail, createSession, getSessionByToken, deleteSession } from "./database"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createJWT(payload: any): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(JWT_SECRET)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function signIn(email: string, password: string) {
  const user = await getUserByEmail(email)
  console.log("User from DB:", user)

  if (!user) {
    console.log("❌ No user found for email:", email)
    return { success: false, error: "Invalid credentials" }
  }

  const isValid = await verifyPassword(password, user.password_hash)
  console.log("🔑 Password check:", { plain: password, hash: user.password_hash, match: isValid })

  if (!isValid) {
    return { success: false, error: "Invalid credentials" }
  }

  const sessionToken = await createJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await createSession(user.id, sessionToken, expiresAt)

  const cookieStore = cookies()
  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}


export async function signOut() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session")?.value

  if (sessionToken) {
    await deleteSession(sessionToken)
    cookieStore.delete("session")
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session")?.value

  if (!sessionToken) return null

  const session = await getSessionByToken(sessionToken)
  return session
    ? {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
      }
    : null
}

export function getRedirectPath(role: string): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard"
    case "principal":
      return "/principal/dashboard"
    case "society_member":
      return "/society/dashboard"
    case "accountant":
      return "/accountant/dashboard"
    default:
      return "/dashboard"
  }
}
