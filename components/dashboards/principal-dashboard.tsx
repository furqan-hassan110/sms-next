"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GraduationCap, CreditCard, TrendingUp, Users, BookOpen, Calendar } from "lucide-react"

interface PrincipalStats {
  totalStudents: number
  feeCollectionRate: number
  monthlyCollection: number
  classWiseStats: Array<{
    class: string
    students: number
    collectionRate: number
  }>
}

export function PrincipalDashboard() {
  const [stats, setStats] = useState<PrincipalStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/principal/dashboard/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Principal Dashboard</h1>
        <p className="text-gray-600">School overview and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Enrolled this year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Collection</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.feeCollectionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall collection rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {stats?.monthlyCollection?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month's collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Class-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Class-wise Fee Collection</CardTitle>
          <CardDescription>Fee collection performance by class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.classWiseStats?.map((classData) => (
              <div key={classData.class} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{classData.class}</span>
                    <Badge variant="secondary">{classData.students} students</Badge>
                  </div>
                  <span className="text-sm font-medium">{classData.collectionRate}%</span>
                </div>
                <Progress value={classData.collectionRate} className="h-2" />
              </div>
            )) || <p className="text-sm text-gray-500">No class data available</p>}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>School Overview</CardTitle>
            <CardDescription>Key school metrics and information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Active Students</span>
                </div>
                <span className="font-medium">{stats?.totalStudents || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Academic Year</span>
                </div>
                <span className="font-medium">2024-2025</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Fee Collection Status</span>
                </div>
                <Badge variant={stats && stats.feeCollectionRate > 80 ? "default" : "secondary"}>
                  {stats && stats.feeCollectionRate > 80 ? "Good" : "Needs Attention"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>Latest school activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">Fee vouchers generated</p>
                <p className="text-gray-500">Monthly fee vouchers created for all classes</p>
              </div>

              <div className="text-sm">
                <p className="font-medium">Payment reminders sent</p>
                <p className="text-gray-500">Automated reminders sent to pending payments</p>
              </div>

              <div className="text-sm">
                <p className="font-medium">Monthly report ready</p>
                <p className="text-gray-500">Financial summary available for review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
