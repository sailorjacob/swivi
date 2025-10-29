"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { BarChart3, Users, Target, DollarSign, Settings, Shield, Activity, Loader2 } from "lucide-react"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setLoading(true)
      setError(null)
      const response = await authenticatedFetch("/api/admin/analytics/aggregate")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else if (response.status === 401) {
        setError("Authentication required")
        router.push("/clippers/login?error=SessionExpired")
      } else if (response.status >= 500) {
        console.log('🔍 Server error loading admin analytics - showing empty state')
        setAnalytics(null)
        setError("Server temporarily unavailable")
      } else {
        setError("Failed to load dashboard data")
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }


  const stats = analytics?.overview || {
    totalUsers: 0,
    totalCampaigns: 0,
    totalSubmissions: 0,
    activeCampaigns: 0,
    totalViews: 0,
    trackedViews: 0,
    totalEarnings: 0
  }

  const renderNavIcon = (icon: React.ComponentType<{ className?: string }> | string, className?: string) => {
    if (typeof icon === 'string') {
      return (
        <Image
          src={icon}
          alt="nav icon"
          width={32}
          height={32}
          className={cn("rounded", className)}
          unoptimized
        />
      )
    }
    const IconComponent = icon
    return <IconComponent className={className} />
  }

  const quickActions = [
    {
      title: "Manage Campaigns",
      description: "Create and edit brand campaigns",
      href: "/admin/campaigns",
      icon: Target,
      color: "bg-muted border border-border"
    },
    {
      title: "Review Submissions",
      description: "Approve or reject clipper submissions",
      href: "/admin/submissions",
      icon: Shield,
      color: "bg-muted border border-border"
    },
    {
      title: "View Analytics",
      description: "Platform performance and insights",
      href: "/admin/analytics",
      icon: BarChart3,
      color: "bg-muted border border-border"
    },
    {
      title: "User Management",
      description: "Manage users and permissions",
      href: "/admin/users",
      icon: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/342.png",
      color: "bg-muted border border-border"
    }
  ]

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Subtle loading indicator */}
      {loading && (
        <div className="fixed top-4 right-4 z-50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                  <p className="text-xs text-muted-foreground mt-1">Includes initial views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Tracked Views</p>
                        <p className="text-2xl font-semibold">{Number(stats.trackedViews).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">From scrapes • Click for breakdown</p>
                      </div>
                    </div>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tracked Views by Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Platform Tracked Views</p>
                    <p className="text-3xl font-bold">{Number(stats.trackedViews).toLocaleString()}</p>
                  </div>
                  <Activity className="h-10 w-10 text-muted-foreground" />
                </div>
                
                {analytics?.campaignTrackedViews && analytics.campaignTrackedViews.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Campaign Breakdown</h3>
                    {analytics.campaignTrackedViews.map((campaign: any) => (
                      <Card key={campaign.campaignId}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{campaign.campaignTitle}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {campaign.campaignStatus}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Tracked Views</p>
                                  <p className="text-lg font-semibold text-primary">
                                    +{campaign.trackedViews.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Initial Views</p>
                                  <p className="text-lg font-semibold">
                                    {campaign.initialViews.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Current Views</p>
                                  <p className="text-lg font-semibold">
                                    {campaign.currentViews.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">
                                  {campaign.totalSubmissions} submission{campaign.totalSubmissions !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No campaign data available yet
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

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
                        {renderNavIcon(action.icon, "h-6 w-6 text-foreground")}
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
