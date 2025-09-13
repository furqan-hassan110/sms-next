import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Mock recent activities - in a real app, you'd have an activity log table
    const activities = [
      {
        id: 1,
        type: "payment",
        description: "Fee payment received from Ahmed Ali",
        timestamp: new Date().toISOString(),
        status: "success",
      },
      {
        id: 2,
        type: "voucher",
        description: "Monthly fee vouchers generated",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: "success",
      },
      {
        id: 3,
        type: "user",
        description: "New accountant user created",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: "success",
      },
    ]

    return NextResponse.json({ success: true, activities })
  } catch (error) {
    console.error("Get admin activity error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
