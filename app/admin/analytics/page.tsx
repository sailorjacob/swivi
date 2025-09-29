"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, Users, DollarSign, Target, Calendar, Activity, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalCampaigns: number
    totalSubmissions: number
    activeCampaigns: number
    totalViews: number
    totalEarnings: number
    pendingSubmissions: number
    approvedSubmissions: number
    paidSubmissions: number
  }
  trends: {
    users: Array<{ date: string, count: number }>
    campaigns: Array<{ date: string, count: number }>
    submissions: Array<{ date: string, count: number }>
    views: Array<{ date: string, count: number }>
    earnings: Array<{ date: string, amount: number }>
  }
  topCampaigns: Array<{
    id: string
    title: string
    submissions: number
    views: number
    earnings: number
    status: string
  }>
  platformBreakdown: {
    TIKTOK: number
    YOUTUBE: number
    INSTAGRAM: number
    TWITTER: number
    FACEBOOK: number
  }
  payoutStats: {
    totalPaid: number
    pendingPayouts: number
    averagePayout: number
  }
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("30d")

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/analytics/aggregate?timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        setError("Failed to load analytics data")
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setError("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  ← Back to Admin
                </Button>
              </Link>
              <h1 className="text-3xl font-light">Platform Analytics</h1>
            </div>
            <p className="text-muted-foreground">
              Platform performance and insights
            </p>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        {analytics?.overview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-semibold">{analytics.overview.totalUsers}</p>
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
                      <p className="text-2xl font-semibold">{analytics.overview.activeCampaigns}</p>
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
                      <p className="text-2xl font-semibold">{Number(analytics.overview.totalViews || 0).toLocaleString()}</p>
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
                      <p className="text-2xl font-semibold">${Number(analytics.overview.totalEarnings || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="platforms">Platforms</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Pending Review</span>
                          <span className="font-medium">{analytics.overview.pendingSubmissions || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Approved</span>
                          <span className="font-medium">{analytics.overview.approvedSubmissions || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Paid</span>
                          <span className="font-medium">{analytics.overview.paidSubmissions || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Submissions</span>
                          <span className="font-medium">{analytics.overview.totalSubmissions || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Campaigns</span>
                          <span className="font-medium">{analytics.overview.totalCampaigns || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Active Campaigns</span>
                          <span className="font-medium text-green-600">{analytics.overview.activeCampaigns || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Conversion Rate</span>
                          <span className="font-medium">
                            {(analytics.overview.totalSubmissions || 0) > 0
                              ? (((analytics.overview.approvedSubmissions || 0) / (analytics.overview.totalSubmissions || 1)) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="campaigns" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.topCampaigns && analytics.topCampaigns.length > 0 ? (
                        analytics.topCampaigns.map((campaign) => (
                          <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h3 className="font-medium">{campaign.title}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>Submissions: {campaign.submissions}</span>
                                <span>Views: {campaign.views.toLocaleString()}</span>
                                <span>Earnings: ${campaign.earnings.toFixed(2)}</span>
                              </div>
                            </div>
                            <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>
                              {campaign.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No campaign data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="platforms" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.platformBreakdown && Object.keys(analytics.platformBreakdown).length > 0 ? (
                        Object.entries(analytics.platformBreakdown).map(([platform, count]) => (
                          <div key={platform} className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{platform}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No platform data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payouts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payout Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Paid Out</span>
                        <span className="font-medium">${analytics.payoutStats.totalPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pending Payouts</span>
                        <span className="font-medium">${analytics.payoutStats.pendingPayouts.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Payout</span>
                        <span className="font-medium">${analytics.payoutStats.averagePayout.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>
    </div>
  )
}
