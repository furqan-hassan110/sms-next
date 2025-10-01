"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Plus, Edit, Trash2, Search, Users, GraduationCap, Link, Unlink } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface User {
  id: number
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
  parent_info?: {
    cnic: string
    phone: string
    address: string
    occupation: string
    emergency_contact: string
  }
}

interface Student {
  id: number
  student_id: string
  name: string
  class: string
  section: string
  father_name: string
  mother_name: string
  phone: string
  address: string
  admission_date: string
  is_active: boolean
  email: string
  password_hash?: string
}

interface ParentStudentLink {
  id: number
  student_id: number
  student_name: string
  student_class: string
  relationship: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [selectedParent, setSelectedParent] = useState<User | null>(null)
  const [parentStudentLinks, setParentStudentLinks] = useState<ParentStudentLink[]>([])
  const [activeTab, setActiveTab] = useState("users")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    cnic: "",
    phone: "",
    address: "",
    occupation: "",
    emergency_contact: "",
    studentIds: [] as string[]
  })

  const [studentFormData, setStudentFormData] = useState({
    student_id: "",
    name: "",
    class: "",
    section: "",
    father_name: "",
    mother_name: "",
    phone: "",
    address: "",
    admission_date: "",
    email: "",
    password: "",
  })

  const [linkFormData, setLinkFormData] = useState({
    studentId: "",
    relationship: "parent"
  })

  useEffect(() => {
    fetchUsers()
    fetchStudents()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/admin/students")
      const data = await response.json()
      if (data.success) {
        setStudents(data.students)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      })
    }
  }

  const fetchParentStudentLinks = async (parentId: number) => {
    try {
      const response = await fetch(`/api/admin/parent/${parentId}/students`)
      const data = await response.json()
      if (data.success) {
        setParentStudentLinks(data.links)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch student links",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users"
      const method = editingUser ? "PUT" : "POST"

      const submitData = formData.role === "parent" 
        ? {
            ...formData,
            studentIds: formData.studentIds.map(id => parseInt(id))
          }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: editingUser ? "User updated successfully" : "User created successfully",
        })
        setIsDialogOpen(false)
        resetForm()
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Operation failed",
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

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingStudent ? `/api/admin/students/${editingStudent.id}` : "/api/admin/students"
      const method = editingStudent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentFormData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: editingStudent ? "Student updated successfully" : "Student created successfully",
        })
        setIsDialogOpen(false)
        resetStudentForm()
        fetchStudents()
      } else {
        toast({
          title: "Error",
          description: data.error || "Operation failed",
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

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedParent) return

    try {
      const response = await fetch(`/api/admin/parent/${selectedParent.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkFormData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Student linked successfully",
        })
        setIsLinkDialogOpen(false)
        setLinkFormData({ studentId: "", relationship: "parent" })
        fetchParentStudentLinks(selectedParent.id)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to link student",
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

  const handleUnlinkStudent = async (linkId: number) => {
    if (!selectedParent) return

    try {
      const response = await fetch(`/api/admin/parent/${selectedParent.id}/students/${linkId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Student unlinked successfully",
        })
        fetchParentStudentLinks(selectedParent.id)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to unlink student",
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

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      cnic: user.parent_info?.cnic || "",
      phone: user.parent_info?.phone || "",
      address: user.parent_info?.address || "",
      occupation: user.parent_info?.occupation || "",
      emergency_contact: user.parent_info?.emergency_contact || "",
      studentIds: []
    })
    setIsDialogOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setStudentFormData({
      student_id: student.student_id,
      name: student.name,
      class: student.class,
      section: student.section,
      father_name: student.father_name,
      mother_name: student.mother_name,
      phone: student.phone,
      address: student.address,
      admission_date: student.admission_date,
      email: student.email || "",
      password: ""
    })
    setIsDialogOpen(true)
  }

  const handleManageStudents = (user: User) => {
    setSelectedParent(user)
    fetchParentStudentLinks(user.id)
    setIsLinkDialogOpen(true)
  }

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete user",
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

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Student deleted successfully",
        })
        fetchStudents()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete student",
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

  const resetForm = () => {
    setFormData({ 
      name: "", 
      email: "", 
      role: "", 
      password: "",
      cnic: "",
      phone: "",
      address: "",
      occupation: "",
      emergency_contact: "",
      studentIds: []
    })
    setEditingUser(null)
  }

  const resetStudentForm = () => {
    setStudentFormData({
      student_id: "",
      name: "",
      class: "",
      section: "",
      father_name: "",
      mother_name: "",
      phone: "",
      address: "",
      admission_date: "",
      email: "",
      password: "",
    })
    setEditingStudent(null)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleDisplayText = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator"
      case "principal":
        return "Principal"
      case "society_member":
        return "Owner"
      case "accountant":
        return "Accountant"
      case "parent":
        return "Parent"
      default:
        return role.replace("_", " ")
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "principal":
        return "bg-blue-100 text-blue-800"
      case "society_member":
        return "bg-green-100 text-green-800"
      case "accountant":
        return "bg-yellow-100 text-yellow-800"
      case "parent":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            System Users
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Students
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? "Update user information" : "Create a new user account"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="principal">Principal</SelectItem>
                        <SelectItem value="society_member">Owner</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.role === "parent" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cnic">CNIC</Label>
                          <Input
                            id="cnic"
                            value={formData.cnic}
                            onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact">Emergency Contact</Label>
                        <Input
                          id="emergency_contact"
                          value={formData.emergency_contact}
                          onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Link to Students (Optional)</Label>
                        <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                          {students.filter(s => s.is_active).map((student) => (
                            <div key={student.id} className="flex items-center space-x-2 py-1">
                              <input
                                type="checkbox"
                                id={`student-${student.id}`}
                                checked={formData.studentIds.includes(student.id.toString())}
                                onChange={(e) => {
                                  const studentId = student.id.toString()
                                  setFormData(prev => ({
                                    ...prev,
                                    studentIds: e.target.checked
                                      ? [...prev.studentIds, studentId]
                                      : prev.studentIds.filter(id => id !== studentId)
                                  }))
                                }}
                              />
                              <label htmlFor={`student-${student.id}`} className="text-sm">
                                {student.name} ({student.class}-{student.section}) - {student.student_id}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {editingUser ? "New Password (leave blank to keep current)" : "Password"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingUser ? "Update" : "Create"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>Manage user accounts and their access levels</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>{getRoleDisplayText(user.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {user.role === "parent" && (
                            <Button variant="ghost" size="sm" onClick={() => handleManageStudents(user)}>
                              <Link className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetStudentForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
                  <DialogDescription>
                    {editingStudent ? "Update student information" : "Register a new student"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="student_id">Student ID</Label>
                      <Input
                        id="student_id"
                        value={studentFormData.student_id}
                        onChange={(e) => setStudentFormData({ ...studentFormData, student_id: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="student_name">Full Name</Label>
                      <Input
                        id="student_name"
                        value={studentFormData.name}
                        onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      <Select
                        value={studentFormData.class}
                        onValueChange={(value) => setStudentFormData({ ...studentFormData, class: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                          <SelectItem value="9">9</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="11">11</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Select
                        value={studentFormData.section}
                        onValueChange={(value) => setStudentFormData({ ...studentFormData, section: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="father_name">Father's Name</Label>
                      <Input
                        id="father_name"
                        value={studentFormData.father_name}
                        onChange={(e) => setStudentFormData({ ...studentFormData, father_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mother_name">Mother's Name</Label>
                      <Input
                        id="mother_name"
                        value={studentFormData.mother_name}
                        onChange={(e) => setStudentFormData({ ...studentFormData, mother_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={studentFormData.phone}
                        onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admission_date">Admission Date</Label>
                      <Input
                        id="admission_date"
                        type="date"
                        value={studentFormData.admission_date}
                        onChange={(e) => setStudentFormData({ ...studentFormData, admission_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={studentFormData.address}
                      onChange={(e) => setStudentFormData({ ...studentFormData, address: e.target.value })}
                    />
                  </div>

                  {/* Email and Password Fields - ADDED SECTION */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={studentFormData.email}
                        onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        {editingStudent ? "New Password (leave blank to keep current)" : "Password"}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={studentFormData.password}
                        onChange={(e) => setStudentFormData({ ...studentFormData, password: e.target.value })}
                        required={!editingStudent}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingStudent ? "Update" : "Create"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>Manage student registrations and information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        {student.class} {student.section}
                      </TableCell>
                      <TableCell>{student.father_name}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge variant={student.is_active ? "default" : "secondary"}>
                          {student.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditStudent(student)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Link Management Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Student Links for {selectedParent?.name}</DialogTitle>
            <DialogDescription>
              Link and unlink students to this parent account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <form onSubmit={handleLinkStudent} className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link-student">Select Student</Label>
                  <Select 
                    value={linkFormData.studentId} 
                    onValueChange={(value) => setLinkFormData({ ...linkFormData, studentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.filter(student => 
                        !parentStudentLinks.some(link => link.student_id === student.id)
                      ).map(student => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.class}-{student.section})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select 
                    value={linkFormData.relationship} 
                    onValueChange={(value) => setLinkFormData({ ...linkFormData, relationship: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" size="sm">
                <Link className="h-4 w-4 mr-2" />
                Link Student
              </Button>
            </form>

            <div>
              <h4 className="font-semibold mb-2">Linked Students</h4>
              <div className="space-y-2">
                {parentStudentLinks.length > 0 ? (
                  parentStudentLinks.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{link.student_name}</p>
                        <p className="text-sm text-gray-500">
                          Class {link.student_class} • {link.relationship}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlinkStudent(link.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No students linked</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}