"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, Eye, TrendingUp, DollarSign } from "lucide-react"
import { authenticatedFetch } from "@/lib/supabase-browser"
import toast from "react-hot-toast"

interface TestResult {
  success: boolean
  clipId?: string
  previousViews?: number
  currentViews?: number
  viewsGained?: number
  earnings?: number
  error?: string
  stats?: {
    totalViews: number
    viewsToday: number
    viewsYesterday: number
    viewsThisWeek: number
    averageDailyViews: number
    daysTracked: number
  }
  batch?: {
    processed: number
    successful: number
    failed: number
    errors: Array<{ clipId: string; error: string }>
  }
  viewTracking?: {
    duration: string
    processed: number
    successful: number
    failed: number
    errors: Array<{ clipId: string; error: string }>
  }
  campaignCompletion?: {
    duration: string
    completed: number
    skipped: number
    errors: Array<{ campaignId: string; error: string }>
  }
}

export default function ViewTrackingTestPage() {
  const [clipId, setClipId] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [clips, setClips] = useState<Array<{ id: string; title: string; url: string }>>([])

  // Fetch available clips for testing
  useEffect(() => {
    fetchClips()
  }, [])

  const fetchClips = async () => {
    try {
      const response = await authenticatedFetch("/api/clippers/dashboard")
      if (response.ok) {
        const data = await response.json()
        if (data.recentClips && data.recentClips.length > 0) {
          setClips(data.recentClips.map((clip: any) => ({
            id: clip.id,
            title: clip.title,
            url: clip.clipUrl
          })))
        }
      }
    } catch (error) {
      console.error("Error fetching clips:", error)
    }
  }

  const testAction = async (action: string, requiresClipId: boolean = true) => {
    if (requiresClipId && !clipId.trim()) {
      toast.error("Please enter a clip ID")
      return
    }

    setLoading(true)
    try {
      const response = await authenticatedFetch("/api/debug/test-view-tracking", {
        method: "POST",
        body: JSON.stringify({
          clipId: clipId.trim(),
          action
        })
      })

      const result = await response.json()

      if (response.ok) {
        setResults(prev => ({
          ...prev,
          [action]: result
        }))
        toast.success(`${action} completed successfully`)
      } else {
        setResults(prev => ({
          ...prev,
          [action]: { success: false, error: result.error }
        }))
        toast.error(result.error || `Failed to ${action}`)
      }
    } catch (error) {
      console.error(`Error testing ${action}:`, error)
      setResults(prev => ({
        ...prev,
        [action]: { success: false, error: "Network error" }
      }))
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (result: TestResult) => {
    if (result.success === undefined) return null
    return result.success ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-500" />
    )
  }

  const formatNumber = (num?: number) => {
    if (num === undefined) return "N/A"
    return num.toLocaleString()
  }

  const formatCurrency = (num?: number) => {
    if (num === undefined) return "N/A"
    return `$${num.toFixed(2)}`
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">View Tracking Test Dashboard</h1>
        <p className="text-gray-600">Test and verify the view tracking system functionality</p>
      </div>

      {/* Test Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="clipId">Clip ID</Label>
              <Input
                id="clipId"
                value={clipId}
                onChange={(e) => setClipId(e.target.value)}
                placeholder="Enter clip ID to test"
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() => testAction("track_single")}
                disabled={loading || !clipId.trim()}
                className="flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                Track Single Clip
              </Button>
              <Button
                onClick={() => testAction("process_all", false)}
                disabled={loading}
                variant="outline"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                Process All Clips
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => testAction("get_stats")}
              disabled={loading || !clipId.trim()}
              variant="outline"
              size="sm"
            >
              Get Stats
            </Button>
            <Button
              onClick={() => testAction("calculate_earnings")}
              disabled={loading || !clipId.trim()}
              variant="outline"
              size="sm"
            >
              Calculate Earnings
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Cron Job Testing</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                onClick={() => testAction("test_view_tracking_cron", false)}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Test View Tracking Cron
              </Button>
              <Button
                onClick={() => testAction("test_campaign_completion", false)}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Test Campaign Completion
              </Button>
              <Button
                onClick={() => testAction("test_scraping_endpoints", false)}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Test Scraping Endpoints
              </Button>
            </div>
          </div>

          {/* Available Clips */}
          {clips.length > 0 && (
            <div className="mt-6">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Available Clips for Testing</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {clips.slice(0, 6).map((clip) => (
                  <Button
                    key={clip.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setClipId(clip.id)}
                    className="justify-start text-left"
                  >
                    <div className="truncate">
                      <div className="font-medium">{clip.title}</div>
                      <div className="text-xs text-gray-500 truncate">{clip.url}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Track Single Clip Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.track_single && getStatusIcon(results.track_single)}
              Track Single Clip
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.track_single ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Previous Views:</span>
                    <div className="text-lg font-mono">{formatNumber(results.track_single.previousViews)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Current Views:</span>
                    <div className="text-lg font-mono">{formatNumber(results.track_single.currentViews)}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Views Gained:</span>
                    <div className={`text-lg font-mono ${results.track_single.viewsGained && results.track_single.viewsGained > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.track_single.viewsGained !== undefined ? (results.track_single.viewsGained > 0 ? '+' : '') + formatNumber(results.track_single.viewsGained) : 'N/A'}
                    </div>
                  </div>
                </div>
                {results.track_single.error && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    Error: {results.track_single.error}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No test results yet</p>
            )}
          </CardContent>
        </Card>

        {/* Process All Clips Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.process_all && getStatusIcon(results.process_all)}
              Process All Clips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.process_all ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Processed:</span>
                    <div className="text-lg font-mono">{results.process_all.batch?.processed || 0}</div>
                  </div>
                  <div>
                    <span className="font-medium">Successful:</span>
                    <div className="text-lg font-mono text-green-600">{results.process_all.batch?.successful || 0}</div>
                  </div>
                  <div>
                    <span className="font-medium">Failed:</span>
                    <div className="text-lg font-mono text-red-600">{results.process_all.batch?.failed || 0}</div>
                  </div>
                </div>
                {results.process_all.batch?.errors && results.process_all.batch.errors.length > 0 && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    <div className="font-medium mb-1">Errors:</div>
                    {results.process_all.batch.errors.map((error, index) => (
                      <div key={index} className="text-xs">
                        {error.clipId}: {error.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No test results yet</p>
            )}
          </CardContent>
        </Card>

        {/* Clip Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.get_stats && getStatusIcon(results.get_stats)}
              Clip Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.get_stats?.stats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Views:</span>
                    <div className="text-lg font-mono">{formatNumber(results.get_stats.stats.totalViews)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Today:</span>
                    <div className="text-lg font-mono">{formatNumber(results.get_stats.stats.viewsToday)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Yesterday:</span>
                    <div className="text-lg font-mono">{formatNumber(results.get_stats.stats.viewsYesterday)}</div>
                  </div>
                  <div>
                    <span className="font-medium">This Week:</span>
                    <div className="text-lg font-mono">{formatNumber(results.get_stats.stats.viewsThisWeek)}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Avg Daily:</span>
                    <div className="text-lg font-mono">{formatNumber(results.get_stats.stats.averageDailyViews)}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Tracked for {results.get_stats.stats.daysTracked} days
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No test results yet</p>
            )}
          </CardContent>
        </Card>

        {/* Earnings Calculation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.calculate_earnings && getStatusIcon(results.calculate_earnings)}
              <DollarSign className="w-5 h-5" />
              Earnings Calculation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.calculate_earnings ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Views Gained:</span>
                    <div className="text-lg font-mono">{formatNumber(results.calculate_earnings.viewsGained)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Earnings:</span>
                    <div className="text-lg font-mono text-green-600">{formatCurrency(results.calculate_earnings.earnings)}</div>
                  </div>
                </div>
                {results.calculate_earnings.error && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    Error: {results.calculate_earnings.error}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No test results yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cron Job Test Results */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Cron Job Test Results</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* View Tracking Cron Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.test_view_tracking_cron && getStatusIcon(results.test_view_tracking_cron)}
                View Tracking Cron Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.test_view_tracking_cron ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span>
                      <div className="text-sm font-mono">{results.test_view_tracking_cron.viewTracking?.duration || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium">Processed:</span>
                      <div className="text-sm font-mono">{results.test_view_tracking_cron.viewTracking?.processed || 0}</div>
                    </div>
                    <div>
                      <span className="font-medium">Successful:</span>
                      <div className="text-sm font-mono text-green-600">{results.test_view_tracking_cron.viewTracking?.successful || 0}</div>
                    </div>
                  </div>
                  {results.test_view_tracking_cron.viewTracking?.errors && results.test_view_tracking_cron.viewTracking.errors.length > 0 && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                      <div className="font-medium mb-1">Errors:</div>
                      {results.test_view_tracking_cron.viewTracking.errors.map((error, index) => (
                        <div key={index} className="text-xs">
                          {error.clipId}: {error.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No test results yet</p>
              )}
            </CardContent>
          </Card>

          {/* Campaign Completion Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.test_campaign_completion && getStatusIcon(results.test_campaign_completion)}
                Campaign Completion Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.test_campaign_completion ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span>
                      <div className="text-sm font-mono">{results.test_campaign_completion.campaignCompletion?.duration || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium">Completed:</span>
                      <div className="text-sm font-mono text-green-600">{results.test_campaign_completion.campaignCompletion?.completed || 0}</div>
                    </div>
                    <div>
                      <span className="font-medium">Skipped:</span>
                      <div className="text-sm font-mono">{results.test_campaign_completion.campaignCompletion?.skipped || 0}</div>
                    </div>
                  </div>
                  {results.test_campaign_completion.campaignCompletion?.errors && results.test_campaign_completion.campaignCompletion.errors.length > 0 && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                      <div className="font-medium mb-1">Errors:</div>
                      {results.test_campaign_completion.campaignCompletion.errors.map((error, index) => (
                        <div key={index} className="text-xs">
                          {error.campaignId}: {error.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No test results yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">How to Test View Tracking:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Select a clip from the available clips or enter a clip ID manually</li>
                <li>Click "Track Single Clip" to test individual clip view tracking</li>
                <li>Use "Process All Clips" to test batch processing (scrapes all active clips)</li>
                <li>Use "Get Stats" to view detailed view statistics for a clip</li>
                <li>Use "Calculate Earnings" to test earnings calculation based on view growth</li>
                <li>Use the "Cron Job Testing" section to test automated systems</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium">What to Look For:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Success indicators:</strong> Green checkmarks and positive view growth</li>
                <li><strong>Scraping issues:</strong> Check console for Apify API errors</li>
                <li><strong>Database issues:</strong> Verify data is being saved to view_tracking table</li>
                <li><strong>Rate limiting:</strong> Apify has rate limits, so test gradually</li>
                <li><strong>Cron job testing:</strong> Use the cron job test buttons to verify automated systems</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> For testing without real campaigns, you can create test clips with URLs that return consistent view counts, or use the cron job that runs every few hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
