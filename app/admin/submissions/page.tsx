"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, X, ExternalLink, Search, Filter, Calendar, User, Target, DollarSign, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { authenticatedFetch } from "@/lib/supabase-browser"

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
  createdAt: string
  updatedAt: string
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
    views?: number
    earnings?: number
    view_tracking?: Array<{
      views: number
      date: string
    }>
  }
  campaigns: {
    id: string
    title: string
    creator: string
    payoutRate: number
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

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
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
    fetchSubmissions()
  }, [fetchSubmissions])

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
    if (submission.requiresReview) {
      return "bg-orange-100 text-orange-800 border-orange-300"
    }

    switch (submission.status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      case "PAID": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  ← Back to Admin
                </Button>
              </Link>
              <h1 className="text-3xl font-light">Submission Management</h1>
            </div>
            <p className="text-muted-foreground">
              Review and manage clipper submissions
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-semibold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Check className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-semibold">{approvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-semibold">${totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Paid Submissions</p>
                  <p className="text-2xl font-semibold">{paidCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Flagged for Review</p>
                  <p className="text-2xl font-semibold text-orange-600">{flaggedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Target className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Submissions will appear here once clippers start submitting content to your campaigns.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" asChild>
                      <Link href="/admin/campaigns">
                        View Campaigns
                      </Link>
                    </Button>
                    <Button onClick={fetchSubmissions}>
                      Refresh
                    </Button>
                  </div>
                </div>
              ) : (
                submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                    submission.requiresReview ? 'border-orange-300 bg-orange-50/30' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusColor(submission)}>
                        {submission.requiresReview ? 'FLAGGED' : submission.status}
                      </Badge>
                      <Badge variant="secondary">
                        {submission.platform}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {submission.users.email}
                        {submission.users.name && ` (${submission.users.name})`}
                      </span>
                      {submission.requiresReview && (
                        <AlertCircle className="w-4 h-4 text-orange-500" title="Flagged for review" />
                      )}
                    </div>
                    <div className="mb-2">
                      <p className="font-medium">{submission.campaigns.title}</p>
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
                        <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded mt-2">
                          <strong>Review Reason:</strong> {submission.reviewReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
                      {submission.payout && (
                        <span>Payout: ${submission.payout.toFixed(2)}</span>
                      )}
                      {submission.clips?.views && (
                        <span>Clip Views: {Number(submission.clips.views).toLocaleString()}</span>
                      )}
                      {submission.clips?.earnings && Number(submission.clips.earnings) > 0 && (
                        <span>Clip Earnings: ${Number(submission.clips.earnings).toFixed(2)}</span>
                      )}
                      {submission.clips?.view_tracking && submission.clips.view_tracking.length > 0 && (
                        <span>Last Tracked: {new Date(submission.clips.view_tracking[0].date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={submission.clipUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
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
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setShowRejectDialog(true)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Delete
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
              ))
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
    </div>
  )
}
