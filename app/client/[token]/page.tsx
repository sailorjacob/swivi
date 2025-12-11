"use client"

// Force this page to be dynamic (not statically generated)
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
  Loader2, 
  CheckCircle,
  Clock,
  BarChart3,
  Play,
  Calendar,
  Target
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"

interface CampaignData {
  campaign: {
    id: string
    title: string
    description: string
    creator: string
    status: string
    targetPlatforms: string[]
    featuredImage: string | null
    startDate: string | null
    endDate: string | null
    completedAt: string | null
    createdAt: string
  }
  stats: {
    budget: number
    spent: number
    remainingBudget: number
    budgetUtilization: number
    totalSubmissions: number
    approvedSubmissions: number
    totalViews: number
    totalViewsGained: number
    payoutRate: number
  }
  platformStats: Record<string, { count: number; views: number; viewsGained: number }>
  submissions: Array<{
    id: string
    clipUrl: string
    platform: string
    status: string
    creatorName: string
    creatorImage: string | null
    initialViews: number
    currentViews: number
    viewsGained: number
    submittedAt: string
  }>
}

export default function ClientPortalPage() {
  const params = useParams()
  const token = params.token as string
  
  const [data, setData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/client/${token}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else if (response.status === 404) {
          setError("Campaign not found. Please check your access link.")
        } else {
          setError("Unable to load campaign data.")
        }
      } catch (err) {
        setError("Failed to connect. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading campaign data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Error</h2>
            <p className="text-muted-foreground">{error || "Campaign not found"}</p>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SwiviLogo size={32} />
              <span className="text-sm font-medium">Partner Portal</span>
            </div>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Last updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
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
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{campaign.title}</h1>
                <p className="text-muted-foreground mb-3">{campaign.description}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Started {new Date(campaign.createdAt).toLocaleDateString('en-US', {
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <Card>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                  <Eye className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-[10px] md:text-xs uppercase tracking-wide">Total Views</span>
                </div>
                <p className="text-xl md:text-3xl font-bold">{stats.totalViews.toLocaleString()}</p>
                {stats.totalViewsGained > 0 && (
                  <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +{stats.totalViewsGained.toLocaleString()} tracked
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                  <Users className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-[10px] md:text-xs uppercase tracking-wide">Posts</span>
                </div>
                <p className="text-xl md:text-3xl font-bold">{stats.approvedSubmissions}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  of {stats.totalSubmissions} submitted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                  <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-[10px] md:text-xs uppercase tracking-wide">Budget Used</span>
                </div>
                <p className="text-xl md:text-3xl font-bold">${stats.spent.toLocaleString()}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  of ${stats.budget.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground mb-1.5 md:mb-2">
                  <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-[10px] md:text-xs uppercase tracking-wide">Progress</span>
                </div>
                <p className="text-xl md:text-3xl font-bold">{stats.budgetUtilization.toFixed(0)}%</p>
                <Progress value={stats.budgetUtilization} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Platform Breakdown */}
          {Object.keys(platformStats).length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Platform Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(platformStats).map(([platform, stats]) => (
                    <div key={platform} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        {getPlatformLogo(platform, '', 20)}
                        <span className="font-medium">
                          {platform === 'YOUTUBE' ? 'YouTube' : 
                           platform === 'TIKTOK' ? 'TikTok' :
                           platform === 'INSTAGRAM' ? 'Instagram' :
                           platform === 'TWITTER' ? 'X' :
                           platform}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Posts</span>
                          <span className="font-medium">{stats.count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Views</span>
                          <span className="font-medium">{stats.views.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tracked</span>
                          <span className="font-medium">
                            +{stats.viewsGained.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="w-5 h-5" />
                Top Posts ({submissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No approved posts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission, index) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Creator */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={submission.creatorImage || undefined} />
                          <AvatarFallback className="text-xs">
                            {submission.creatorName?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:block">
                          <p className="text-sm font-medium truncate max-w-[100px]">
                            {submission.creatorName}
                          </p>
                        </div>
                      </div>

                      {/* Platform */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {getPlatformLogo(submission.platform, '', 16)}
                      </div>

                      {/* URL - truncated */}
                      <a
                        href={submission.clipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{submission.clipUrl}</span>
                      </a>

                      {/* Stats */}
                      <div className="flex items-center gap-4 flex-shrink-0 text-right">
                        <div>
                          <p className="text-sm font-medium">{submission.currentViews.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            +{submission.viewsGained.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">tracked</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Powered by <span className="font-semibold">Swivi</span>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

