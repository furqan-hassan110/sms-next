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

export function AccountantFeeManagement() {
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
        fetch("/api/accountant/students"),
        fetch("/api/accountant/fee-types"),
        fetch("/api/accountant/fee-vouchers"),
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
      const response = await fetch("/api/accountant/fee-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voucherForm),
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Success", description: "Fee voucher created successfully" })
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
    } catch {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" })
    }
  }

  const handleMarkAsPaid = async (voucherId: number) => {
    try {
      const response = await fetch(`/api/accountant/fee-vouchers/${voucherId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: "cash" }),
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Success", description: "Payment recorded successfully" })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to record payment",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" })
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fee Management</h1>
        <Dialog open={isVoucherDialogOpen} onOpenChange={setIsVoucherDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Create Voucher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Fee Voucher</DialogTitle>
              <DialogDescription>Generate a new fee voucher for a student</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <Label>Student</Label>
                <Select
                  value={voucherForm.student_id}
                  onValueChange={(val) => setVoucherForm({ ...voucherForm, student_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} ({s.student_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fee Type</Label>
                <Select
                  value={voucherForm.fee_type_id}
                  onValueChange={(val) => setVoucherForm({ ...voucherForm, fee_type_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypes.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.name} - Rs. {f.amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={voucherForm.due_date}
                  onChange={(e) => setVoucherForm({ ...voucherForm, due_date: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Create Voucher
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Vouchers</CardTitle>
            <CardDescription>All generated vouchers</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalVouchers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid Vouchers</CardTitle>
          </CardHeader>
          <CardContent className="text-green-600 text-2xl font-bold">{stats.paidVouchers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Vouchers</CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-600 text-2xl font-bold">{stats.pendingVouchers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-600 text-2xl font-bold">Rs. {stats.totalAmount}</CardContent>
        </Card>
      </div>

      {/* Search + Table */}
      <div>
        <div className="flex items-center mb-4">
          <Search className="h-4 w-4 mr-2" />
          <Input
            placeholder="Search vouchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Fee Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVouchers.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.voucher_number}</TableCell>
                <TableCell>{v.student_name}</TableCell>
                <TableCell>{v.fee_type_name}</TableCell>
                <TableCell>Rs. {v.amount}</TableCell>
                <TableCell>{new Date(v.due_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(v.status)}>{v.status}</Badge>
                </TableCell>
                <TableCell>
                  {v.status !== "paid" && (
                    <Button size="sm" onClick={() => handleMarkAsPaid(v.id)}>
                      Mark as Paid
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

