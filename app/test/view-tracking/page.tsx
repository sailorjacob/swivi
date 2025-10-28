"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Loader2, Eye, TrendingUp, DollarSign, Trash2, Clock, Play, Plus, LogIn } from "lucide-react"
import { authenticatedFetch } from "@/lib/supabase-browser"
import toast from "react-hot-toast"
import Link from "next/link"

interface TestClip {
  id: string
  url: string
  platform: string
  title: string
  totalViews: number
  latestTracking: {
    date: string
    views: number
  } | null
  createdAt: string
}

interface TrackingResult {
  success: boolean
  clipId?: string
  previousViews?: number
  currentViews?: number
  viewsGained?: number
  trackingHistory?: Array<{
    date: string
    views: number
  }>
  error?: string
}

interface ClipStats {
  totalViews: number
  viewsToday: number
  viewsYesterday: number
  viewsThisWeek: number
  averageDailyViews: number
  daysTracked: number
  trackingHistory: Array<{
    date: string
    views: number
  }>
}

interface CronTestResult {
  success: boolean
  message: string
  viewTracking?: {
    processed: number
    successful: number
    failed: number
    errors: Array<{ clipId: string; error: string }>
  }
  campaignCompletion?: {
    completed: number
    skipped: number
    errors: Array<{ campaignId: string; error: string }>
  }
}

interface EarningsResult {
  success: boolean
  earnings: number
  viewsGained: number
  calculation: {
    firstViews: number
    lastViews: number
    rate: string
    trackingDays: number
  }
  error?: string
}

export default function ViewTrackingTestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [platform, setPlatform] = useState("")
  const [loading, setLoading] = useState(false)
  const [testClips, setTestClips] = useState<TestClip[]>([])
  const [selectedClipId, setSelectedClipId] = useState("")
  const [trackingResults, setTrackingResults] = useState<Record<string, TrackingResult>>({})
  const [clipStats, setClipStats] = useState<ClipStats | null>(null)
  const [cronResults, setCronResults] = useState<CronTestResult | null>(null)
  const [earningsResults, setEarningsResults] = useState<EarningsResult | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Load test clips when authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      loadTestClips()
    }
  }, [status, session])

  // Show loading state
  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // In production, show login prompt if not authenticated
  // In development, allow testing without auth
  const isDev = process.env.NODE_ENV === 'development'
  
  if (!isDev && (status === "unauthenticated" || !session?.user)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-6 h-6" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Please login to access the view tracking test system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🧪 View Tracking Test System</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Test view tracking, earnings calculation, and payouts across all platforms.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link href="/clippers/login" className="flex-1">
                <Button className="w-full" size="lg">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login to Test
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const loadTestClips = async () => {
    setRefreshing(true)
    try {
      const response = await authenticatedFetch("/api/test/view-tracking", {
        method: "POST",
        body: JSON.stringify({ action: "list_test_clips" })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTestClips(data.clips)
        }
      }
    } catch (error) {
      console.error("Error loading test clips:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const submitUrl = async () => {
    if (!url.trim() || !platform) {
      toast.error("Please enter a URL and select a platform")
      return
    }

    setLoading(true)
    try {
      const response = await authenticatedFetch("/api/test/view-tracking", {
        method: "POST",
        body: JSON.stringify({
          url: url.trim(),
          platform,
          action: "submit_url"
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("Test clip created successfully!")
        setUrl("")
        setPlatform("")
        await loadTestClips() // Refresh the list
      } else {
        toast.error(result.error || "Failed to create test clip")
      }
    } catch (error) {
      console.error("Error creating test clip:", error)
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  const trackViews = async (clipId: string) => {
    setLoading(true)
    try {
      const response = await authenticatedFetch("/api/test/view-tracking", {
        method: "POST",
        body: JSON.stringify({
          clipId,
          action: "track_views"
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setTrackingResults(prev => ({
          ...prev,
          [`track_${clipId}`]: result
        }))
        toast.success("Views tracked successfully!")
        await loadTestClips() // Refresh to get latest data
      } else {
        setTrackingResults(prev => ({
          ...prev,
          [`track_${clipId}`]: { success: false, error: result.error }
        }))
        toast.error(result.error || "Failed to track views")
      }
    } catch (error) {
      console.error("Error tracking views:", error)
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  const getClipStats = async (clipId: string) => {
    setLoading(true)
    try {
      const response = await authenticatedFetch("/api/test/view-tracking", {
        method: "POST",
        body: JSON.stringify({
          clipId,
          action: "get_tracking_history"
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setClipStats(result.stats)
        setTrackingResults(prev => ({
          ...prev,
          [`stats_${clipId}`]: result
        }))
        toast.success("Stats loaded successfully!")
      } else {
        toast.error(result.error || "Failed to load stats")
      }
    } catch (error) {
      console.error("Error getting stats:", error)
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  const calculateEarnings = async (clipId: string) => {
    setLoading(true)
    try {
      const response = await authenticatedFetch("/api/test/view-tracking", {
        method: "POST",
        body: JSON.stringify({
          clipId,
          action: "calculate_earnings"
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setEarningsResults(result)
        toast.success("Earnings calculated successfully!")
      } else {
        setEarningsResults({ ...result, success: false } as EarningsResult)
        toast.error(result.error || "Failed to calculate earnings")
      }
    } catch (error) {
      console.error("Error calculating earnings:", error)
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  const deleteTestClip = async (clipId: string) => {
    if (!confirm("Are you sure you want to delete this test clip? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    try {
      const response = await authenticatedFetch("/api/test/view-tracking", {
        method: "POST",
        body: JSON.stringify({
          clipId,
          action: "delete_test_clip"
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("Test clip deleted successfully!")
        await loadTestClips() // Refresh the list
        if (selectedClipId === clipId) {
          setSelectedClipId("")
          setClipStats(null)
          setEarningsResults(null)
        }
      } else {
        toast.error(result.error || "Failed to delete test clip")
      }
    } catch (error) {
      console.error("Error deleting test clip:", error)
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  const testCronJob = async () => {
    setLoading(true)
    try {
      const response = await authenticatedFetch("/api/test/view-tracking", {
        method: "POST",
        body: JSON.stringify({
          action: "test_cron_job"
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setCronResults(result)
        toast.success("Cron job test completed successfully!")
      } else {
        toast.error(result.error || "Failed to test cron job")
      }
    } catch (error) {
      console.error("Error testing cron job:", error)
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'TIKTOK': return 'bg-pink-100 text-pink-800'
      case 'YOUTUBE': return 'bg-red-100 text-red-800'
      case 'INSTAGRAM': return 'bg-purple-100 text-purple-800'
      case 'TWITTER': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'TIKTOK': return '🎵'
      case 'YOUTUBE': return '📺'
      case 'INSTAGRAM': return '📸'
      case 'TWITTER': return '🐦'
      default: return '📱'
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatCurrency = (num: number) => {
    return `$${num.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">View Tracking Test System</h1>
        <p className="text-gray-600">Test and verify the view tracking system without needing active campaigns</p>
      </div>

      <Tabs defaultValue="submit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="submit">Submit URLs</TabsTrigger>
          <TabsTrigger value="tracking">Track Views</TabsTrigger>
          <TabsTrigger value="stats">View Stats</TabsTrigger>
          <TabsTrigger value="cron">Cron Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="space-y-6">
          {/* URL Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Submit Test URLs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Label htmlFor="url">Video/Clip URL</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@username/video/..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TIKTOK">TikTok</SelectItem>
                      <SelectItem value="YOUTUBE">YouTube</SelectItem>
                      <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                      <SelectItem value="TWITTER">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={submitUrl}
                disabled={loading || !url.trim() || !platform}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Test Clip
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Submit URLs from any platform to create test clips for tracking. These clips are separate from campaign submissions.
              </p>
            </CardContent>
          </Card>

          {/* Test Clips List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Your Test Clips ({testClips.length})
                <Button
                  onClick={loadTestClips}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testClips.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No test clips created yet</p>
                  <p className="text-sm text-gray-400">Submit a URL above to create your first test clip</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testClips.map((clip) => (
                    <Card key={clip.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getPlatformColor(clip.platform)}>
                            {getPlatformIcon(clip.platform)} {clip.platform}
                          </Badge>
                          <Button
                            onClick={() => deleteTestClip(clip.id)}
                            disabled={loading}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <h4 className="font-medium text-sm mb-2 line-clamp-2">{clip.title}</h4>

                        <div className="text-xs text-gray-500 mb-2 truncate" title={clip.url}>
                          {clip.url}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Views: {formatNumber(clip.totalViews)}</span>
                          <Button
                            onClick={() => {
                              setSelectedClipId(clip.id)
                              trackViews(clip.id)
                            }}
                            disabled={loading}
                            size="sm"
                            variant="outline"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Track
                          </Button>
                        </div>

                        {clip.latestTracking && (
                          <div className="text-xs text-gray-400 mt-1">
                            Last tracked: {formatDate(clip.latestTracking.date)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Manual View Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="selectClip">Select Test Clip</Label>
                <Select value={selectedClipId} onValueChange={setSelectedClipId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a test clip to track" />
                  </SelectTrigger>
                  <SelectContent>
                    {testClips.map((clip) => (
                      <SelectItem key={clip.id} value={clip.id}>
                        {getPlatformIcon(clip.platform)} {clip.platform} - {formatNumber(clip.totalViews)} views
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => selectedClipId && trackViews(selectedClipId)}
                disabled={loading || !selectedClipId}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                Track Views Now
              </Button>

              {/* Tracking Results */}
              {Object.entries(trackingResults).map(([key, result]) => (
                key.startsWith('track_') && (
                  <Card key={key} className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        View Tracking Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.success ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Previous Views:</span>
                            <div className="text-lg font-mono">{formatNumber(result.previousViews || 0)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Current Views:</span>
                            <div className="text-lg font-mono">{formatNumber(result.currentViews || 0)}</div>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Views Gained:</span>
                            <div className={`text-lg font-mono ${result.viewsGained && result.viewsGained > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.viewsGained !== undefined ? (result.viewsGained > 0 ? '+' : '') + formatNumber(result.viewsGained) : '0'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-red-600 bg-red-50 p-3 rounded">
                          Error: {result.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clip Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Clip Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="statsClip">Select Test Clip</Label>
                  <Select value={selectedClipId} onValueChange={setSelectedClipId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a test clip for stats" />
                    </SelectTrigger>
                    <SelectContent>
                      {testClips.map((clip) => (
                        <SelectItem key={clip.id} value={clip.id}>
                          {getPlatformIcon(clip.platform)} {clip.platform} - {formatNumber(clip.totalViews)} views
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Button
                    onClick={() => selectedClipId && getClipStats(selectedClipId)}
                    disabled={loading || !selectedClipId}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                    Get Stats
                  </Button>
                  <Button
                    onClick={() => selectedClipId && calculateEarnings(selectedClipId)}
                    disabled={loading || !selectedClipId}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                    Calculate Earnings
                  </Button>
                </div>

                {clipStats && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Views:</span>
                        <div className="text-lg font-mono">{formatNumber(clipStats.totalViews)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Today:</span>
                        <div className="text-lg font-mono">{formatNumber(clipStats.viewsToday)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Yesterday:</span>
                        <div className="text-lg font-mono">{formatNumber(clipStats.viewsYesterday)}</div>
                      </div>
                      <div>
                        <span className="font-medium">This Week:</span>
                        <div className="text-lg font-mono">{formatNumber(clipStats.viewsThisWeek)}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Avg Daily:</span>
                        <div className="text-lg font-mono">{formatNumber(clipStats.averageDailyViews)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Tracked for {clipStats.daysTracked} days
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Earnings Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Earnings Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                {earningsResults ? (
                  <div className="space-y-4">
                    {earningsResults.success ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Views Gained:</span>
                            <div className="text-lg font-mono">{formatNumber(earningsResults.viewsGained)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Earnings:</span>
                            <div className="text-lg font-mono text-green-600">{formatCurrency(earningsResults.earnings)}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <div>Rate: {earningsResults.calculation.rate}</div>
                          <div>Tracking Period: {earningsResults.calculation.trackingDays} days</div>
                          <div>From {formatNumber(earningsResults.calculation.firstViews)} to {formatNumber(earningsResults.calculation.lastViews)} views</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-red-600 bg-red-50 p-3 rounded">
                        {earningsResults.error || "Error calculating earnings"}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Calculate earnings for a test clip</p>
                    <p className="text-sm text-gray-400">Need at least 2 tracking records</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tracking History Chart */}
          {clipStats && clipStats.trackingHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>View Tracking History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clipStats.trackingHistory.slice(0, 10).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{formatDate(entry.date)}</span>
                      <span className="font-mono">{formatNumber(entry.views)} views</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cron" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Cron Job Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button
                  onClick={testCronJob}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  Test Cron Job System
                </Button>
              </div>

              {cronResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* View Tracking Results */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">View Tracking</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Processed:</span>
                            <div className="text-lg font-mono">{cronResults.viewTracking?.processed || 0}</div>
                          </div>
                          <div>
                            <span className="font-medium">Successful:</span>
                            <div className="text-lg font-mono text-green-600">{cronResults.viewTracking?.successful || 0}</div>
                          </div>
                          <div>
                            <span className="font-medium">Failed:</span>
                            <div className="text-lg font-mono text-red-600">{cronResults.viewTracking?.failed || 0}</div>
                          </div>
                        </div>
                        {cronResults.viewTracking?.errors && cronResults.viewTracking.errors.length > 0 && (
                          <div className="mt-3 text-red-600 text-sm bg-red-50 p-2 rounded">
                            <div className="font-medium mb-1">Errors:</div>
                            {cronResults.viewTracking.errors.map((error, index) => (
                              <div key={index} className="text-xs">
                                {error.clipId}: {error.error}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Campaign Completion Results */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Campaign Completion</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Completed:</span>
                            <div className="text-lg font-mono text-green-600">{cronResults.campaignCompletion?.completed || 0}</div>
                          </div>
                          <div>
                            <span className="font-medium">Skipped:</span>
                            <div className="text-lg font-mono">{cronResults.campaignCompletion?.skipped || 0}</div>
                          </div>
                          <div>
                            <span className="font-medium">Errors:</span>
                            <div className="text-lg font-mono text-red-600">{cronResults.campaignCompletion?.errors?.length || 0}</div>
                          </div>
                        </div>
                        {cronResults.campaignCompletion?.errors && cronResults.campaignCompletion.errors.length > 0 && (
                          <div className="mt-3 text-red-600 text-sm bg-red-50 p-2 rounded">
                            <div className="font-medium mb-1">Errors:</div>
                            {cronResults.campaignCompletion.errors.map((error, index) => (
                              <div key={index} className="text-xs">
                                {error.campaignId}: {error.error}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cron Job Information */}
          <Card>
            <CardHeader>
              <CardTitle>Cron Job Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Scheduled Cron Jobs:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>View Tracking:</strong> Runs every 4 hours</li>
                    <li><strong>Payout Calculation:</strong> Runs every 4 hours</li>
                    <li><strong>Campaign Completion:</strong> Runs with view tracking</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">What the Cron Jobs Do:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>View Tracking:</strong> Scrapes current view counts for all active clips and updates the database</li>
                    <li><strong>Campaign Completion:</strong> Checks if campaigns have reached their goals or deadlines</li>
                    <li><strong>Payout Calculation:</strong> Calculates earnings based on view growth and campaign rates</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Testing Tip:</strong> Use the test buttons above to manually trigger these systems. The scheduled cron jobs run automatically every 4 hours on Vercel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Test the View Tracking System</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Step 1: Submit Test URLs</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to the "Submit URLs" tab</li>
                <li>Enter a video URL from TikTok, YouTube, Instagram, or Twitter</li>
                <li>Select the correct platform</li>
                <li>Click "Create Test Clip" - this creates a test clip in the database</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium">Step 2: Track Views Over Time</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to the "Track Views" tab</li>
                <li>Select a test clip from the dropdown</li>
                <li>Click "Track Views Now" to scrape current view count</li>
                <li>Wait a few hours/days and track again to see view growth</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium">Step 3: Monitor Statistics</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to the "View Stats" tab</li>
                <li>Select a clip and click "Get Stats" to see detailed analytics</li>
                <li>Click "Calculate Earnings" to test payment calculations</li>
                <li>View the tracking history to see view growth over time</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium">Step 4: Test Cron Jobs</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to the "Cron Testing" tab</li>
                <li>Click "Test Cron Job System" to manually trigger automated processes</li>
                <li>Check the results to ensure scraping and calculations work</li>
                <li>The real cron jobs run every 4 hours automatically</li>
              </ol>
            </div>

            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-green-800">
                <strong>Success Indicators:</strong> Green checkmarks, increasing view counts, successful scraping, and accurate earnings calculations. If you see consistent results over multiple days, the system is working correctly!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

