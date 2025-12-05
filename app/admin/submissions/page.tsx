"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Check, X, ExternalLink, Search, Filter, Calendar, User, DollarSign, Loader2, AlertCircle, ArrowUpRight, XCircle, Trash2 } from "lucide-react"
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
  processingStatus?: string
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
    view_tracking?: Array<{
      views: string
      date: string
    }>
  }
  campaigns: {
    id: string
    title: string
    creator: string
    payoutRate: number
    featuredImage?: string | null
    status?: string
  }
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
    return <ArrowUpRight className="w-3 h-3 text-green-600" />
  } else if (status === "REJECTED") {
    return <XCircle className="w-3 h-3 text-red-600" />
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
  const [loading, setLoading] = useState(true)
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

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
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
        setSubmissions(data.submissions)
        setPagination(data.pagination)
      } else {
        setError("Failed to load submissions")
      }
    } catch (error) {
      console.error("Error fetching submissions:", error)
      setError("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.limit, pagination.offset])

  useEffect(() => {
    fetchCampaigns()
    fetchSubmissions()
  }, [fetchCampaigns, fetchSubmissions])

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
      return "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:text-white font-medium"
    }
    // Everything else monochromatic
    return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium"
  }

  // Calculate stats
  const pendingCount = submissions.filter(s => s.status === "PENDING" && !s.requiresReview).length
  const approvedCount = submissions.filter(s => s.status === "APPROVED").length
  const paidCount = submissions.filter(s => s.status === "PAID").length
  const flaggedCount = submissions.filter(s => s.requiresReview).length
  const totalEarnings = submissions
    .filter(s => s.status === "PAID" && s.payout)
    .reduce((sum, s) => sum + (s.payout || 0), 0)

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">{error}</p>
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
      {/* Subtle loading indicator */}
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
        {/* Compact Stats Bar */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Pending:</span>
            <span className="font-semibold">{pendingCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Approved:</span>
            <span className="font-semibold">{approvedCount}</span>
          </div>
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
                  className={`flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-all duration-500 ${
                    submission.requiresReview ? 'border-slate-400 bg-slate-100/30 dark:border-slate-600 dark:bg-slate-800/30' : ''
                  } ${isHighlighted ? 'bg-muted/80 border-foreground/20' : ''}`}
                >
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
                      <div className="flex items-center gap-1">
                        {getStatusIcon(submission.status, submission.autoRejected)}
                        <Badge className={getStatusColor(submission)}>
                          {submission.requiresReview ? 'Flagged' : submission.status.charAt(0) + submission.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                      {submission.requiresReview && (
                        <AlertCircle className="w-4 h-4 text-slate-500" title="Flagged for review" />
                      )}
                      {submission.autoRejected && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded">
                          Auto-rejected
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {submission.users.email}
                      </span>
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
                            className="text-sm text-blue-500 hover:text-blue-700 underline hover:underline-offset-2 transition-colors"
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
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>Submitted: {(() => {
                        try {
                          const date = new Date(submission.createdAt)
                          if (isNaN(date.getTime())) {
                            return 'Unknown date'
                          }
                          return date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        } catch (error) {
                          console.error('Date parsing error:', error, 'Raw date:', submission.createdAt)
                          return 'Invalid date'
                        }
                      })()}</span>
                      {submission.payout && (
                        <span>Payout: ${submission.payout.toFixed(2)}</span>
                      )}
                      {/* View tracking data */}
                      {(submission.initialViews && Number(submission.initialViews) > 0) || 
                       (submission.currentViews && Number(submission.currentViews) > 0) ? (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Views:</span>
                          {submission.initialViews && Number(submission.initialViews) > 0 && (
                            <span title="Initial scraped views">
                              {Number(submission.initialViews).toLocaleString()} initial
                            </span>
                          )}
                          {submission.currentViews && Number(submission.currentViews) > 0 && (
                            <>
                              <span className="mx-1">→</span>
                              <span title="Current views">
                                {Number(submission.currentViews).toLocaleString()} current
                              </span>
                            </>
                          )}
                          {submission.viewChange && Number(submission.viewChange) > 0 && (
                            <span className="text-green-600 dark:text-green-400" title="View change">
                              (+{Number(submission.viewChange).toLocaleString()})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">No view data</span>
                      )}
                      {submission.campaigns.status === 'COMPLETED' && submission.finalEarnings ? (
                        <span className="font-bold flex items-center gap-1">
                          Final Earnings: ${Number(submission.finalEarnings).toFixed(2)} 🔒
                        </span>
                      ) : submission.clips?.earnings && Number(submission.clips.earnings) > 0 ? (
                        <span>Current Earnings: ${Number(submission.clips.earnings).toFixed(2)}</span>
                      ) : null}
                      {submission.clips?.view_tracking && submission.clips.view_tracking.length > 0 && (
                        <span>Last Tracked: {new Date(submission.clips.view_tracking[0].date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {submission.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission)
                            updateSubmissionStatus(submission.id, "APPROVED")
                          }}
                        >
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
                          Reject
                        </Button>
                      </>
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
              )})
              )}
            </div>

            {pagination.hasMore && (
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                >
                  Load More
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
    </div>
  )
}
