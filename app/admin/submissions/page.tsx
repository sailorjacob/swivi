"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Check, X, ExternalLink, Search, Filter, Calendar, User, DollarSign, Loader2, AlertCircle, ArrowUpRight, XCircle, Trash2, ChevronDown, ChevronUp, ChevronRight, TrendingUp, Eye, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Submission {
  id: string
  clipUrl: string
  platform: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID"
  payout?: number
  paidAt?: string
  rejectionReason?: string
  requiresReview?: boolean
  reviewReason?: string
  autoRejected?: boolean
  processingStatus?: string // SCRAPING, COMPLETE, SCRAPE_FAILED, SCRAPE_ERROR, etc.
  createdAt: string
  updatedAt: string
  initialViews?: string
  currentViews?: string
  viewChange?: string
  finalEarnings?: string
  users: {
    id: string
    name: string | null
    email: string | null
    totalViews?: number
    totalEarnings?: number
  }
  clips?: {
    id: string
    title?: string
    views?: string
    earnings?: string
    status?: string
    view_tracking?: Array<{
      views: string
      date: string
      scrapedAt?: string
    }>
  }
  scrapeCount?: number
  campaigns: {
    id: string
    title: string
    creator: string
    payoutRate: number
    featuredImage?: string | null
    status?: string
  }
  socialAccount?: {
    id: string
    platform: string
    username: string
    displayName?: string | null
    verified?: boolean
    verifiedAt?: string | null
  } | null
}

// Helper to get processing status display
const getProcessingStatusDisplay = (status?: string) => {
  if (!status) return null
  if (status === 'SCRAPING') return { text: 'Scraping views...', color: 'text-muted-foreground' }
  if (status === 'COMPLETE') return { text: 'Scraped', color: 'text-foreground' }
  if (status.startsWith('SCRAPE_FAILED') || status.startsWith('SCRAPE_ERROR')) {
    return { text: 'Scrape failed', color: 'text-muted-foreground/60', tooltip: status }
  }
  return { text: status, color: 'text-muted-foreground' }
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "flagged", label: "Flagged for Review" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PAID", label: "Paid" }
]

const platformOptions = [
  { value: "all", label: "All Platforms" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TWITTER", label: "Twitter" },
  { value: "FACEBOOK", label: "Facebook" }
]

const dateRangeOptions = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" }
]

const payoutStatusOptions = [
  { value: "all", label: "All Payouts" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" }
]

// Get status icon component
const getStatusIcon = (status: string, autoRejected?: boolean) => {
  if (status === "APPROVED") {
    return <ArrowUpRight className="w-3 h-3 text-foreground" />
  } else if (status === "REJECTED") {
    return <XCircle className="w-3 h-3 text-muted-foreground" />
  }
  return null
}

export default function AdminSubmissionsPage() {
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [campaigns, setCampaigns] = useState<Array<{id: string, title: string, creator: string}>>([])
  const [loading, setLoading] = useState(true) // Initial load only
  const [isRefreshing, setIsRefreshing] = useState(false) // Background refresh indicator
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [customRejectionReason, setCustomRejectionReason] = useState("")
  const [payoutAmount, setPayoutAmount] = useState("")
  const [filters, setFilters] = useState({
    status: "all",
    platform: "all",
    campaignId: "",
    search: "",
    dateRange: "all",
    payoutStatus: "all"
  })
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    flagged: 0,
    total: 0
  })
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set())
  const [selectedUserModal, setSelectedUserModal] = useState<Submission['users'] | null>(null)
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([])
  const [loadingUserData, setLoadingUserData] = useState(false)

  // Scroll to highlighted submission when data loads
  useEffect(() => {
    if (highlightId && !loading && submissions.length > 0 && !hasScrolled) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        if (highlightedRef.current) {
          highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHasScrolled(true)
        }
      }, 100)
    }
  }, [highlightId, loading, submissions, hasScrolled])

  // Fetch campaigns for filtering
  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await authenticatedFetch("/api/admin/campaigns")
      if (response.ok) {
        const campaignData = await response.json()
        setCampaigns(campaignData)
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
    }
  }, [])

  // Track current offset in a ref to avoid re-triggering useEffect
  const currentOffsetRef = useRef(0)

  // Fetch submissions
  const fetchSubmissions = useCallback(async (loadMore = false, isBackgroundRefresh = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true)
      } else if (isBackgroundRefresh) {
        setIsRefreshing(true)
      } else {
      setLoading(true)
      }
      if (!isBackgroundRefresh) setError(null)
      
      // Use ref for offset to avoid dependency issues
      const offset = loadMore ? currentOffsetRef.current + pagination.limit : 0
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString()
      })

      if (filters.status !== "all") {
        if (filters.status === "flagged") {
          params.append("requiresReview", "true")
        } else {
          params.append("status", filters.status)
        }
      }
      if (filters.platform !== "all") {
        params.append("platform", filters.platform)
      }
      if (filters.dateRange !== "all") {
        params.append("dateRange", filters.dateRange)
      }
      if (filters.payoutStatus !== "all") {
        params.append("payoutStatus", filters.payoutStatus)
      }
      if (filters.campaignId) {
        params.append("campaignId", filters.campaignId)
      }

      const response = await authenticatedFetch(`/api/admin/submissions?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (loadMore) {
          // Append new submissions to existing ones
          setSubmissions(prev => [...prev, ...data.submissions])
        } else {
          // Replace submissions for fresh fetch
        setSubmissions(data.submissions)
        }
        // Update ref and state
        currentOffsetRef.current = offset
        setPagination({
          ...data.pagination,
          offset: offset
        })
        // Update status counts from API (accurate totals, not from paginated data)
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
      } else {
        if (!isBackgroundRefresh) setError("Failed to load submissions")
      }
    } catch (error) {
      console.error("Error fetching submissions:", error)
      if (!isBackgroundRefresh) setError("Failed to load submissions")
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
      setIsRefreshing(false)
    }
  }, [filters, pagination.limit]) // Removed pagination.offset from dependencies

  useEffect(() => {
    fetchCampaigns()
    fetchSubmissions()
  }, [fetchCampaigns, fetchSubmissions])

  // Auto-refresh submissions every 30 seconds to show real-time view tracking updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not currently loading to avoid race conditions
      if (!loading && !isRefreshing) {
        fetchSubmissions(false, true) // Background refresh - no loading state
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchSubmissions, loading, isRefreshing])

  // Update submission status
  const updateSubmissionStatus = async (submissionId: string, status: Submission["status"], reason?: string, payout?: number) => {
    try {
      const response = await authenticatedFetch(`/api/admin/submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          rejectionReason: reason,
          payout
        })
      })

      if (response.ok) {
        toast.success(`Submission ${status.toLowerCase()} successfully`)
        fetchSubmissions()
        setShowRejectDialog(false)
        setRejectionReason("")
        setPayoutAmount("")
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${status.toLowerCase()} submission`)
      }
    } catch (error) {
      console.error("Error updating submission:", error)
      toast.error("Failed to update submission")
    }
  }

  // Delete submission
  const deleteSubmission = async (submissionId: string) => {
    try {
      const response = await authenticatedFetch(`/api/admin/submissions/${submissionId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Submission deleted successfully")
        fetchSubmissions()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete submission")
      }
    } catch (error) {
      console.error("Error deleting submission:", error)
      toast.error("Failed to delete submission")
    }
  }

  // Get status badge color
  const getStatusColor = (submission: Submission) => {
    // Pending gets inverted blue pill
    if (submission.status === "PENDING" && !submission.requiresReview) {
      return "bg-foreground text-background border-foreground font-medium"
    }
    // Everything else monochromatic
    return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium"
  }

  // Use accurate status counts from API (not calculated from paginated data)
  const pendingCount = statusCounts.pending
  const approvedCount = statusCounts.approved
  const rejectedCount = statusCounts.rejected
  const paidCount = statusCounts.paid
  const flaggedCount = statusCounts.flagged
  const totalCount = statusCounts.total
  
  // Calculate total paid earnings from loaded submissions (for display purposes)
  const totalEarnings = submissions
    .filter(s => s.status === "PAID" && s.payout)
    .reduce((sum, s) => sum + (s.payout || 0), 0)

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg text-destructive mb-4">{error}</p>
            <Button onClick={fetchSubmissions} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Subtle refresh indicator - only shows during background refresh */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Updating...</span>
      </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Compact Stats Bar */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Pending:</span>
            <span className="font-semibold">{pendingCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Approved:</span>
            <span className="font-semibold">{approvedCount}</span>
          </div>
          {rejectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rejected:</span>
              <span className="font-semibold">{rejectedCount}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Paid:</span>
            <span className="font-semibold">${totalEarnings.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Paid submissions:</span>
            <span className="font-semibold">{paidCount}</span>
          </div>
          {flaggedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Flagged:</span>
              <span className="font-semibold">{flaggedCount}</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by user, campaign, or URL..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-[150px]">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[150px]">
                <Label>Platform</Label>
                <Select value={filters.platform} onValueChange={(value) => setFilters({ ...filters, platform: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[200px]">
                <Label>Campaign</Label>
                <Select value={filters.campaignId} onValueChange={(value) => setFilters({ ...filters, campaignId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.title} ({campaign.creator})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[150px]">
                <Label>Date Range</Label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[150px]">
                <Label>Payout Status</Label>
                <Select value={filters.payoutStatus} onValueChange={(value) => setFilters({ ...filters, payoutStatus: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {payoutStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!loading && submissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No submissions yet. Submissions will appear here once clippers start submitting.
                  </p>
                </div>
              ) : (
                submissions.map((submission) => {
                  const isHighlighted = highlightId === submission.id
                  return (
                <div
                  key={submission.id}
                  ref={isHighlighted ? highlightedRef : undefined}
                  className={`p-4 border rounded-lg hover:bg-muted/50 transition-all duration-500 ${
                    submission.requiresReview ? 'border-slate-400 bg-slate-100/30 dark:border-slate-600 dark:bg-slate-800/30' : ''
                  } ${isHighlighted ? 'bg-muted/80 border-foreground/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Platform, Status, and User info - all left aligned */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                        {getPlatformLogo(submission.platform, '', 16)}
                        <span className="text-xs font-medium">
                          {submission.platform === 'YOUTUBE' ? 'YouTube' : 
                           submission.platform === 'TIKTOK' ? 'TikTok' :
                           submission.platform === 'INSTAGRAM' ? 'Instagram' :
                           submission.platform === 'TWITTER' ? 'X' :
                           submission.platform}
                        </span>
                      </div>
                      {/* Only show status badge for non-PENDING submissions (PENDING has approve/reject buttons instead) */}
                      {submission.status !== "PENDING" && (
                        <div className="flex items-center gap-1">
                          {getStatusIcon(submission.status, submission.autoRejected)}
                          <Badge className={getStatusColor(submission)}>
                            {submission.status.charAt(0) + submission.status.slice(1).toLowerCase()}
                          </Badge>
                        </div>
                      )}
                      {submission.requiresReview && (
                        <>
                          <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                            Flagged
                          </Badge>
                          <AlertCircle className="w-4 h-4 text-amber-500" title="Flagged for review" />
                        </>
                      )}
                      {submission.autoRejected && (
                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground border border-border rounded">
                          Auto-rejected
                        </span>
                      )}
                      {/* Clickable user profile */}
                      <button
                        onClick={() => {
                          setSelectedUserModal(submission.users)
                          // Filter all submissions by this user
                          setUserSubmissions(submissions.filter(s => s.users.id === submission.users.id))
                        }}
                        className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <User className="w-3 h-3" />
                        <span className="group-hover:underline">{submission.users.name || submission.users.email}</span>
                      </button>
                    </div>
                    
                    {/* Campaign title and URL */}
                    <div className="mb-2 flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {submission.campaigns.featuredImage ? (
                          <img 
                            src={submission.campaigns.featuredImage} 
                            alt={submission.campaigns.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                            {submission.campaigns.title?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{submission.campaigns.title}</p>
                          <a 
                            href={`/admin/campaigns?id=${submission.campaigns.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            View →
                          </a>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          <button
                            onClick={() => window.open(submission.clipUrl, '_blank')}
                            className="text-sm text-muted-foreground hover:text-foreground underline hover:underline-offset-2 transition-colors"
                            title={submission.clipUrl}
                          >
                            {submission.clipUrl.length > 60 ? `${submission.clipUrl.substring(0, 60)}...` : submission.clipUrl}
                          </button>
                        </div>
                        {submission.requiresReview && submission.reviewReason && (
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-2">
                            <strong>Review Reason:</strong> {submission.reviewReason}
                          </p>
                        )}
                        {/* Verified Account - compact inline display */}
                        {submission.socialAccount && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <span className="font-mono text-foreground">@{submission.socialAccount.username}</span>
                              {submission.socialAccount.verified && (
                              <Check className="w-3 h-3 text-foreground" />
                              )}
                            </span>
                        )}
                      </div>
                    </div>
                    {/* Key Stats Row - Always Visible */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {/* Submitted time */}
                      <span className="text-muted-foreground">
                        Submitted {(() => {
                          try {
                            const date = new Date(submission.createdAt)
                            if (isNaN(date.getTime())) return 'Unknown'
                            return date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          } catch (error) {
                            return 'Invalid date'
                          }
                        })()}
                      </span>
                      
                      <span className="text-muted-foreground/40">•</span>
                      
                      {/* View Stats - Compact but informative */}
                      {(() => {
                        const hasInitialViews = submission.initialViews && Number(submission.initialViews) > 0
                        const hasCurrentViews = submission.currentViews && Number(submission.currentViews) > 0
                        const isScraping = submission.processingStatus === 'SCRAPING'
                        const scrapeFailed = submission.processingStatus?.startsWith('SCRAPE_FAILED') || 
                                            submission.processingStatus?.startsWith('SCRAPE_ERROR')
                        
                        if (isScraping) {
                          return (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Scraping...
                            </span>
                          )
                        }
                        
                        if (hasInitialViews || hasCurrentViews) {
                          return (
                            <div className="flex items-center gap-2">
                              <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                                {Number(submission.initialViews || 0).toLocaleString()} initial
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                                {Number(submission.currentViews || submission.initialViews || 0).toLocaleString()} current
                              </span>
                              {submission.viewChange && Number(submission.viewChange) > 0 && (
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  +{Number(submission.viewChange).toLocaleString()}
                                </span>
                              )}
                            </div>
                          )
                        }
                        
                        if (scrapeFailed) {
                          return (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title={submission.processingStatus}>
                              <AlertCircle className="w-3 h-3" />
                              Scrape failed
                            </span>
                          )
                        }
                        
                        return (
                          <span className="text-muted-foreground/60">Awaiting scrape</span>
                        )
                      })()}
                      
                      <span className="text-muted-foreground/40">•</span>
                      
                      {/* Scrape count and last scraped */}
                      {submission.clips?.view_tracking && submission.clips.view_tracking.length > 0 ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {submission.clips.view_tracking.length} scrape{submission.clips.view_tracking.length !== 1 ? 's' : ''}
                          <span className="text-muted-foreground/40">•</span>
                          Last: {new Date(submission.clips.view_tracking[0].scrapedAt || submission.clips.view_tracking[0].date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">No scrapes yet</span>
                      )}
                      {/* Earnings display */}
                      {submission.campaigns.status === 'COMPLETED' && submission.finalEarnings ? (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="font-bold text-foreground flex items-center gap-1">
                            ${Number(submission.finalEarnings).toFixed(2)} final 🔒
                          </span>
                        </>
                      ) : submission.clips?.earnings && Number(submission.clips.earnings) > 0 ? (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            ${Number(submission.clips.earnings).toFixed(2)} earned
                          </span>
                        </>
                      ) : submission.status === 'PENDING' ? (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-muted-foreground/60 italic">No earnings until approved</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* View Tracking Data Toggle - matching creator dashboard style */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newExpanded = new Set(expandedSubmissions)
                        if (newExpanded.has(submission.id)) {
                          newExpanded.delete(submission.id)
                        } else {
                          newExpanded.add(submission.id)
                        }
                        setExpandedSubmissions(newExpanded)
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {expandedSubmissions.has(submission.id) ? (
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
                    {submission.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission)
                            updateSubmissionStatus(submission.id, "APPROVED")
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setShowRejectDialog(true)
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {/* Revert to Pending - for approved or rejected submissions */}
                    {(submission.status === "APPROVED" || submission.status === "REJECTED") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedSubmission(submission)
                          updateSubmissionStatus(submission.id, "PENDING")
                        }}
                        title="Revert to pending for re-review"
                      >
                        ↩ Revert
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this submission? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSubmission(submission.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                {/* Expandable Tracking Details - Beautiful Analytics Section (matching creator dashboard) */}
                {expandedSubmissions.has(submission.id) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="space-y-4">
                      {/* Stats Summary - 3 columns like creator dashboard */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Initial Views</div>
                          <div className="text-lg font-semibold">
                            {Number(submission.initialViews || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Current Views</div>
                          <div className="text-lg font-semibold">
                            {Number(submission.currentViews || submission.initialViews || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Tracked Views</div>
                          <div className="text-lg font-semibold text-primary">
                            +{Number(submission.viewChange || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* View History Chart */}
                      {submission.clips?.view_tracking && submission.clips.view_tracking.length > 0 ? (
                        <>
                          <div>
                            <h4 className="text-sm font-medium mb-3">View History</h4>
                            <div className="h-48 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={submission.clips.view_tracking.map((t, idx) => ({
                                  date: new Date(t.scrapedAt || t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                  views: Number(t.views),
                                  scrapedAt: t.scrapedAt || t.date,
                                  success: Number(t.views) > 0 || idx > 0
                                }))}>
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

                          {/* Scrape Log - horizontal icons like creator dashboard */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Tracking History:</span>
                            {submission.clips.view_tracking.map((tracking, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center gap-1"
                                title={`${new Date(tracking.scrapedAt || tracking.date).toLocaleString()} - ${Number(tracking.views).toLocaleString()} views`}
                              >
                                {Number(tracking.views) > 0 || idx > 0 ? (
                                  <CheckCircle className="w-3 h-3 text-foreground" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No tracking data yet</p>
                          <p className="text-xs mt-1">View tracking data will appear here once scraping begins</p>
                        </div>
                      )}

                      {/* Status-based info cards */}
                      {submission.status === 'APPROVED' && (
                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Earnings Calculation</p>
                              <p className="text-sm font-medium">
                                {Number(submission.viewChange || 0).toLocaleString()} views × ${submission.campaigns.payoutRate}/1K
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ${((Number(submission.viewChange || 0) / 1000) * submission.campaigns.payoutRate).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">earned</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {submission.status === 'PENDING' && (
                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-sm">
                          <p className="text-amber-600 dark:text-amber-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Awaiting approval. Views are being tracked but earnings won't calculate until approved.
                          </p>
                        </div>
                      )}
                      
                      {submission.status === 'REJECTED' && (
                        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-sm">
                          <p className="text-red-600 dark:text-red-400 flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Rejected. {submission.rejectionReason ? `Reason: ${submission.rejectionReason}` : 'No earnings will be calculated.'}
                          </p>
                        </div>
                      )}

                      {/* User Stats Summary - clean bottom bar */}
                      <div className="pt-3 border-t border-dashed flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">User:</span>
                          <span className="font-medium">{submission.users.name || submission.users.email}</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{Number(submission.users.totalViews || 0).toLocaleString()} total views</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-medium text-green-600 dark:text-green-400">${Number(submission.users.totalEarnings || 0).toFixed(2)} earned</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedUserModal(submission.users)
                            setUserSubmissions(submissions.filter(s => s.users.id === submission.users.id))
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          View Profile →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )
                })
              )}
            </div>

            {pagination.hasMore && (
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => fetchSubmissions(true)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${pagination.total - submissions.length} remaining)`
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Reject Submission Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => {
        setShowRejectDialog(open)
        if (!open) {
          setRejectionReason("")
          setCustomRejectionReason("")
        }
      }}>
        <DialogContent aria-describedby="reject-dialog-description">
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <p id="reject-dialog-description" className="text-sm text-muted-foreground">
              Select a reason for rejecting this submission. The clipper will be notified.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Select
                value={rejectionReason}
                onValueChange={(value) => {
                  setRejectionReason(value)
                  if (value !== 'other') {
                    setCustomRejectionReason("")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-about-brand">Not about the brand</SelectItem>
                  <SelectItem value="low-quality">Low quality content</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="wrong-platform">Wrong platform</SelectItem>
                  <SelectItem value="duplicate">Duplicate submission</SelectItem>
                  <SelectItem value="guidelines-violation">Violates guidelines</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {rejectionReason === 'other' && (
              <div>
                <Label htmlFor="custom-reason">Custom Reason</Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Enter custom rejection reason..."
                  value={customRejectionReason}
                  onChange={(e) => setCustomRejectionReason(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionReason("")
                setCustomRejectionReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedSubmission) {
                  const finalReason = rejectionReason === 'other' ? customRejectionReason : rejectionReason
                  if (finalReason) {
                    updateSubmissionStatus(selectedSubmission.id, "REJECTED", finalReason)
                  }
                }
              }}
              disabled={!rejectionReason || (rejectionReason === 'other' && !customRejectionReason)}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <Dialog open={!!selectedUserModal} onOpenChange={(open) => {
        if (!open) {
          setSelectedUserModal(null)
          setUserSubmissions([])
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </DialogTitle>
          </DialogHeader>
          
          {selectedUserModal && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUserModal.name || 'No name'}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUserModal.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${Number(selectedUserModal.totalEarnings || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Earnings</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-2 bg-background rounded">
                    <p className="text-lg font-bold">{Number(selectedUserModal.totalViews || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                  <div className="p-2 bg-background rounded">
                    <p className="text-lg font-bold">{userSubmissions.length}</p>
                    <p className="text-xs text-muted-foreground">Submissions</p>
                  </div>
                  <div className="p-2 bg-background rounded">
                    <p className="text-lg font-bold">{userSubmissions.filter(s => s.status === 'APPROVED').length}</p>
                    <p className="text-xs text-muted-foreground">Approved</p>
                  </div>
                </div>
              </div>

              {/* User's Submissions */}
              <div>
                <h4 className="text-sm font-medium mb-3">Submissions ({userSubmissions.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userSubmissions.map((sub) => (
                    <div key={sub.id} className="p-3 border rounded-lg bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlatformLogo(sub.platform, '', 14)}
                          <Badge variant="outline" className="text-xs">
                            {sub.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {sub.campaigns.title}
                          </span>
                        </div>
                        <div className="text-right text-xs">
                          <span className="font-medium">{Number(sub.currentViews || sub.initialViews || 0).toLocaleString()} views</span>
                          {sub.clips?.earnings && Number(sub.clips.earnings) > 0 && (
                            <span className="ml-2 text-muted-foreground">
                              ${Number(sub.clips.earnings).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <a 
                        href={sub.clipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline mt-1 block truncate"
                      >
                        {sub.clipUrl}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Social Accounts */}
              {userSubmissions.some(s => s.socialAccount) && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Verified Accounts</h4>
                  <div className="flex flex-wrap gap-2">
                    {[...new Map(userSubmissions
                      .filter(s => s.socialAccount)
                      .map(s => [s.socialAccount?.id, s.socialAccount])
                    ).values()].map((account: any) => (
                      <div key={account.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm">
                        {getPlatformLogo(account.platform, '', 14)}
                        <span className="font-mono">@{account.username}</span>
                        {account.verified && <Check className="w-3 h-3 text-green-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUserModal(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                window.open(`/admin/users?email=${encodeURIComponent(selectedUserModal?.email || '')}`, '_blank')
              }}
            >
              View Full Profile →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
