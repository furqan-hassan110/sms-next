import type React from "react"
import { getCurrentUser } from "@/lib/auth"
import { Sidebar } from "./sidebar"
import { redirect } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser()
  console.log(user)

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={user.role} userName={user.name} />
      <div className="md:ml-64">
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
