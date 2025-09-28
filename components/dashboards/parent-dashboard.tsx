"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, DollarSign, Calendar, AlertCircle, CheckCircle, Users, LogOut } from "lucide-react"

interface Student {
  id: number
  student_id: string
  name: string
  class: string
  section: string
  father_name: string
  mother_name: string
}

interface StudentFee {
  id: number
  student_id: string
  student_name: string
  class: string
  section: string
  fee_type: string
  amount: number
  due_date: string
  status: "paid" | "pending" | "overdue"
  payment_date?: string
}

interface ParentDashboardData {
  totalStudents: number
  totalPendingFees: number
  totalPaidFees: number
  totalDueAmount: number
  nextMonthFees: number
  studentFees: StudentFee[]
  students: Student[]
}

export function ParentDashboard() {
  const [data, setData] = useState<ParentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchParentData()
  }, [])

  const fetchParentData = async () => {
    try {
      const response = await fetch("/api/parent/dashboard")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        console.error("Failed to fetch data:", result.error)
      }
    } catch (error) {
      console.error("Failed to fetch parent data:", error)
    } finally {
      setLoading(false)
    }
  }

  // const handleLogout = async () => {
  //   try {
  //     setLoggingOut(true)
  //     const res = await fetch("/api/auth/logout", { method: "POST" }) // ✅ same as sidebar
  //     if (res.ok) {
  //       router.push("/login")
  //       router.refresh()
  //     } else {
  //       console.error("Logout failed")
  //     }
  //   } catch (err) {
  //     console.error("Logout error:", err)
  //   } finally {
  //     setLoggingOut(false)
  //   }
  // }

  const handleLogout = async () => {
  try {
    setLoggingOut(true);
    const res = await fetch("/api/auth/logout", {
      method: "POST",
    })

    if (res.ok) {
      router.push("/login")
      router.refresh()
    } else {
      console.error("Logout failed", res.status)
    }
  } catch (err) {
    console.error("Logout error:", err)
  }finally{
    setLoggingOut(false)
  }
}


  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Logout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600">Overview of your children's fees and payments</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span>{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Your children</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalPendingFees || 0}</div>
            <p className="text-xs text-muted-foreground">Require payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Month Fees</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {(data?.nextMonthFees || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Upcoming payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {(data?.totalDueAmount || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Children</CardTitle>
          <CardDescription>Students linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.students && data.students.length > 0 ? (
              data.students.map((student) => (
                <div key={student.id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-gray-600">
                        {student.class} - {student.section}
                      </p>
                      <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No students found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Details</CardTitle>
          <CardDescription>All fee records for your children</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.studentFees && data.studentFees.length > 0 ? (
              data.studentFees.map((fee) => (
                <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {fee.status === "paid" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {fee.status === "pending" && <AlertCircle className="h-5 w-5 text-orange-500" />}
                      {fee.status === "overdue" && <AlertCircle className="h-5 w-5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{fee.student_name}</p>
                      <p className="text-sm text-gray-500">
                        {fee.class} - {fee.section} | {fee.fee_type}
                      </p>
                      <p className="text-xs text-gray-400">
                        Due: {new Date(fee.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rs. {fee.amount.toLocaleString()}</p>
                    <Badge
                      variant={
                        fee.status === "paid"
                          ? "default"
                          : fee.status === "overdue"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {fee.status.toUpperCase()}
                    </Badge>
                    {fee.payment_date && (
                      <p className="text-xs text-gray-500">
                        Paid: {new Date(fee.payment_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No fee records found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
