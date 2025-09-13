"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, FileText, DollarSign, Users, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: number
  student_id: string
  name: string
  class: string
  section: string
}

interface FeeType {
  id: number
  name: string
  amount: number
}

interface FeeVoucher {
  id: number
  voucher_number: string
  student_name: string
  student_id: string
  fee_type_name: string
  amount: number
  due_date: string
  status: string
  created_at: string
}

export function FeeManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false)
  const { toast } = useToast()

  const [voucherForm, setVoucherForm] = useState({
    student_id: "",
    fee_type_id: "",
    due_date: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [studentsRes, feeTypesRes, vouchersRes] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/fee-types"),
        fetch("/api/admin/fee-vouchers"),
      ])

      const [studentsData, feeTypesData, vouchersData] = await Promise.all([
        studentsRes.json(),
        feeTypesRes.json(),
        vouchersRes.json(),
      ])

      if (studentsData.success) setStudents(studentsData.students)
      if (feeTypesData.success) setFeeTypes(feeTypesData.feeTypes)
      if (vouchersData.success) setVouchers(vouchersData.vouchers)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/admin/fee-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voucherForm),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Fee voucher created successfully",
        })
        setIsVoucherDialogOpen(false)
        setVoucherForm({ student_id: "", fee_type_id: "", due_date: "" })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create voucher",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsPaid = async (voucherId: number) => {
    try {
      const response = await fetch(`/api/admin/fee-vouchers/${voucherId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: "cash" }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Payment recorded successfully",
        })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to record payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredVouchers = vouchers.filter(
    (voucher) =>
      voucher.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    totalVouchers: vouchers.length,
    paidVouchers: vouchers.filter((v) => v.status === "paid").length,
    pendingVouchers: vouchers.filter((v) => v.status === "pending").length,
    totalAmount: vouchers.reduce((sum, v) => sum + v.amount, 0),
    paidAmount: vouchers.filter((v) => v.status === "paid").reduce((sum, v) => sum + v.amount, 0),
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vouchers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVouchers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Vouchers</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidVouchers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Vouchers</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingVouchers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalVouchers > 0 ? Math.round((stats.paidVouchers / stats.totalVouchers) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vouchers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vouchers">Fee Vouchers</TabsTrigger>
          <TabsTrigger value="types">Fee Types</TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers" className="space-y-4">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog open={isVoucherDialogOpen} onOpenChange={setIsVoucherDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Voucher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Fee Voucher</DialogTitle>
                  <DialogDescription>Generate a new fee voucher for a student</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateVoucher} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student">Student</Label>
                    <Select
                      value={voucherForm.student_id}
                      onValueChange={(value) => setVoucherForm({ ...voucherForm, student_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name} ({student.student_id}) - {student.class} {student.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fee_type">Fee Type</Label>
                    <Select
                      value={voucherForm.fee_type_id}
                      onValueChange={(value) => setVoucherForm({ ...voucherForm, fee_type_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeTypes.map((feeType) => (
                          <SelectItem key={feeType.id} value={feeType.id.toString()}>
                            {feeType.name} - Rs. {feeType.amount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={voucherForm.due_date}
                      onChange={(e) => setVoucherForm({ ...voucherForm, due_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsVoucherDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Voucher</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Vouchers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Vouchers</CardTitle>
              <CardDescription>Manage student fee vouchers and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-medium">{voucher.voucher_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{voucher.student_name}</div>
                          <div className="text-sm text-gray-500">{voucher.student_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{voucher.fee_type_name}</TableCell>
                      <TableCell>Rs. {voucher.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(voucher.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(voucher.status)}>{voucher.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {voucher.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(voucher.id)}>
                            Mark as Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Fee Types</CardTitle>
              <CardDescription>Manage different types of fees</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeTypes.map((feeType) => (
                    <TableRow key={feeType.id}>
                      <TableCell className="font-medium">{feeType.name}</TableCell>
                      <TableCell>Rs. {feeType.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge>Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
