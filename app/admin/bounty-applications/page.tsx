"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import toast from "react-hot-toast"
import Link from "next/link"
import { 
  ChevronDown,
  ChevronRight,
  ExternalLink, 
  Loader2,
  Image as ImageIcon,
  Link2,
  Search,
  FileText,
  Folder,
  Star,
  MessageSquare,
  ArrowUpDown,
  Eye
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

interface CampaignGroup {
  campaignId: string
  campaignTitle: string
  creator: string
  applications: BountyApplication[]
}

type SortField = "name" | "date" | "tier" | "platform" | "clips"
type SortDir = "asc" | "desc"

export default function BountyApplicationsPage() {
  const [applications, setApplications] = useState<BountyApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<BountyApplication | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`/api/admin/bounty-applications`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
        // Auto-expand all campaigns on first load
        const campaignIds = new Set(data.applications.map((a: BountyApplication) => a.campaigns.id))
        setExpandedCampaigns(campaignIds as Set<string>)
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
  }, [])

  const handleStatusUpdate = async (applicationId: string, newStatus: "APPROVED" | "REJECTED", notes?: string) => {
    setUpdating(applicationId)
    try {
      const response = await authenticatedFetch(`/api/admin/bounty-applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: notes || adminNotes || undefined
        })
      })

      if (response.ok) {
        toast.success(`Application ${newStatus.toLowerCase()}`)
        setShowDetailModal(false)
        setSelectedApplication(null)
        setAdminNotes("")
        await fetchApplications()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update")
      }
    } catch (error) {
      console.error("Error updating application:", error)
      toast.error("Failed to update")
    } finally {
      setUpdating(null)
    }
  }

  const handleSaveNotes = async (applicationId: string, notes: string) => {
    try {
      const response = await authenticatedFetch(`/api/admin/bounty-applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes })
      })

      if (response.ok) {
        toast.success("Notes saved")
        await fetchApplications()
      }
    } catch (error) {
      console.error("Error saving notes:", error)
    }
  }

  const openDetail = (app: BountyApplication) => {
    setSelectedApplication(app)
    setAdminNotes(app.adminNotes || "")
    setShowDetailModal(true)
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const toggleCampaign = (campaignId: string) => {
    const newSet = new Set(expandedCampaigns)
    if (newSet.has(campaignId)) {
      newSet.delete(campaignId)
    } else {
      newSet.add(campaignId)
    }
    setExpandedCampaigns(newSet)
  }

  const getTierLabel = (tier: string) => tier === "TIER_1_HIGH_VOLUME" ? "T1" : "T2"
  const getTierFull = (tier: string) => tier === "TIER_1_HIGH_VOLUME" ? "Tier 1 - High Volume" : "Tier 2 - Quality"

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      TIKTOK: "TikTok",
      INSTAGRAM: "Instagram",
      YOUTUBE: "YouTube",
      TWITTER: "X"
    }
    return names[platform] || platform
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "border border-border bg-muted text-muted-foreground"
      case "APPROVED": return "bg-foreground text-background"
      case "REJECTED": return "border border-dashed border-border text-muted-foreground line-through"
      default: return ""
    }
  }

  // Filter and sort
  const filteredApplications = useMemo(() => {
    let result = [...applications]
    
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(a => a.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a => 
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.campaigns.title.toLowerCase().includes(q) ||
        a.platform.toLowerCase().includes(q)
      )
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "name": cmp = a.fullName.localeCompare(b.fullName); break
        case "date": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break
        case "tier": cmp = a.tier.localeCompare(b.tier); break
        case "platform": cmp = a.platform.localeCompare(b.platform); break
        case "clips": cmp = a.clipLinks.length - b.clipLinks.length; break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [applications, statusFilter, searchQuery, sortField, sortDir])

  // Group by campaign
  const campaignGroups = useMemo((): CampaignGroup[] => {
    const groups: Record<string, CampaignGroup> = {}
    
    filteredApplications.forEach(app => {
      if (!groups[app.campaigns.id]) {
        groups[app.campaigns.id] = {
          campaignId: app.campaigns.id,
          campaignTitle: app.campaigns.title,
          creator: app.campaigns.creator,
          applications: []
        }
      }
      groups[app.campaigns.id].applications.push(app)
    })

    return Object.values(groups).sort((a, b) => b.applications.length - a.applications.length)
  }, [filteredApplications])

  // Get selected applications for comparison
  const selectedApps = applications.filter(a => selectedIds.has(a.id))

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "PENDING").length,
    approved: applications.filter(a => a.status === "APPROVED").length,
    rejected: applications.filter(a => a.status === "REJECTED").length,
    t1: applications.filter(a => a.tier === "TIER_1_HIGH_VOLUME").length,
    t2: applications.filter(a => a.tier === "TIER_2_QUALITY").length
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bounty Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">Review and organize applicants by campaign</p>
          </div>
          <Link href="/admin/campaigns">
            <Button variant="outline" size="sm">← Back to Campaigns</Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold">{stats.t1}</p>
            <p className="text-xs text-muted-foreground">Tier 1</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold">{stats.t2}</p>
            <p className="text-xs text-muted-foreground">Tier 2</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.size > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCompareModal(true)}
              className="h-9"
            >
              <Eye className="w-4 h-4 mr-2" />
              Compare Selected ({selectedIds.size})
            </Button>
          )}

          {selectedIds.size > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-9 text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : campaignGroups.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaignGroups.map(group => (
              <div key={group.campaignId} className="border rounded-lg overflow-hidden">
                {/* Campaign Header */}
                <button
                  onClick={() => toggleCampaign(group.campaignId)}
                  className="w-full flex items-center gap-3 p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  {expandedCampaigns.has(group.campaignId) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium flex-1">{group.campaignTitle}</span>
                  <span className="text-sm text-muted-foreground">{group.creator}</span>
                  <Badge variant="secondary" className="ml-2">{group.applications.length}</Badge>
                </button>

                {/* Applicant Table */}
                {expandedCampaigns.has(group.campaignId) && (
                  <div className="border-t">
                    {/* Table Header */}
                    <div className="grid grid-cols-[40px_1fr_100px_80px_80px_60px_100px] gap-2 px-4 py-2 bg-muted/20 text-xs text-muted-foreground font-medium border-b">
                      <div></div>
                      <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground">
                        Applicant {sortField === "name" && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <button onClick={() => toggleSort("platform")} className="flex items-center gap-1 hover:text-foreground">
                        Platform {sortField === "platform" && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <button onClick={() => toggleSort("tier")} className="flex items-center gap-1 hover:text-foreground">
                        Tier {sortField === "tier" && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <button onClick={() => toggleSort("clips")} className="flex items-center gap-1 hover:text-foreground">
                        Clips {sortField === "clips" && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <div>Proof</div>
                      <div>Status</div>
                    </div>

                    {/* Table Rows */}
                    {group.applications.map(app => (
                      <div 
                        key={app.id}
                        className="grid grid-cols-[40px_1fr_100px_80px_80px_60px_100px] gap-2 px-4 py-3 border-b last:border-b-0 hover:bg-muted/20 transition-colors items-center"
                      >
                        {/* Checkbox */}
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedIds.has(app.id)}
                            onCheckedChange={() => toggleSelect(app.id)}
                          />
                        </div>

                        {/* Applicant Info */}
                        <button 
                          onClick={() => openDetail(app)}
                          className="flex items-center gap-3 text-left hover:underline"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {app.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{app.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{app.email}</p>
                          </div>
                          {app.adminNotes && (
                            <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </button>

                        {/* Platform */}
                        <div className="text-sm">{getPlatformName(app.platform)}</div>

                        {/* Tier */}
                        <Badge variant="outline" className="text-xs w-fit">
                          {getTierLabel(app.tier)}
                        </Badge>

                        {/* Clips */}
                        <div className="text-sm">{app.clipLinks.length}</div>

                        {/* Proof */}
                        <div>
                          {app.followerScreenshotUrl ? (
                            <a 
                              href={app.followerScreenshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ImageIcon className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </div>

                        {/* Status */}
                        <Badge className={`text-xs ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium">
                  {selectedApplication?.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span>{selectedApplication?.fullName}</span>
                  <p className="text-sm font-normal text-muted-foreground">{selectedApplication?.email}</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6 mt-4">
                {/* Quick Info */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusBadge(selectedApplication.status)}>{selectedApplication.status}</Badge>
                  <Badge variant="outline">{getTierFull(selectedApplication.tier)}</Badge>
                  <Badge variant="outline">{getPlatformName(selectedApplication.platform)}</Badge>
                </div>

                {/* Campaign */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Campaign</p>
                  <p className="font-medium">{selectedApplication.campaigns.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedApplication.campaigns.creator}</p>
                </div>

                {/* Profile */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Profile</p>
                  <a 
                    href={selectedApplication.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline p-2 border rounded-lg"
                  >
                    <Link2 className="w-4 h-4" />
                    <span className="truncate flex-1">{selectedApplication.profileLink}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Screenshot */}
                {selectedApplication.followerScreenshotUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Follower Screenshot</p>
                    <a 
                      href={selectedApplication.followerScreenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img 
                        src={selectedApplication.followerScreenshotUrl} 
                        alt="Follower count"
                        className="max-w-full max-h-48 rounded-lg border"
                      />
                    </a>
                  </div>
                )}

                {/* Clips */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Submitted Clips ({selectedApplication.clipLinks.length})</p>
                  <div className="space-y-1">
                    {selectedApplication.clipLinks.map((link, i) => (
                      <a 
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline p-2 border rounded"
                      >
                        <Link2 className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate flex-1">{link}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Payment Address</p>
                  <p className="font-mono text-sm p-2 bg-muted rounded">{selectedApplication.paymentAddress}</p>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Notes</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this applicant..."
                    rows={3}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => handleSaveNotes(selectedApplication.id, adminNotes)}
                  >
                    Save Notes
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedApplication.status === "PENDING" && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate(selectedApplication.id, "APPROVED")}
                        disabled={updating === selectedApplication.id}
                        className="flex-1"
                      >
                        {updating === selectedApplication.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedApplication.id, "REJECTED")}
                        disabled={updating === selectedApplication.id}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedApplication.status !== "PENDING" && (
                    <Button variant="outline" onClick={() => setShowDetailModal(false)} className="flex-1">
                      Close
                    </Button>
                  )}
                </div>

                {/* Metadata */}
                <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                  <p>Applied: {new Date(selectedApplication.createdAt).toLocaleString()}</p>
                  {selectedApplication.reviewedAt && (
                    <p>Reviewed: {new Date(selectedApplication.reviewedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Compare Modal */}
        <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compare {selectedApps.length} Applicants</DialogTitle>
            </DialogHeader>
            
            {selectedApps.length > 0 && (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Field</th>
                        {selectedApps.map(app => (
                          <th key={app.id} className="text-left py-2 px-3 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {app.fullName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium truncate">{app.fullName}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">Status</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-2 px-3">
                            <Badge className={getStatusBadge(app.status)}>{app.status}</Badge>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">Tier</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-2 px-3">{getTierFull(app.tier)}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">Platform</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-2 px-3">{getPlatformName(app.platform)}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">Campaign</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-2 px-3 text-sm">{app.campaigns.title}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">Clips</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-2 px-3">{app.clipLinks.length}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">Screenshot</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-2 px-3">
                            {app.followerScreenshotUrl ? (
                              <a href={app.followerScreenshotUrl} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline flex items-center gap-1">
                                <ImageIcon className="w-4 h-4" /> View
                              </a>
                            ) : "—"}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">Profile</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-2 px-3">
                            <a href={app.profileLink} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">Applied</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-2 px-3 text-sm">{new Date(app.createdAt).toLocaleDateString()}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">Notes</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-2 px-3 text-sm">{app.adminNotes || "—"}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-3 text-muted-foreground">Actions</td>
                        {selectedApps.map(app => (
                          <td key={app.id} className="py-3 px-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setShowCompareModal(false)
                                openDetail(app)
                              }}
                            >
                              View Full Details
                            </Button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
