"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface PendingVoucher {
  id: number
  student_name: string
  student_id: string
  amount: number
  due_date: string
  created_at: string
  days_overdue: number
}

export default function ViewPendingPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<PendingVoucher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingVouchers()
  }, [])

  const fetchPendingVouchers = async () => {
    try {
      const response = await fetch("/api/society/vouchers/pending")
      const data = await response.json()
      
      if (data.success) {
        setVouchers(data.vouchers)
      }
    } catch (error) {
      console.error("Failed to fetch pending vouchers:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (daysOverdue: number) => {
    if (daysOverdue > 30) {
      return <Badge className="bg-red-100 text-red-800">Overdue ({daysOverdue}d)</Badge>
    } else if (daysOverdue > 7) {
      return <Badge className="bg-orange-100 text-orange-800">Due Soon ({daysOverdue}d)</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">View Pending</h1>
          <p className="text-gray-600">View all pending fee vouchers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Pending Vouchers ({vouchers.length})
          </CardTitle>
          <CardDescription>All unpaid fee vouchers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading pending vouchers...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending vouchers found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">V-{voucher.id}</TableCell>
                    <TableCell>{voucher.student_name}</TableCell>
                    <TableCell>{voucher.student_id}</TableCell>
                    <TableCell>Rs. {voucher.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(voucher.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>{voucher.days_overdue || 0}</TableCell>
                    <TableCell>
                      {getStatusBadge(voucher.days_overdue || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}