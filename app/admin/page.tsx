"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { BarChart3, Users, Target, DollarSign, Settings, Shield, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/clippers/login?error=AccessDenied")
      return
    }

    if (session.user?.role !== "ADMIN") {
      router.push("/clippers/dashboard?error=AdminAccessRequired")
      return
    }

    fetchAnalytics()
  }, [session, status, router])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics/aggregate")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading admin dashboard...</div>
        </div>
      </div>
    )
  }

  const stats = analytics?.overview || {
    totalUsers: 0,
    totalCampaigns: 0,
    totalSubmissions: 0,
    activeCampaigns: 0,
    totalViews: 0,
    totalEarnings: 0
  }

  const quickActions = [
    {
      title: "Manage Campaigns",
      description: "Create and edit brand campaigns",
      href: "/admin/campaigns",
      icon: Target,
      color: "bg-blue-500"
    },
    {
      title: "Review Submissions",
      description: "Approve or reject clipper submissions",
      href: "/admin/submissions",
      icon: Shield,
      color: "bg-green-500"
    },
    {
      title: "View Analytics",
      description: "Platform performance and insights",
      href: "/admin/analytics",
      icon: BarChart3,
      color: "bg-purple-500"
    },
    {
      title: "User Management",
      description: "Manage users and permissions",
      href: "/admin/users",
      icon: Users,
      color: "bg-orange-500"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header with Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-light mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {session?.user?.name || session?.user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/clippers/dashboard">
                <Button variant="outline" size="sm">
                  Clipper Dashboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="default" size="sm" disabled>
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-semibold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-semibold">{stats.activeCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-semibold">{Number(stats.totalViews).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-semibold">${stats.totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="font-medium mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Campaigns</span>
                  <span className="font-medium">{stats.totalCampaigns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Submissions</span>
                  <span className="font-medium">{stats.totalSubmissions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Platform Health</span>
                  <span className="font-medium text-green-600">Excellent</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">View tracking system updated</span>
                  <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">New campaign created</span>
                  <span className="text-xs text-muted-foreground ml-auto">1 hour ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">5 submissions approved</span>
                  <span className="text-xs text-muted-foreground ml-auto">3 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Admin Dashboard - Manage your clipping platform
          </p>
        </div>
      </motion.div>
    </div>
  )
}
