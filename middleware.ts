// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login", "/api/auth/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // ✅ Check for session cookie
  const sessionToken = request.cookies.get("session")?.value
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  /**
   * ⚠️ NOTE:
   * Middleware runs on Edge → cannot check DB.
   * If you need role-based routing, store the role in the cookie/JWT payload.
   * Example: decode a JWT using Web Crypto APIs (Edge-compatible).
   */

  // Example: Role stored in cookie (string)
  const userRole = request.cookies.get("role")?.value

  if (pathname === "/") {
    // Redirect user to correct dashboard based on role
    const redirectPath = getRedirectPath(userRole)
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // ✅ Allow request to continue
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}

function getRedirectPath(role?: string): string {
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
