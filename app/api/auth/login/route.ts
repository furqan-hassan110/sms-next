export const runtime = "nodejs";
import { type NextRequest, NextResponse } from "next/server"
import { signIn, getRedirectPath } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Login body:", body)

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const result = await signIn(email, password)
    console.log("SignIn result:", result)

    if (result.success && result.user) {
      const redirectPath = getRedirectPath(result.user.role)
      return NextResponse.json({
        success: true,
        user: result.user,
        redirectPath,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }
  } catch (error: any) {
    console.error("Login error:", error.message || error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
