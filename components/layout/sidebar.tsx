"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, GraduationCap, CreditCard, BarChart3, Settings, LogOut, Menu, X, Home } from "lucide-react"

interface SidebarProps {
  userRole: string
  userName: string
}

const roleMenus = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/students", label: "Students", icon: GraduationCap },
    { href: "/admin/fees", label: "Fee Management", icon: CreditCard },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  principal: [
    { href: "/principal/dashboard", label: "Dashboard", icon: Home },
    { href: "/principal/students", label: "Students", icon: GraduationCap },
    { href: "/principal/fees", label: "Fee Overview", icon: CreditCard },
    { href: "/principal/reports", label: "Reports", icon: BarChart3 },
  ],
  society_member: [
    { href: "/society/dashboard", label: "Dashboard", icon: Home },
    { href: "/society/fees", label: "Fee Collection", icon: CreditCard },
    { href: "/society/reports", label: "Fee Reports", icon: BarChart3 },
  ],
  accountant: [
    { href: "/accountant/dashboard", label: "Dashboard", icon: Home },
    { href: "/accountant/fees", label: "Fee Management", icon: CreditCard },
    { href: "/accountant/payments", label: "Payments", icon: CreditCard },
    { href: "/accountant/reports", label: "Financial Reports", icon: BarChart3 },
  ],
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = roleMenus[userRole as keyof typeof roleMenus] || []

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">School Management</h2>
            <p className="text-sm text-gray-600 capitalize">{userRole.replace("_", " ")}</p>
            <p className="text-xs text-gray-500">{userName}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "bg-blue-100 text-blue-900" : "text-gray-700 hover:bg-gray-100",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
