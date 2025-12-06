'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp,
  TrendingUp, Eye, DollarSign, Users, FileVideo, BarChart3, 
  Clock, ExternalLink, RefreshCw, Target, Play, Zap
} from 'lucide-react'
import { authenticatedFetch } from '@/lib/supabase-browser'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import Link from 'next/link'
import { getPlatformLogo } from '@/components/ui/icons/platform-logos'

interface ViewHistoryPoint {
  date: string
  views: number
  scrapedAt: string
  success: boolean
}

interface ClipData {
  submissionId: string
  clipId: string
  clipUrl: string
  platform: string
  status: string
  clipStatus?: string
  processingStatus?: string
  submittedAt: string
  initialViews: number
  currentViews: number
  earnings: number
  campaign: {
    id: string
    title: string
    status: string
  }
  user: {
    id: string
    name: string
    email: string
  }
  viewHistory: ViewHistoryPoint[]
  scrapeCount?: number
}

interface CampaignGroup {
  campaign: {
    id: string
    title: string
    status: string
  }
  clips: ClipData[]
}

interface CronLog {
  id: string
  jobName: string
  status: string
  startedAt: string
  completedAt: string | null
  duration: number | null
  clipsProcessed: number
  clipsSuccessful: number
  clipsFailed: number
  earningsCalculated: number
  campaignsCompleted: number
  errorMessage: string | null
}

interface PlatformStats {
  overview: {
    totalUsers: number
    totalCampaigns: number
    totalSubmissions: number
    activeCampaigns: number
    totalViews: number
    trackedViews: number
    totalEarnings: number
    pendingSubmissions: number
    approvedSubmissions: number
    paidSubmissions: number
  }
  topCampaigns: Array<{
    id: string
    title: string
    status: string
    submissions: number
    views: number
    earnings: number
  }>
  platformBreakdown: Record<string, number>
  payoutStats: {
    totalPaid: number
    pendingPayouts: number
    averagePayout: number
  }
  campaignTrackedViews?: Array<{
    campaignId: string
    campaignTitle: string
    campaignStatus: string
    campaignImage?: string | null
    totalSubmissions: number
    approvedSubmissions: number
    trackedViews: number
    initialViews: number
    currentViews: number
  }>
}

export default function AdminAnalyticsPage() {
  const [campaigns, setCampaigns] = useState<CampaignGroup[]>([])
  const [cronLogs, setCronLogs] = useState<CronLog[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)
  const [showCronLogs, setShowCronLogs] = useState(false)

  useEffect(() => {
    fetchAllData(false)
    const interval = setInterval(() => fetchAllData(true), 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAllData = async (isBackgroundRefresh = false) => {
    if (isBackgroundRefresh) setIsRefreshing(true)
    await Promise.all([
      fetchPlatformStats(),
      fetchViewHistory(isBackgroundRefresh),
      fetchCronLogs()
    ])
    setIsRefreshing(false)
  }

  const fetchPlatformStats = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/analytics/aggregate')
      if (response.ok) {
        const data = await response.json()
        setPlatformStats(data)
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error)
    }
  }

  const fetchViewHistory = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true)
      const response = await authenticatedFetch('/api/admin/analytics/view-history')
      const data = await response.json()
      if (response.ok) setCampaigns(data.campaigns)
    } catch (error) {
      console.error('Error fetching view history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCronLogs = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/analytics/cron-logs?limit=10')
      if (response.ok) {
        const data = await response.json()
        setCronLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch cron logs:', error)
    }
  }

  const effectiveCPM = platformStats?.overview.trackedViews && platformStats.overview.trackedViews > 0
    ? (platformStats.overview.totalEarnings / platformStats.overview.trackedViews) * 1000
    : 0

  // Prepare platform data for chart
  const platformChartData = platformStats?.platformBreakdown 
    ? Object.entries(platformStats.platformBreakdown).map(([platform, count]) => ({
        platform: platform === 'YOUTUBE' ? 'YouTube' : platform === 'TIKTOK' ? 'TikTok' : platform === 'INSTAGRAM' ? 'Instagram' : platform === 'TWITTER' ? 'X' : platform,
        count
      }))
    : []

  if (loading && !platformStats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Refresh Indicator */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Updating...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform performance & campaign insights</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAllData(false)} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics - Large Hero Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-muted-foreground">Views Generated</span>
            </div>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{(platformStats?.overview.trackedViews || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total tracked view growth</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <DollarSign className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Total Paid Out</span>
            </div>
            <p className="text-4xl font-bold">${(platformStats?.payoutStats.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mt-1">To creators</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Zap className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Effective CPM</span>
            </div>
            <p className="text-4xl font-bold">${effectiveCPM.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cost per 1K views</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <FileVideo className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Submissions</span>
            </div>
            <p className="text-4xl font-bold">{(platformStats?.overview.approvedSubmissions || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">of {platformStats?.overview.totalSubmissions || 0} total approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{platformStats?.overview.activeCampaigns || 0}</p>
              </div>
              <Target className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Clippers</p>
                <p className="text-2xl font-bold">{platformStats?.overview.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{platformStats?.overview.pendingSubmissions || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold">${(platformStats?.payoutStats.pendingPayouts || 0).toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{platformStats?.overview.totalCampaigns || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Campaign Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Performance Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Campaign Performance</h2>
              <Link href="/admin/campaigns">
                <Button variant="ghost" size="sm">
                  Manage Campaigns →
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {platformStats?.campaignTrackedViews && platformStats.campaignTrackedViews.length > 0 ? (
                platformStats.campaignTrackedViews.map((campaign) => {
                  const campaignGroup = campaigns.find(c => c.campaign.id === campaign.campaignId)
                  const isExpanded = expandedCampaign === campaign.campaignId
                  const budgetProgress = campaign.currentViews > 0 ? Math.min(100, (campaign.trackedViews / campaign.currentViews) * 100) : 0
                  
                  return (
                    <Card key={campaign.campaignId} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Campaign Header */}
                        <div className="p-5 border-b border-border/50">
                          <div className="flex items-start gap-4 mb-4">
                            {/* Campaign Image */}
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                              {campaign.campaignImage ? (
                                <img 
                                  src={campaign.campaignImage} 
                                  alt={campaign.campaignTitle}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-semibold">
                                  {campaign.campaignTitle?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-lg">{campaign.campaignTitle}</h3>
                                <Badge variant={campaign.campaignStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                                  {campaign.campaignStatus}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{campaign.totalSubmissions} submissions</span>
                                <span>•</span>
                                <span>{campaign.approvedSubmissions} approved</span>
                              </div>
                            </div>
                            <Link href={`/admin/submissions?campaignId=${campaign.campaignId}`}>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-4 gap-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Initial Views</p>
                              <p className="text-lg font-bold">{campaign.initialViews.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Current Views</p>
                              <p className="text-lg font-bold">{campaign.currentViews.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                              <p className="text-xs text-green-600 dark:text-green-400 mb-1">Views Generated</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">+{campaign.trackedViews.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Growth</p>
                              <p className="text-lg font-bold">
                                {campaign.initialViews > 0 ? `${((campaign.trackedViews / campaign.initialViews) * 100).toFixed(1)}%` : '—'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Expand/Collapse Clips */}
                        {campaignGroup && campaignGroup.clips.length > 0 && (
                          <>
                            <button
                              onClick={() => setExpandedCampaign(isExpanded ? null : campaign.campaignId)}
                              className="w-full p-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <FileVideo className="w-4 h-4" />
                                {campaignGroup.clips.length} clips tracked
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {/* Clips List */}
                            {isExpanded && (
                              <div className="border-t border-border/50 divide-y divide-border/50 max-h-96 overflow-y-auto">
                                {campaignGroup.clips.map((clip) => {
                                  const viewGrowth = clip.currentViews - clip.initialViews
                                  return (
                                    <div key={clip.submissionId} className="p-4 hover:bg-muted/30 transition-colors">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            {getPlatformLogo(clip.platform, '', 16)}
                                            <span className="font-medium text-sm">{clip.user.name || clip.user.email}</span>
                                            <Badge 
                                              variant={clip.status === 'APPROVED' ? 'default' : clip.status === 'PENDING' ? 'secondary' : 'outline'}
                                              className="text-xs"
                                            >
                                              {clip.status}
                                            </Badge>
                                          </div>
                                          <a 
                                            href={clip.clipUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-muted-foreground hover:text-foreground underline block truncate"
                                          >
                                            {clip.clipUrl}
                                          </a>
                                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <span>{clip.scrapeCount || clip.viewHistory.length} scrapes</span>
                                            <span>•</span>
                                            <span>Submitted {new Date(clip.submittedAt).toLocaleDateString()}</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold">{clip.currentViews.toLocaleString()}</p>
                                          <p className="text-xs text-muted-foreground">views</p>
                                          {viewGrowth > 0 && (
                                            <p className="text-xs text-green-600 dark:text-green-400">+{viewGrowth.toLocaleString()}</p>
                                          )}
                                          {clip.status === 'APPROVED' && clip.earnings > 0 && (
                                            <p className="text-xs font-medium mt-1">${clip.earnings.toFixed(2)}</p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Mini sparkline */}
                                      {clip.viewHistory.length > 1 && (
                                        <div className="h-8 mt-2">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={clip.viewHistory.slice(-10)}>
                                              <Area 
                                                type="monotone" 
                                                dataKey="views" 
                                                stroke="hsl(var(--foreground))"
                                                fill="hsl(var(--foreground))"
                                                fillOpacity={0.1}
                                                strokeWidth={1.5}
                                              />
                                            </AreaChart>
                                          </ResponsiveContainer>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No campaigns with tracked views yet.</p>
                    <Link href="/admin/campaigns" className="inline-block mt-4">
                      <Button variant="outline" size="sm">Create Campaign</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Platform & Stats */}
        <div className="space-y-6">
          {/* Platform Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Platform Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {platformChartData.length > 0 ? (
                <>
                  <div className="h-40 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformChartData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="platform" width={70} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(platformStats?.platformBreakdown || {})
                      .sort(([, a], [, b]) => b - a)
                      .map(([platform, count]) => {
                        const total = Object.values(platformStats?.platformBreakdown || {}).reduce((a, b) => a + b, 0)
                        const percent = total > 0 ? (count / total) * 100 : 0
                        return (
                          <div key={platform} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {getPlatformLogo(platform, '', 14)}
                              <span>{platform === 'YOUTUBE' ? 'YouTube' : platform === 'TIKTOK' ? 'TikTok' : platform === 'INSTAGRAM' ? 'Instagram' : platform === 'TWITTER' ? 'X' : platform}</span>
                            </div>
                            <span className="text-muted-foreground">{count} ({percent.toFixed(0)}%)</span>
                          </div>
                        )
                      })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No platform data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Top Campaigns by Spend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Campaigns by Spend</CardTitle>
            </CardHeader>
            <CardContent>
              {platformStats?.topCampaigns && platformStats.topCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {platformStats.topCampaigns.slice(0, 5).map((campaign, idx) => (
                    <div key={campaign.id} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground/50 w-6">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{campaign.title}</p>
                        <p className="text-xs text-muted-foreground">{campaign.submissions} submissions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${campaign.earnings.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/submissions?status=PENDING" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Review Pending ({platformStats?.overview.pendingSubmissions || 0})
                </Button>
              </Link>
              <Link href="/admin/payouts" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Payouts
                </Button>
              </Link>
              <Link href="/admin/campaigns" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Target className="w-4 h-4 mr-2" />
                  Manage Campaigns
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cron Job Status */}
      <Card>
        <CardHeader 
          className="cursor-pointer py-4" 
          onClick={() => setShowCronLogs(!showCronLogs)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showCronLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <CardTitle className="text-sm font-medium">View Tracking Status</CardTitle>
              {cronLogs.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Last run: {new Date(cronLogs[0].startedAt).toLocaleTimeString()}
                </Badge>
              )}
              {cronLogs.length > 0 && (() => {
                // Check the most recent log's clip success rate, not just cron job status
                const mostRecentLog = cronLogs[0]
                const totalClips = mostRecentLog.clipsProcessed || 0
                const successfulClips = mostRecentLog.clipsSuccessful || 0
                const clipSuccessRate = totalClips > 0 ? successfulClips / totalClips : 1
                
                // Only show red if really failing (less than 50% success)
                // Show amber for mostly working (50-95%), green for excellent (95%+)
                if (clipSuccessRate >= 0.95) {
                  return <CheckCircle className="w-4 h-4 text-green-500" />
                } else if (clipSuccessRate >= 0.5 || (totalClips > 0 && successfulClips >= totalClips - 2)) {
                  // Also show amber/green if only 1-2 failures even if rate is slightly lower
                  return <CheckCircle className="w-4 h-4 text-amber-500" />
                } else {
                  return <XCircle className="w-4 h-4 text-red-500" />
                }
              })()}
            </div>
            <span className="text-xs text-muted-foreground">
              {cronLogs.length > 0 && (() => {
                const mostRecentLog = cronLogs[0]
                const total = mostRecentLog.clipsProcessed || 0
                const success = mostRecentLog.clipsSuccessful || 0
                return `${success}/${total} clips successful`
              })()}
            </span>
          </div>
        </CardHeader>
        
        {showCronLogs && (
          <CardContent className="pt-0">
            {cronLogs.length > 0 ? (
              <div className="space-y-2">
                {cronLogs.map((log) => {
                  // Calculate success rate for this individual log
                  const totalClips = log.clipsProcessed || 0
                  const successfulClips = log.clipsSuccessful || 0
                  const clipSuccessRate = totalClips > 0 ? successfulClips / totalClips : 1
                  const isFullSuccess = log.status === 'SUCCESS' && clipSuccessRate >= 0.95
                  const isMostlySuccess = log.status === 'SUCCESS' && clipSuccessRate >= 0.5
                  
                  return (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {isFullSuccess ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : isMostlySuccess ? (
                          <CheckCircle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{new Date(log.startedAt).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{log.clipsProcessed} clips</span>
                        <span className="text-green-600 dark:text-green-400">✓{log.clipsSuccessful}</span>
                        {log.clipsFailed > 0 && (
                          <span className={log.clipsFailed <= 2 ? "text-amber-500" : "text-red-500"}>
                            ✗{log.clipsFailed}
                          </span>
                        )}
                        {log.earningsCalculated > 0 && (
                          <span className="font-medium text-foreground">${log.earningsCalculated.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No cron logs yet</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
