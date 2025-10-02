"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Calendar, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface PaidVoucher {
  id: number
  student_name: string
  student_id: string
  voucher_amount: number
  amount_paid: number
  due_date: string
  payment_date: string
  payment_method: string
  reference_number: string
  processed_by: string
  paid_on_time: boolean
  voucher_created: string
}

export default function PaidVouchersPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<PaidVoucher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaidVouchers()
  }, [])

  const fetchPaidVouchers = async () => {
    try {
      const response = await fetch("/api/society/vouchers/mark-paid") // Same endpoint but now returns paid vouchers
      const data = await response.json()
      
      if (data.success) {
        setVouchers(data.vouchers)
      }
    } catch (error) {
      console.error("Failed to fetch paid vouchers:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600">View all completed payments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Paid Vouchers
          </CardTitle>
          <CardDescription>All successfully processed payments in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading payment history...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No paid vouchers found
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
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Processed By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">V-{voucher.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {voucher.student_name}
                      </div>
                    </TableCell>
                    <TableCell>{voucher.student_id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">Rs. {voucher.amount_paid.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">of Rs. {voucher.voucher_amount.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        {new Date(voucher.due_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-green-500" />
                        {new Date(voucher.payment_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {voucher.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell>{voucher.processed_by || "System"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={voucher.paid_on_time ? "text-green-600 border-green-200" : "text-orange-600 border-orange-200"}
                      >
                        {voucher.paid_on_time ? "On Time" : "Late Payment"}
                      </Badge>
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