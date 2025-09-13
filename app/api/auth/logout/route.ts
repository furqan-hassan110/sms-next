import { NextResponse } from "next/server"
import { signOut } from "@/lib/auth"

export async function POST() {
  try {
    await signOut()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
