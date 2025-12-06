'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, CheckCircle, XCircle, ChevronDown, ChevronRight, ChevronUp,
  TrendingUp, Eye, DollarSign, Users, FileVideo, BarChart3, 
  Clock, ExternalLink, RefreshCw
} from 'lucide-react'
import { authenticatedFetch } from '@/lib/supabase-browser'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Dot } from 'recharts'
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
  const [loading, setLoading] = useState(true) // Initial load only
  const [isRefreshing, setIsRefreshing] = useState(false) // Background refresh indicator
  const [logsLoading, setLogsLoading] = useState(true)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [showCronLogs, setShowCronLogs] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAllData(false) // Initial load
    // Auto-refresh every 30 seconds - silent background refresh
    const interval = setInterval(() => fetchAllData(true), 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAllData = async (isBackgroundRefresh = false) => {
    if (isBackgroundRefresh) {
      setIsRefreshing(true)
    }
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
      // Only show loading on initial load, not background refresh
      if (!isBackgroundRefresh) {
      setLoading(true)
      }
      const response = await authenticatedFetch('/api/admin/analytics/view-history')
      const data = await response.json()

      if (response.ok) {
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error('Error fetching view history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCronLogs = async () => {
    try {
      setLogsLoading(true)
      const response = await authenticatedFetch('/api/admin/analytics/cron-logs?limit=10')
      
      if (response.ok) {
        const data = await response.json()
        setCronLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch cron logs:', error)
    } finally {
      setLogsLoading(false)
    }
  }

  const toggleCampaign = (campaignId: string) => {
    const newExpanded = new Set(expandedCampaigns)
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId)
    } else {
      newExpanded.add(campaignId)
    }
    setExpandedCampaigns(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Calculate effective CPM
  const effectiveCPM = platformStats?.overview.trackedViews && platformStats.overview.trackedViews > 0
    ? (platformStats.overview.totalEarnings / platformStats.overview.trackedViews) * 1000
    : 0

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
    <div className="container mx-auto px-4 py-8 space-y-6 relative">
      {/* Subtle refresh indicator - only shows during background refresh */}
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
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform-wide performance and campaign insights</p>
            </div>
        <Button variant="ghost" size="sm" onClick={() => fetchAllData(false)} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
                        </div>

      {/* Whop-Style Platform Stats - Top Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total views generated</p>
            <p className="text-3xl font-bold">{(platformStats?.overview.trackedViews || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total amount paid out</p>
            <p className="text-3xl font-bold">${(platformStats?.payoutStats.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Effective CPM</p>
            <p className="text-3xl font-bold">${effectiveCPM.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Approved submissions</p>
            <p className="text-3xl font-bold">{(platformStats?.overview.approvedSubmissions || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total submissions</p>
            <p className="text-3xl font-bold">{(platformStats?.overview.totalSubmissions || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
                      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
                <p className="text-xl font-bold">{platformStats?.overview.activeCampaigns || 0}</p>
                      </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
        </CardContent>
      </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Clippers</p>
                <p className="text-xl font-bold">{platformStats?.overview.totalUsers || 0}</p>
              </div>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Review</p>
                <p className="text-xl font-bold">{platformStats?.overview.pendingSubmissions || 0}</p>
              </div>
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Payouts</p>
                <p className="text-xl font-bold">${(platformStats?.payoutStats.pendingPayouts || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Campaign Overview</TabsTrigger>
          <TabsTrigger value="clips">Clip Tracking</TabsTrigger>
          <TabsTrigger value="platform">Platform Breakdown</TabsTrigger>
        </TabsList>

        {/* Campaign Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Campaign Performance</h2>
              <Link href="/admin/submissions">
                <Button variant="outline" size="sm">
                  Review Submissions →
                </Button>
              </Link>
            </div>

            {/* Campaign Cards - Whop Style */}
            {platformStats?.campaignTrackedViews && platformStats.campaignTrackedViews.length > 0 ? (
              <div className="space-y-4">
                {platformStats.campaignTrackedViews.map((campaign) => {
                  const progressPercent = campaign.currentViews > 0 
                    ? Math.min(100, (campaign.trackedViews / campaign.currentViews) * 100) 
                    : 0
                  
                  return (
                    <Card key={campaign.campaignId} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{campaign.campaignTitle}</h3>
                              <Badge variant={campaign.campaignStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                                {campaign.campaignStatus}
                              </Badge>
                            </div>
                            <Link 
                              href={`/admin/submissions?campaignId=${campaign.campaignId}`}
                              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              See submissions ({campaign.totalSubmissions} total, {campaign.approvedSubmissions || 0} approved)
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Views Generated</span>
                            <span className="font-medium">{campaign.trackedViews.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-green-500 transition-all duration-500"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Initial Views</p>
                            <p className="font-medium">{campaign.initialViews.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Current Views</p>
                            <p className="font-medium">{campaign.currentViews.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Views Gained</p>
                            <p className="font-medium">+{campaign.trackedViews.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Submissions</p>
                            <p className="font-medium">{campaign.totalSubmissions}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No campaigns with tracked views yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Clip Tracking Tab */}
        <TabsContent value="clips" className="mt-6">
      <div className="space-y-4">
            {campaigns.length > 0 ? campaigns.map((campaignGroup) => {
          const isExpanded = expandedCampaigns.has(campaignGroup.campaign.id)
          const totalViews = campaignGroup.clips.reduce((sum, clip) => sum + clip.currentViews, 0)
          const totalEarnings = campaignGroup.clips.reduce((sum, clip) => sum + clip.earnings, 0)

          return (
            <Card key={campaignGroup.campaign.id}>
                  <CardHeader className="py-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCampaign(campaignGroup.campaign.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                          <CardTitle className="text-base">{campaignGroup.campaign.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {campaignGroup.clips.length} clips • {totalViews.toLocaleString()} views • ${totalEarnings.toFixed(2)} earned
                      </CardDescription>
                    </div>
                  </div>
                      <Badge variant="outline">{campaignGroup.campaign.status}</Badge>
                </div>
              </CardHeader>

              {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                    {campaignGroup.clips.map((clip) => {
                      const chartData = clip.viewHistory.map(point => ({
                        date: formatDate(point.date),
                        views: point.views,
                        success: point.success
                      }))

                      if (chartData.length > 0 && clip.initialViews > 0) {
                        chartData.unshift({
                          date: formatDate(clip.submittedAt),
                          views: clip.initialViews,
                          success: true
                        })
                      }

                      const viewGrowth = clip.currentViews - clip.initialViews

                      return (
                            <div key={clip.submissionId} className="p-4 bg-muted/30 rounded-lg border">
                              {/* User & Clip Info */}
                              <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getPlatformLogo(clip.platform, '', 16)}
                                    <span className="font-medium text-sm">{clip.user.name || clip.user.email}</span>
                                    <Badge variant="outline" className="text-xs">{clip.status}</Badge>
                              </div>
                              <a 
                                href={clip.clipUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-foreground underline break-all transition-colors"
                              >
                                    {clip.clipUrl.length > 60 ? `${clip.clipUrl.substring(0, 60)}...` : clip.clipUrl}
                              </a>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Submitted: {new Date(clip.submittedAt).toLocaleDateString()}
                                  </p>
                            </div>
                            <div className="text-right ml-4">
                                  <p className="font-bold">{clip.currentViews.toLocaleString()} views</p>
                              {viewGrowth > 0 && (
                                    <p className="text-xs font-medium">+{viewGrowth.toLocaleString()}</p>
                              )}
                                  <p className="text-xs text-muted-foreground">${clip.earnings.toFixed(2)}</p>
                            </div>
                          </div>

                              {/* Mini Chart */}
                              {chartData.length > 1 && (
                                <div className="h-16">
                                  <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <Line 
                                    type="monotone" 
                                    dataKey="views" 
                                        stroke="currentColor" 
                                    strokeWidth={2}
                                        dot={false}
                                        className="text-foreground/60"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                              {/* Scrape Status */}
                              <div className="flex items-center gap-1 mt-2">
                            <span className="text-xs text-muted-foreground">Scrapes:</span>
                                {clip.viewHistory.slice(0, 10).map((point, idx) => (
                              <div 
                                key={idx}
                                title={`${new Date(point.scrapedAt).toLocaleString()} - ${point.views.toLocaleString()} views`}
                              >
                                {point.success ? (
                                      <CheckCircle className="w-3 h-3 text-foreground/70" />
                                ) : (
                                      <XCircle className="w-3 h-3 text-foreground/40" />
                                )}
                              </div>
                            ))}
                                {clip.viewHistory.length > 10 && (
                                  <span className="text-xs text-muted-foreground">+{clip.viewHistory.length - 10} more</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )
            }) : (
          <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No clips being tracked yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
        </TabsContent>

        {/* Platform Breakdown Tab */}
        <TabsContent value="platform" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Platform Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submissions by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                {platformStats?.platformBreakdown && Object.keys(platformStats.platformBreakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(platformStats.platformBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([platform, count]) => {
                        const total = Object.values(platformStats.platformBreakdown).reduce((a, b) => a + b, 0)
                        const percent = total > 0 ? (count / total) * 100 : 0
                        
                        return (
                          <div key={platform}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {getPlatformLogo(platform, '', 16)}
                                <span className="text-sm font-medium">
                                  {platform === 'YOUTUBE' ? 'YouTube' : 
                                   platform === 'TIKTOK' ? 'TikTok' :
                                   platform === 'INSTAGRAM' ? 'Instagram' :
                                   platform === 'TWITTER' ? 'X' : platform}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">{count} ({percent.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-foreground/70"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No platform data yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Top Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Campaigns by Spend</CardTitle>
              </CardHeader>
              <CardContent>
                {platformStats?.topCampaigns && platformStats.topCampaigns.length > 0 ? (
                  <div className="space-y-2">
                    {platformStats.topCampaigns.slice(0, 5).map((campaign, idx) => (
                      <div key={campaign.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="text-sm font-medium truncate max-w-[180px]">{campaign.title}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">${campaign.earnings.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{campaign.submissions} subs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No campaigns yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Collapsible Cron Logs Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer py-4" 
          onClick={() => setShowCronLogs(!showCronLogs)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showCronLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <CardTitle className="text-sm font-medium">Cron Job History</CardTitle>
              {cronLogs.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Last run: {new Date(cronLogs[0].startedAt).toLocaleTimeString()}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {cronLogs.filter(l => l.status === 'SUCCESS').length}/{cronLogs.length} successful
            </span>
          </div>
        </CardHeader>
        
        {showCronLogs && (
          <CardContent className="pt-0">
            {logsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : cronLogs.length > 0 ? (
              <div className="space-y-2">
                {cronLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS'
                  const duration = log.duration ? `${(log.duration / 1000).toFixed(1)}s` : 'N/A'
                  
                  return (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {isSuccess ? (
                          <CheckCircle className="w-4 h-4 text-foreground/70" />
                        ) : (
                          <XCircle className="w-4 h-4 text-foreground/50" />
                        )}
                        <span className="text-muted-foreground">
                          {new Date(log.startedAt).toLocaleString()}
                        </span>
                        <span>• {duration}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{log.clipsProcessed} processed</span>
                        <span className="font-medium">✓{log.clipsSuccessful}</span>
                        {log.clipsFailed > 0 && <span className="opacity-60">✗{log.clipsFailed}</span>}
                        {log.earningsCalculated > 0 && (
                          <span className="font-medium">${log.earningsCalculated.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">No cron logs yet.</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
