'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, ChevronDown, ChevronRight, TrendingUp, Eye, DollarSign } from 'lucide-react'
import { authenticatedFetch } from '@/lib/supabase-browser'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Dot } from 'recharts'
import Link from 'next/link'

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

export default function AdminAnalyticsPage() {
  const [campaigns, setCampaigns] = useState<CampaignGroup[]>([])
  const [cronLogs, setCronLogs] = useState<CronLog[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchViewHistory()
    fetchCronLogs()
  }, [])

  const fetchViewHistory = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch('/api/admin/analytics/view-history')
      const data = await response.json()

      if (response.ok) {
        setCampaigns(data.campaigns)
        // Auto-expand first campaign
        if (data.campaigns.length > 0) {
          setExpandedCampaigns(new Set([data.campaigns[0].campaign.id]))
        }
      } else {
        console.error('Failed to fetch view history:', data.error)
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
      const response = await authenticatedFetch('/api/admin/analytics/cron-logs?limit=20')
      
      if (!response.ok) {
        throw new Error('Failed to fetch cron logs')
      }

      const data = await response.json()
      setCronLogs(data.logs || [])
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              ← Back to Admin
            </Button>
          </Link>
          <h1 className="text-3xl font-light">View Tracking Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Monitor view growth and scraping history for all campaigns and clips
        </p>
      </div>

      {/* Cron Job Logs */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Recent Cron Job Runs</CardTitle>
          <CardDescription>View tracking and earnings calculation job history</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : cronLogs.length > 0 ? (
            <div className="space-y-3">
              {cronLogs.map((log) => {
                const isSuccess = log.status === 'SUCCESS'
                const duration = log.duration ? `${(log.duration / 1000).toFixed(1)}s` : 'N/A'
                
                return (
                  <div 
                    key={log.id} 
                    className="p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {isSuccess ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{log.jobName}</span>
                            <Badge className={isSuccess ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300"}>
                              {log.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-x-3">
                            <span>{new Date(log.startedAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>Duration: {duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground ml-4">
                        <div>Processed: {log.clipsProcessed}</div>
                        <div className="text-green-600">✓ {log.clipsSuccessful}</div>
                        {log.clipsFailed > 0 && <div className="text-red-600">✗ {log.clipsFailed}</div>}
                        {log.earningsCalculated > 0 && <div className="text-blue-600">${log.earningsCalculated.toFixed(2)}</div>}
                      </div>
                    </div>
                    {log.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-800 dark:text-red-300">
                        {log.errorMessage}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No cron job logs found</p>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">Being tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clips</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.clips.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Submissions tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${campaigns.reduce((sum, c) => 
                sum + c.clips.reduce((clipSum, clip) => clipSum + clip.earnings, 0), 0
              ).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Groups */}
      <div className="space-y-4">
        {campaigns.map((campaignGroup) => {
          const isExpanded = expandedCampaigns.has(campaignGroup.campaign.id)
          const totalViews = campaignGroup.clips.reduce((sum, clip) => sum + clip.currentViews, 0)
          const totalEarnings = campaignGroup.clips.reduce((sum, clip) => sum + clip.earnings, 0)

          return (
            <Card key={campaignGroup.campaign.id}>
              <CardHeader>
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
                      <CardTitle className="text-lg">{campaignGroup.campaign.title}</CardTitle>
                      <CardDescription>
                        {campaignGroup.clips.length} clips • {totalViews.toLocaleString()} total views • ${totalEarnings.toFixed(2)} earned
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300">
                    {campaignGroup.campaign.status}
                  </Badge>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <div className="space-y-6">
                    {campaignGroup.clips.map((clip) => {
                      // Prepare chart data
                      const chartData = clip.viewHistory.map(point => ({
                        date: formatDate(point.date),
                        views: point.views,
                        fullDate: point.date,
                        success: point.success
                      }))

                      // Add initial views as first data point if we have history
                      if (chartData.length > 0 && clip.initialViews > 0) {
                        chartData.unshift({
                          date: formatDate(clip.submittedAt),
                          views: clip.initialViews,
                          fullDate: clip.submittedAt,
                          success: true
                        })
                      }

                      const viewGrowth = clip.currentViews - clip.initialViews

                      return (
                        <div key={clip.submissionId} className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 capitalize">
                                  {clip.status.toLowerCase()}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{clip.platform}</span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">{clip.user.email}</span>
                              </div>
                              <a 
                                href={clip.clipUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:text-blue-700 underline break-all"
                              >
                                {clip.clipUrl.length > 80 ? `${clip.clipUrl.substring(0, 80)}...` : clip.clipUrl}
                              </a>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm font-semibold">{clip.currentViews.toLocaleString()} views</div>
                              {viewGrowth > 0 && (
                                <div className="text-xs text-green-600">+{viewGrowth.toLocaleString()}</div>
                              )}
                              {clip.earnings > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">${clip.earnings.toFixed(2)} earned</div>
                              )}
                            </div>
                          </div>

                          {/* View Growth Chart */}
                          {chartData.length > 0 && (
                            <div className="mb-3">
                              <ResponsiveContainer width="100%" height={80}>
                                <LineChart data={chartData}>
                                  <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 10 }}
                                    stroke="#888"
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 10 }}
                                    stroke="#888"
                                  />
                                  <Tooltip 
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        return (
                                          <div className="bg-background border rounded-lg p-2 shadow-lg">
                                            <p className="text-sm font-semibold">{payload[0].value?.toLocaleString()} views</p>
                                            <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                                          </div>
                                        )
                                      }
                                      return null
                                    }}
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="views" 
                                    stroke="#22c55e" 
                                    strokeWidth={2}
                                    dot={(props: any) => {
                                      const { cx, cy, payload } = props
                                      return (
                                        <Dot
                                          cx={cx}
                                          cy={cy}
                                          r={4}
                                          fill={payload.success ? '#22c55e' : '#ef4444'}
                                          stroke="white"
                                          strokeWidth={2}
                                        />
                                      )
                                    }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* Scrape Log */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Scrapes:</span>
                            {clip.viewHistory.map((point, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center gap-1"
                                title={`${new Date(point.scrapedAt).toLocaleString()} - ${point.views.toLocaleString()} views`}
                              >
                                {point.success ? (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                            ))}
                            {clip.viewHistory.length === 0 && (
                              <span className="text-xs text-muted-foreground italic">No tracking data yet</span>
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
        })}

        {campaigns.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No campaigns with tracked clips found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
