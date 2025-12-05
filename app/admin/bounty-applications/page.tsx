"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import toast from "react-hot-toast"
import Link from "next/link"
import { 
  Crown, 
  Award, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  User, 
  Mail, 
  Loader2,
  Eye,
  Image as ImageIcon,
  Link2,
  DollarSign,
  Filter
} from "lucide-react"

interface BountyApplication {
  id: string
  fullName: string
  email: string
  platform: string
  profileLink: string
  tier: "TIER_1_HIGH_VOLUME" | "TIER_2_QUALITY"
  followerCount: number | null
  followerScreenshotUrl: string | null
  clipLinks: string[]
  paymentAddress: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  adminNotes: string | null
  reviewedAt: string | null
  createdAt: string
  users: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  campaigns: {
    id: string
    title: string
    creator: string
  }
}

interface Stats {
  total: number
  byStatus: Record<string, number>
  byTier: Array<{
    tier: string
    status: string
    _count: { tier: number }
  }>
}

export default function BountyApplicationsPage() {
  const [applications, setApplications] = useState<BountyApplication[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<BountyApplication | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tierFilter, setTierFilter] = useState<string>("all")

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (tierFilter !== "all") params.set("tier", tierFilter)
      
      const response = await authenticatedFetch(`/api/admin/bounty-applications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
        setStats(data.stats)
      } else {
        toast.error("Failed to fetch applications")
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
      toast.error("Failed to fetch applications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [statusFilter, tierFilter])

  const handleStatusUpdate = async (applicationId: string, newStatus: "APPROVED" | "REJECTED") => {
    setUpdating(true)
    try {
      const response = await authenticatedFetch(`/api/admin/bounty-applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes || undefined
        })
      })

      if (response.ok) {
        toast.success(`Application ${newStatus.toLowerCase()}!`)
        setShowDetailModal(false)
        setSelectedApplication(null)
        setAdminNotes("")
        await fetchApplications()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update application")
      }
    } catch (error) {
      console.error("Error updating application:", error)
      toast.error("Failed to update application")
    } finally {
      setUpdating(false)
    }
  }

  const openDetail = (app: BountyApplication) => {
    setSelectedApplication(app)
    setAdminNotes(app.adminNotes || "")
    setShowDetailModal(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "APPROVED":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTierBadge = (tier: string) => {
    if (tier === "TIER_1_HIGH_VOLUME") {
      return <Badge variant="outline" className="border-foreground/30"><Crown className="w-3 h-3 mr-1" />Tier 1 - High Volume</Badge>
    }
    return <Badge variant="outline"><Award className="w-3 h-3 mr-1" />Tier 2 - Quality</Badge>
  }

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      TIKTOK: "TikTok",
      INSTAGRAM: "Instagram",
      YOUTUBE: "YouTube",
      TWITTER: "X/Twitter"
    }
    return names[platform] || platform
  }

  const pendingCount = stats?.byStatus?.PENDING || 0
  const approvedCount = stats?.byStatus?.APPROVED || 0
  const rejectedCount = stats?.byStatus?.REJECTED || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bounty Applications</h1>
            <p className="text-muted-foreground">Review and manage bounty tier applications</p>
          </div>
          <Link href="/admin/campaigns">
            <Button variant="outline">← Back to Campaigns</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="TIER_1_HIGH_VOLUME">Tier 1 - High Volume</SelectItem>
              <SelectItem value="TIER_2_QUALITY">Tier 2 - Quality</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({applications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No applications found
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">{app.fullName}</span>
                          {getStatusBadge(app.status)}
                          {getTierBadge(app.tier)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {app.email}
                          </div>
                          <div>
                            Platform: <span className="text-foreground">{getPlatformName(app.platform)}</span>
                          </div>
                          <div>
                            Campaign: <Link href={`/admin/campaigns`} className="text-foreground hover:underline">{app.campaigns.title}</Link>
                          </div>
                          <div>
                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <a 
                            href={app.profileLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-foreground hover:underline"
                          >
                            <Link2 className="w-3 h-3" />
                            Profile
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-muted-foreground">
                            {app.clipLinks.length} clip(s) submitted
                          </span>
                          {app.followerScreenshotUrl && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <ImageIcon className="w-3 h-3" />
                              Screenshot attached
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetail(app)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                        {app.status === "PENDING" && (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => handleStatusUpdate(app.id, "APPROVED")}
                              disabled={updating}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                openDetail(app)
                              }}
                              disabled={updating}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6">
                {/* Status & Tier */}
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedApplication.status)}
                  {getTierBadge(selectedApplication.tier)}
                </div>

                {/* Applicant Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Full Name</label>
                    <p className="font-medium">{selectedApplication.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="font-medium">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Platform</label>
                    <p className="font-medium">{getPlatformName(selectedApplication.platform)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Campaign</label>
                    <p className="font-medium">{selectedApplication.campaigns.title}</p>
                  </div>
                </div>

                {/* Profile Link */}
                <div>
                  <label className="text-sm text-muted-foreground">Profile Link</label>
                  <a 
                    href={selectedApplication.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-foreground hover:underline"
                  >
                    {selectedApplication.profileLink}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Follower Screenshot (Tier 1) */}
                {selectedApplication.followerScreenshotUrl && (
                  <div>
                    <label className="text-sm text-muted-foreground">Follower Count Screenshot</label>
                    <a 
                      href={selectedApplication.followerScreenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2"
                    >
                      <img 
                        src={selectedApplication.followerScreenshotUrl} 
                        alt="Follower count screenshot"
                        className="max-w-full max-h-64 rounded-lg border"
                      />
                    </a>
                  </div>
                )}

                {/* Clip Links */}
                <div>
                  <label className="text-sm text-muted-foreground">Submitted Clips ({selectedApplication.clipLinks.length})</label>
                  <div className="space-y-2 mt-2">
                    {selectedApplication.clipLinks.map((link, i) => (
                      <a 
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-foreground hover:underline p-2 bg-muted rounded"
                      >
                        <Link2 className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{link}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Payment Address */}
                <div>
                  <label className="text-sm text-muted-foreground">Payment Address (PayPal/BTC)</label>
                  <p className="font-mono text-sm bg-muted p-2 rounded mt-1">{selectedApplication.paymentAddress}</p>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="text-sm text-muted-foreground">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Review Info */}
                {selectedApplication.reviewedAt && (
                  <div className="text-sm text-muted-foreground border-t pt-4">
                    Reviewed on {new Date(selectedApplication.reviewedAt).toLocaleString()}
                  </div>
                )}

                {/* Action Buttons */}
                {selectedApplication.status === "PENDING" && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleStatusUpdate(selectedApplication.id, "APPROVED")}
                      disabled={updating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Approve Application
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(selectedApplication.id, "REJECTED")}
                      disabled={updating}
                      className="flex-1"
                    >
                      {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Reject Application
                    </Button>
                  </div>
                )}

                {selectedApplication.status !== "PENDING" && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailModal(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

