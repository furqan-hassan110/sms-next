"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface DailyPayment {
  id: number
  student_name: string
  amount: number
  payment_date: string
  payment_method: string
  reference_number: string
}

interface DailyStats {
  totalCollection: number
  totalTransactions: number
  payments: DailyPayment[]
}

export default function DailyReportPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchDailyReport()
  }, [selectedDate])

  const fetchDailyReport = async () => {
    try {
      const response = await fetch(`/api/society/reports/daily?date=${selectedDate}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch daily report:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // Simple CSV export
    if (!stats?.payments.length) return
    
    const headers = ["Student Name", "Amount", "Payment Date", "Payment Method", "Reference Number"]
    const csvData = stats.payments.map(p => [
      p.student_name,
      p.amount,
      new Date(p.payment_date).toLocaleDateString(),
      p.payment_method,
      p.reference_number || 'N/A'
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daily-report-${selectedDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Report</h1>
          <p className="text-gray-600">View and export daily payment reports</p>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Report Date
          </CardTitle>
          <CardDescription>Select date to view daily report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <Button onClick={handleExport} disabled={!stats?.payments.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rs. {stats.totalCollection.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Collected on {new Date(selectedDate).toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Payments processed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Payments</CardTitle>
          <CardDescription>All payments processed on selected date</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading daily report...</div>
          ) : !stats?.payments.length ? (
            <div className="text-center py-8 text-gray-500">
              No payments found for {new Date(selectedDate).toLocaleDateString()}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.student_name}</TableCell>
                    <TableCell>Rs. {payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.reference_number || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleTimeString()}
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