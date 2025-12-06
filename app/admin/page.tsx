"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { BarChart3, Target, Shield, Activity, Loader2, UserPlus, FileVideo, DollarSign, Eye, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ActivityItem {
  type: string
  timestamp: string
  data: any
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

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
    fetchActivities()
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

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true)
      const response = await authenticatedFetch("/api/admin/activity")
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setActivitiesLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_SIGNUP':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'SUBMISSION':
        return <FileVideo className="h-4 w-4 text-purple-500" />
      case 'SUBMISSION_UPDATE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PAYOUT_REQUEST':
        return <DollarSign className="h-4 w-4 text-amber-500" />
      case 'PAYOUT_COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'VIEW_SCRAPE':
        return <Eye className="h-4 w-4 text-cyan-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    const { type, data } = activity
    switch (type) {
      case 'USER_SIGNUP':
        return <><span className="font-medium">{data.name || data.email}</span> signed up</>
      case 'SUBMISSION':
        return <><span className="font-medium">{data.userName}</span> submitted a clip to <span className="font-medium">{data.campaignTitle}</span></>
      case 'SUBMISSION_UPDATE':
        return <>Submission by <span className="font-medium">{data.userName}</span> was <span className={data.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'}>{data.status?.toLowerCase()}</span></>
      case 'PAYOUT_REQUEST':
        return <><span className="font-medium">{data.userName}</span> requested <span className="font-medium">${data.amount?.toFixed(2)}</span> payout</>
      case 'PAYOUT_COMPLETED':
        return <>Payout of <span className="font-medium">${data.amount?.toFixed(2)}</span> to <span className="font-medium">{data.userName}</span> completed</>
      case 'VIEW_SCRAPE':
        // Show clipper name, view growth, and shortened clip URL
        const viewGrowthDisplay = data.viewGrowth > 0 ? `+${data.viewGrowth.toLocaleString()}` : data.views?.toLocaleString()
        return <>
          <span className="font-medium">{data.userName || 'Clipper'}</span>
          {' '}{data.viewGrowth > 0 ? 'gained' : 'at'}{' '}
          <span className="font-medium text-cyan-500">{viewGrowthDisplay}</span>
          {' '}views on{' '}
          <span className="text-muted-foreground">{data.shortUrl || data.platform}</span>
        </>
      default:
        return 'Unknown activity'
    }
  }

  // Get the link URL for an activity item
  const getActivityLink = (activity: ActivityItem): string | null => {
    const { type, data } = activity
    switch (type) {
      case 'USER_SIGNUP':
        return data.id ? `/admin/users?highlight=${data.id}` : '/admin/users'
      case 'SUBMISSION':
      case 'SUBMISSION_UPDATE':
        return data.id ? `/admin/submissions?highlight=${data.id}` : '/admin/submissions'
      case 'PAYOUT_REQUEST':
      case 'PAYOUT_COMPLETED':
        return data.id ? `/admin/payouts?highlight=${data.id}` : '/admin/payouts'
      case 'VIEW_SCRAPE':
        // Link to the submission if available
        if (data.submissionId) return `/admin/submissions?highlight=${data.submissionId}`
        return '/admin/analytics'
      default:
        return null
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
    },
    {
      title: "Support Tickets",
      description: "View and respond to support requests",
      href: "/admin/support",
      icon: MessageSquare,
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
        {/* Compact Stats Bar */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm mb-8">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Users:</span>
            <span className="font-semibold">{stats.totalUsers}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Active:</span>
            <span className="font-semibold">{stats.activeCampaigns}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Views:</span>
            <span className="font-semibold">{Number(stats.totalViews).toLocaleString()}</span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 hover:text-foreground transition-colors">
                <span className="text-muted-foreground">Tracked:</span>
                <span className="font-semibold underline decoration-dotted">{Number(stats.trackedViews).toLocaleString()}</span>
              </button>
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
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Earnings:</span>
            <span className="font-semibold">${stats.totalEarnings.toFixed(2)}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="p-4 rounded-lg border border-border hover:border-foreground/30 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {renderNavIcon(action.icon, "h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors")}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {action.title}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-1">
                {activities.slice(0, 25).map((activity, index) => {
                  const activityLink = getActivityLink(activity)
                  const content = (
                    <>
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {getActivityText(activity)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </>
                  )

                  return activityLink ? (
                    <Link
                      key={`${activity.type}-${activity.timestamp}-${index}`}
                      href={activityLink}
                      className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group hover:underline decoration-muted-foreground/50 underline-offset-2"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div 
                      key={`${activity.type}-${activity.timestamp}-${index}`}
                      className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      {content}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </motion.div>
    </div>
  )
}
