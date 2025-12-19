"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  ExternalLink,
  CheckCircle,
  Clock,
  BarChart3,
  Play,
  Calendar,
  Target,
  AlertCircle,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"

interface DashboardData {
  partnerName: string
  campaign: {
    id: string
    title: string
    description: string
    status: string
    targetPlatforms: string[]
    featuredImage: string | null
    startDate: string | null
    completedAt: string | null
    createdAt: string
  }
  stats: {
    budget: number
    spent: number
    budgetUtilization: number
    payoutRate: number
    // Submission counts
    totalSubmissions: number
    approvedSubmissions: number
    pendingSubmissions: number
    rejectedSubmissions: number
    // Clipper counts
    uniqueClippers: number
    uniqueApprovedClippers: number
    // Page counts
    totalPagesSubmitted: number
    uniquePages: number
    verifiedPages: number
    // Views metrics
    totalViews: number
    totalSubmittedViews: number
    approvedViews: number
    pendingViews: number
    viewsAtCompletion: number
    viewsAfterCompletion: number
    viewsDuringCampaign: number
    viewsAfterCampaign: number
    // Earnings
    totalEarnings: number
  }
  platformStats: Record<string, { 
    totalSubmissions: number
    approvedSubmissions: number
    totalViews: number
    budgetViews: number
    additionalViews: number
  }>
  submissions: Array<{
    id: string
    clipUrl: string
    platform: string
    status: string
    creatorHandle: string
    creatorImage: string | null
    initialViews: number
    currentViews: number
    viewsGained: number
    submittedAt: string
  }>
}

export default function PartnerDashboardPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (isBackgroundRefresh = false) => {
    try {
      // Only show full loading on initial load, not background refresh
      if (!isBackgroundRefresh) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await fetch(`/api/partner/${token}/dashboard`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        setError("Unable to load dashboard data")
      }
    } catch (err) {
      setError("Connection error")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchData(false) // Initial load
    }
  }, [token])

  // Auto-refresh data every 30 seconds to show real-time view tracking updates
  useEffect(() => {
    if (!token) return

    const interval = setInterval(() => {
      // Only refresh if not currently loading to avoid race conditions
      if (!loading && !isRefreshing) {
        fetchData(true) // Silent background refresh
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [token, loading, isRefreshing])

  if (loading) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 w-full flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 w-full">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm md:text-base text-muted-foreground">{error || "Unable to load data"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { campaign, stats, platformStats, submissions } = data

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-foreground text-background">
            <span className="w-2 h-2 bg-background rounded-full mr-1.5 animate-pulse" />
            LIVE
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge className="bg-muted text-muted-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            COMPLETED
          </Badge>
        )
      case 'PAUSED':
        return (
          <Badge className="bg-muted text-muted-foreground border border-foreground/20">
            PAUSED
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 w-full max-w-6xl mx-auto">
      {/* Floating refresh indicator - positioned absolute so it doesn't push content */}
      {isRefreshing && (
        <div className="fixed top-20 right-4 z-50 pointer-events-none">
          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Updating...</span>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Campaign Hero */}
        <div className="relative mb-8">
          {campaign.featuredImage && (
            <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-6">
              <img
                src={campaign.featuredImage}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3">
                  {getStatusBadge(campaign.status)}
                  <div className="flex gap-1">
                    {campaign.targetPlatforms.map(platform => (
                      <div key={platform} className="w-6 h-6">
                        {getPlatformLogo(platform, '', 20)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {!campaign.featuredImage && getStatusBadge(campaign.status)}
                {!campaign.featuredImage && (
                  <div className="flex gap-1">
                    {campaign.targetPlatforms.map(platform => (
                      <div key={platform} className="w-5 h-5">
                        {getPlatformLogo(platform, '', 18)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{campaign.title}</h1>
              <p className="text-sm md:text-base text-muted-foreground mb-3">{campaign.description}</p>
              <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4" />
                Started {new Date(campaign.startDate || campaign.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
                {campaign.completedAt && (
                  <span className="ml-2">
                    · Completed {new Date(campaign.completedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                <Target className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wide">Submissions</span>
              </div>
              <p className="text-xl md:text-3xl font-bold">{stats.totalSubmissions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wide">Approved</span>
              </div>
              <p className="text-xl md:text-3xl font-bold">{stats.approvedSubmissions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wide">Total Views</span>
              </div>
              <p className="text-xl md:text-3xl font-bold">{stats.totalViews.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wide">Earnings</span>
              </div>
              <p className="text-xl md:text-3xl font-bold">${stats.totalEarnings.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Views Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wide">Submitted Views</span>
              </div>
              <p className="text-xl md:text-3xl font-bold">{stats.totalSubmittedViews.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wide">Approved (Paid)</span>
              </div>
              <p className="text-xl md:text-3xl font-bold">{stats.viewsAtCompletion.toLocaleString()}</p>
            </CardContent>
          </Card>

          {stats.viewsAfterCompletion > 0 && (
            <Card>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-[10px] md:text-xs uppercase tracking-wide">Extra Tracked</span>
                </div>
                <p className="text-xl md:text-3xl font-bold">+{stats.viewsAfterCompletion.toLocaleString()}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Budget Progress */}
        <Card className="mb-4">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs md:text-sm">Budget Progress</span>
              </div>
              <span className="text-xs md:text-sm font-medium">
                ${stats.spent.toLocaleString()} / ${stats.budget.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {stats.budgetUtilization.toFixed(0)}% utilized
            </p>
          </CardContent>
        </Card>

        {/* Pages Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wide">Pages</span>
              </div>
              <p className="text-xl md:text-3xl font-bold">{stats.totalPagesSubmitted}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wide">Pages Approved</span>
              </div>
              <p className="text-xl md:text-3xl font-bold">{stats.uniquePages}</p>
              {stats.verifiedPages > 0 && (
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                  {stats.verifiedPages} verified
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        {Object.keys(platformStats).length > 0 && (
          <Card className="mb-6 md:mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                Platform Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`grid gap-4 ${
                Object.keys(platformStats).length === 1 ? 'grid-cols-1' :
                Object.keys(platformStats).length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                Object.keys(platformStats).length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}>
                {Object.entries(platformStats).map(([platform, platformData]) => (
                  <div key={platform} className="p-4 md:p-5 bg-muted/30 border border-border rounded-xl">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
                      <div className="p-2 bg-background rounded-lg">
                        {getPlatformLogo(platform, '', 24)}
                      </div>
                      <span className="font-semibold text-base md:text-lg">
                        {platform === 'YOUTUBE' ? 'YouTube' : 
                         platform === 'TIKTOK' ? 'TikTok' :
                         platform === 'INSTAGRAM' ? 'Instagram' :
                         platform === 'TWITTER' ? 'X' :
                         platform}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Posts</span>
                        <span className="text-lg font-bold">{platformData.totalSubmissions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Approved</span>
                        <span className="text-lg font-bold">{platformData.approvedSubmissions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Views</span>
                        <span className="text-lg font-bold">{platformData.budgetViews.toLocaleString()}</span>
                      </div>
                      {platformData.additionalViews > 0 && (
                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                          <span className="text-sm text-muted-foreground">+ Since End</span>
                          <span className="text-base font-semibold text-green-600 dark:text-green-400">
                            +{platformData.additionalViews.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Posts */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Play className="w-4 h-4 md:w-5 md:h-5" />
              Top Posts ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {submissions.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Play className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm md:text-base">No approved posts yet</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {submissions.map((submission, index) => (
                  <motion.a
                    key={submission.id}
                    href={submission.clipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-2 md:gap-4 p-3 md:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>

                    {/* Platform */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {getPlatformLogo(submission.platform, '', 16)}
                    </div>

                    {/* Handle & Link */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">
                        @{submission.creatorHandle}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        View Post
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs md:text-sm font-medium">{submission.currentViews.toLocaleString()}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">views</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
