"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  DollarSign,
  TrendingUp,
  Target,
  Play,
  Eye,
  ExternalLink,
  Wallet,
  Clock,
  CheckCircle,
  Trash2,
  ArrowUpRight,
  XCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
  Info
} from "lucide-react"

// Get status icon component
const getStatusIcon = (status: string) => {
  if (status === "approved" || status === "APPROVED") {
    return <ArrowUpRight className="w-3 h-3 text-foreground" />
  } else if (status === "rejected" || status === "REJECTED") {
    return <XCircle className="w-3 h-3 text-muted-foreground" />
  }
  return null
}

interface ScrapeRecord {
  views: number
  date: string
  scrapedAt: string
  success: boolean
}

interface DashboardData {
  stats: Array<{
    title: string
    value: string
    change: string
    icon: string
  }>
  recentClips: Array<{
    id: string
    clipId?: string | null
    title: string
    campaign: string
    campaignId?: string | null
    campaignImage?: string | null
    campaignStatus?: string | null
    status: string
    clipStatus?: string | null
    views: number
    earnings: number
    clipUrl: string
    platform: string
    createdAt: string
    initialViews?: string
    currentViews?: string
    viewChange?: string
    lastTracked?: string | null
    scrapeCount?: number
    scrapeHistory?: ScrapeRecord[]
  }>
  activeCampaigns: number
  availableBalance?: number
  totalEarnings?: number
  trackedViews?: number
}

export default function ClipperDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Payout request state
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'PAYPAL' | 'BANK_TRANSFER' | 'STRIPE'>('PAYPAL')
  const [paymentDetails, setPaymentDetails] = useState('')
  const [submittingPayout, setSubmittingPayout] = useState(false)
  
  // Analytics state
  const [expandedClips, setExpandedClips] = useState<Set<string>>(new Set())
  const [clipAnalytics, setClipAnalytics] = useState<Record<string, any>>({})
  const [loadingAnalytics, setLoadingAnalytics] = useState<Set<string>>(new Set())
  
  // Info notice state - check localStorage to see if user dismissed it
  const [showInfoNotice, setShowInfoNotice] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('creator-info-notice-dismissed') !== 'true'
    }
    return true
  })
  
  const dismissInfoNotice = () => {
    setShowInfoNotice(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('creator-info-notice-dismissed', 'true')
    }
  }

  // Get icon component from string name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "DollarSign": return DollarSign
      case "Target": return Target
      case "Play": return Play
      case "Eye": return Eye
      case "TrendingUp": return TrendingUp
      default: return DollarSign
    }
  }

  // Toggle clip analytics expansion
  const toggleClipAnalytics = async (clipId: string) => {
    const newExpanded = new Set(expandedClips)
    
    if (newExpanded.has(clipId)) {
      // Collapse
      newExpanded.delete(clipId)
      setExpandedClips(newExpanded)
    } else {
      // Expand - fetch analytics if not already loaded
      newExpanded.add(clipId)
      setExpandedClips(newExpanded)
      
      if (!clipAnalytics[clipId]) {
        // Fetch analytics data
        const newLoading = new Set(loadingAnalytics)
        newLoading.add(clipId)
        setLoadingAnalytics(newLoading)
        
        try {
          const response = await authenticatedFetch(`/api/creators/clip-analytics?clipId=${clipId}`)
          if (response.ok) {
            const data = await response.json()
            setClipAnalytics(prev => ({
              ...prev,
              [clipId]: data.clip
            }))
          }
        } catch (error) {
          console.error("Error fetching clip analytics:", error)
        } finally {
          const updatedLoading = new Set(loadingAnalytics)
          updatedLoading.delete(clipId)
          setLoadingAnalytics(updatedLoading)
        }
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated" || (!loading && !session?.user)) {
      router.push("/creators/login")
    }
  }, [status, session, router, loading])

  // Fetch dashboard data
  useEffect(() => {
    if (status === "authenticated" && session?.user && loading) {
      fetchDashboardData()
    }
  }, [status, session])

  // Auto-refresh dashboard every 30 seconds to show real-time view tracking updates
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return
    
    const interval = setInterval(() => {
      // Only refresh if not currently loading to avoid race conditions
      if (!loading) {
        fetchDashboardData()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [status, session, loading])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📊 Fetching dashboard data for user:', session?.user?.email)

      const response = await authenticatedFetch("/api/creators/dashboard")

      if (response.ok) {
        const dashboardData = await response.json()
        console.log('✅ Dashboard data loaded:', dashboardData)
        setData(dashboardData)
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    try {
      setSubmittingPayout(true)

      const amount = parseFloat(payoutAmount)
      if (isNaN(amount) || amount < 20) {
        toast({
          title: 'Invalid Amount',
          description: 'Minimum payout is $20.00',
          variant: 'destructive'
        })
        return
      }

      if (!paymentDetails) {
        toast({
          title: 'Payment Details Required',
          description: 'Please enter your payment details',
          variant: 'destructive'
        })
        return
      }

      const response = await authenticatedFetch('/api/creators/payout-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod,
          paymentDetails
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Payout Requested! 🎉',
          description: `Your request for $${amount.toFixed(2)} has been submitted`
        })
        setPayoutDialogOpen(false)
        setPayoutAmount('')
        setPaymentDetails('')
        fetchDashboardData()
      } else {
        toast({
          title: 'Request Failed',
          description: data.error || 'Failed to submit payout request',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit payout request',
        variant: 'destructive'
      })
    } finally {
      setSubmittingPayout(false)
    }
  }

  const handleDeleteSubmission = async (submissionId: string, hasEarnings: boolean) => {
    if (hasEarnings) {
      toast({
        title: 'Cannot Delete',
        description: 'Submissions with earnings cannot be deleted',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await authenticatedFetch(`/api/admin/submissions/${submissionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Submission Deleted',
          description: 'Your submission has been removed'
        })
        fetchDashboardData() // Refresh the dashboard
      } else {
        const data = await response.json()
        toast({
          title: 'Delete Failed',
          description: data.error || 'Failed to delete submission',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete submission',
        variant: 'destructive'
      })
    }
  }

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-4">Dashboard Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchDashboardData}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard render
  return (
    <div className="container mx-auto px-4 py-8">

      {/* Info Notice - Floating at bottom center */}
      {showInfoNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full mx-4">
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-background border border-border rounded-lg shadow-lg text-sm">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-muted-foreground">
                Posts are generally approved within 24 hours. Tracking starts as soon as posts are submitted.
              </p>
            </div>
            <button
              onClick={dismissInfoNotice}
              className="p-1 hover:bg-muted rounded transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Compact Stats Bar */}
      {data?.stats && data.stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm mb-6">
          {data.stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground">{stat.title}:</span>
              <span className="font-semibold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Payout Request Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Submit a payout request for your earnings (minimum $20)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input
                type="number"
                min="20"
                step="0.01"
                placeholder="20.00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: ${data?.availableBalance?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="STRIPE">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                {paymentMethod === 'PAYPAL' ? 'PayPal Email' : 
                 paymentMethod === 'STRIPE' ? 'Wallet Address' : 
                 'Bank Account Details'}
              </label>
              <Input
                type="text"
                placeholder={
                  paymentMethod === 'PAYPAL' ? 'your@email.com' : 
                  paymentMethod === 'STRIPE' ? '0x...' : 
                  'Account number or details'
                }
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayoutDialogOpen(false)}
              disabled={submittingPayout}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={submittingPayout}
            >
              {submittingPayout ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Submissions */}
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-6">All Submissions</h2>

        {data?.recentClips?.length > 0 ? (
          <div className="space-y-4">
            {data.recentClips.map((clip) => (
              <Card key={clip.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                        {getPlatformLogo(clip.platform, '', 16)}
                        <span className="text-xs font-medium capitalize">
                          {clip.platform?.toLowerCase() === 'youtube' ? 'YouTube' : 
                           clip.platform?.toLowerCase() === 'tiktok' ? 'TikTok' :
                           clip.platform?.toLowerCase() === 'instagram' ? 'Instagram' :
                           clip.platform?.toLowerCase() === 'twitter' ? 'X' :
                           clip.platform}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(clip.status)}
                        <Badge className={
                          clip.status === 'pending' 
                            ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:text-white font-medium capitalize"
                            : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium capitalize"
                        }>
                          {clip.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Campaign Image - Clickable */}
                    <Link 
                      href={clip.campaignId ? `/creators/dashboard/campaigns/${clip.campaignId}` : '#'}
                      className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted hover:opacity-80 transition-opacity"
                    >
                      {clip.campaignImage ? (
                        <img 
                          src={clip.campaignImage} 
                          alt={clip.campaign} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                          {clip.campaign?.charAt(0) || '?'}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          href={clip.campaignId ? `/creators/dashboard/campaigns/${clip.campaignId}` : '#'}
                          className="text-foreground font-medium hover:underline"
                        >
                          {clip.campaign}
                        </Link>
                        <Link 
                          href={clip.campaignId ? `/creators/dashboard/campaigns/${clip.campaignId}` : '#'}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          View →
                        </Link>
                      </div>

                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">{clip.views.toLocaleString()} views</span>
                        {clip.viewChange && Number(clip.viewChange) > 0 && (
                          <span className="text-green-600 dark:text-green-400">+{Number(clip.viewChange).toLocaleString()}</span>
                        )}
                        {clip.status === 'approved' && clip.earnings > 0 ? (
                          <span className="font-medium">${clip.earnings.toFixed(2)} earned</span>
                        ) : clip.status === 'pending' ? (
                          <span className="text-xs italic">earnings start after approval</span>
                        ) : null}
                        <span className="hidden sm:inline">•</span>
                        {clip.scrapeCount !== undefined && clip.scrapeCount > 0 && (
                          <span className="text-xs">{clip.scrapeCount} scrape{clip.scrapeCount !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Submitted {new Date(clip.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: new Date(clip.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {clip.lastTracked && (
                          <span> • Last tracked {new Date(clip.lastTracked).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>

                      {/* Clean clickable clip URL - just the essential link */}
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        <button
                          onClick={() => window.open(clip.clipUrl, '_blank')}
                          className="text-sm text-blue-500 hover:text-blue-700 underline hover:underline-offset-2 transition-colors"
                          title={`Open clip: ${clip.clipUrl}`}
                        >
                          {clip.clipUrl.length > 60 ? `${clip.clipUrl.substring(0, 60)}...` : clip.clipUrl}
                        </button>
                      </div>

                      {/* View Analytics Toggle Button */}
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleClipAnalytics(clip.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {expandedClips.has(clip.id) ? (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Hide Analytics
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4 mr-1" />
                              View Tracking Data
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Delete button - only show for pending/rejected clips with no earnings */}
                    {(clip.status === 'pending' || clip.status === 'rejected') && clip.earnings === 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your submission.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSubmission(clip.id, clip.earnings > 0)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {/* Expandable Analytics Section */}
                  {expandedClips.has(clip.id) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      {loadingAnalytics.has(clip.id) ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : clipAnalytics[clip.id] ? (
                        <div className="space-y-4">
                          {/* Stats Summary */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1">Initial Views</div>
                              <div className="text-lg font-semibold">
                                {clipAnalytics[clip.id].initialViews.toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1">Current Views</div>
                              <div className="text-lg font-semibold">
                                {clipAnalytics[clip.id].currentViews.toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-green-500/10 p-3 rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1">Tracked Views</div>
                              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                +{clipAnalytics[clip.id].trackedViews.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* View History Chart */}
                          {clipAnalytics[clip.id].viewHistory.length > 0 ? (
                            <>
                              <div>
                                <h4 className="text-sm font-medium mb-3">View History</h4>
                                <div className="h-48 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={clipAnalytics[clip.id].viewHistory}>
                                      <XAxis
                                        dataKey="date"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                      />
                                      <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        tickFormatter={(value) => value.toLocaleString()}
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
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                                        activeDot={{ r: 5 }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Scrape Log - max 10 icons shown */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">Tracking History:</span>
                                {(() => {
                                  const viewHistory = clipAnalytics[clip.id].viewHistory
                                  const totalCount = viewHistory.length
                                  const maxIcons = 10
                                  const displayItems = totalCount > maxIcons ? viewHistory.slice(-maxIcons) : viewHistory
                                  const hiddenCount = totalCount - displayItems.length
                                  
                                  return (
                                    <>
                                      {hiddenCount > 0 && (
                                        <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                                          +{hiddenCount} more
                                        </span>
                                      )}
                                      {displayItems.map((point: any, idx: number) => (
                                        <div 
                                          key={idx}
                                          className="flex items-center gap-1"
                                          title={`${new Date(point.scrapedAt).toLocaleString()} - ${point.views.toLocaleString()} views`}
                                        >
                                          {point.success ? (
                                            <CheckCircle className="w-3 h-3 text-foreground" />
                                          ) : (
                                            <XCircle className="w-3 h-3 text-muted-foreground" />
                                          )}
                                        </div>
                                      ))}
                                    </>
                                  )
                                })()}
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No tracking data yet</p>
                              <p className="text-xs mt-1">View tracking data will appear here once scraping begins</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                          Failed to load analytics data
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No posts submitted yet</h3>
              <p className="text-muted-foreground mb-4">
                Start earning by submitting posts to active campaigns
              </p>
              <Link href="/creators/dashboard/campaigns">
                <Button variant="outline" className="rounded-full px-6 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300">
                  Submit Your First Post
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  )
}

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
