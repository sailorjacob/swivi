"use client"

import { useState, useEffect } from "react"
import { motion, Reorder } from "framer-motion"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  LayoutGrid,
  List,
  Columns,
  ArrowRight,
  Search,
  Users,
  GripVertical
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
}

type ViewMode = "kanban" | "list" | "compare"

export default function BountyApplicationsPage() {
  const [applications, setApplications] = useState<BountyApplication[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<BountyApplication | null>(null)
  const [compareApplications, setCompareApplications] = useState<BountyApplication[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [tierFilter, setTierFilter] = useState<string>("all")

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
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
  }, [tierFilter])

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
      setUpdating(null)
    }
  }

  const openDetail = (app: BountyApplication) => {
    setSelectedApplication(app)
    setAdminNotes(app.adminNotes || "")
    setShowDetailModal(true)
  }

  const toggleCompare = (app: BountyApplication) => {
    if (compareApplications.find(a => a.id === app.id)) {
      setCompareApplications(compareApplications.filter(a => a.id !== app.id))
    } else if (compareApplications.length < 4) {
      setCompareApplications([...compareApplications, app])
    } else {
      toast.error("Maximum 4 applications can be compared")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-500/10 border-amber-500/30 text-amber-600"
      case "APPROVED": return "bg-green-500/10 border-green-500/30 text-green-600"
      case "REJECTED": return "bg-red-500/10 border-red-500/30 text-red-600"
      default: return ""
    }
  }

  const getTierIcon = (tier: string) => {
    return tier === "TIER_1_HIGH_VOLUME" ? <Crown className="w-4 h-4" /> : <Award className="w-4 h-4" />
  }

  const getTierLabel = (tier: string) => {
    return tier === "TIER_1_HIGH_VOLUME" ? "Tier 1 - High Volume" : "Tier 2 - Quality"
  }

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      TIKTOK: "TikTok",
      INSTAGRAM: "Instagram",
      YOUTUBE: "YouTube",
      TWITTER: "X"
    }
    return names[platform] || platform
  }

  // Filter applications by search
  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      app.fullName.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.campaigns.title.toLowerCase().includes(query) ||
      app.platform.toLowerCase().includes(query)
    )
  })

  // Group by status for kanban
  const pendingApps = filteredApplications.filter(a => a.status === "PENDING")
  const approvedApps = filteredApplications.filter(a => a.status === "APPROVED")
  const rejectedApps = filteredApplications.filter(a => a.status === "REJECTED")

  // Group by tier
  const tier1Apps = filteredApplications.filter(a => a.tier === "TIER_1_HIGH_VOLUME")
  const tier2Apps = filteredApplications.filter(a => a.tier === "TIER_2_QUALITY")

  const ApplicationCard = ({ app, compact = false }: { app: BountyApplication; compact?: boolean }) => {
    const isComparing = compareApplications.find(a => a.id === app.id)
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-lg p-3 bg-card hover:shadow-md transition-all cursor-pointer ${
          isComparing ? 'ring-2 ring-foreground' : ''
        }`}
        onClick={() => openDetail(app)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {app.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{app.fullName}</p>
              <p className="text-xs text-muted-foreground">{getPlatformName(app.platform)}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleCompare(app)
            }}
            className={`p-1 rounded transition-colors ${
              isComparing ? 'bg-foreground text-background' : 'hover:bg-muted'
            }`}
            title={isComparing ? "Remove from compare" : "Add to compare"}
          >
            <Columns className="w-4 h-4" />
          </button>
        </div>

        {!compact && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {getTierIcon(app.tier)}
                <span className="ml-1">{app.tier === "TIER_1_HIGH_VOLUME" ? "T1" : "T2"}</span>
              </Badge>
              <span className="text-xs text-muted-foreground">{app.clipLinks.length} clips</span>
              {app.followerScreenshotUrl && (
                <ImageIcon className="w-3 h-3 text-muted-foreground" />
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate mb-2">
              {app.campaigns.title}
            </p>
          </>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(app.createdAt).toLocaleDateString()}
          </span>
          {app.status === "PENDING" && (
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusUpdate(app.id, "APPROVED")
                }}
                disabled={updating === app.id}
                className="p-1 rounded bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors"
                title="Approve"
              >
                {updating === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusUpdate(app.id, "REJECTED")
                }}
                disabled={updating === app.id}
                className="p-1 rounded bg-red-500/20 text-red-600 hover:bg-red-500/30 transition-colors"
                title="Reject"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const KanbanColumn = ({ 
    title, 
    apps, 
    status,
    icon 
  }: { 
    title: string
    apps: BountyApplication[]
    status: string
    icon: React.ReactNode
  }) => (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className={`rounded-t-lg p-3 border-b-2 ${getStatusColor(status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <Badge variant="secondary">{apps.length}</Badge>
        </div>
      </div>
      <div className="bg-muted/30 rounded-b-lg p-2 min-h-[400px] space-y-2">
        {apps.map(app => (
          <ApplicationCard key={app.id} app={app} />
        ))}
        {apps.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No applications</p>
        )}
      </div>
    </div>
  )

  const CompareView = () => {
    if (compareApplications.length === 0) {
      return (
        <div className="text-center py-12">
          <Columns className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">Compare Applications</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Click the compare icon on any application card to add it to the comparison view.
          </p>
          <p className="text-xs text-muted-foreground">Up to 4 applications can be compared</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Comparing {compareApplications.length} Applications</h3>
          <Button variant="outline" size="sm" onClick={() => setCompareApplications([])}>
            Clear All
          </Button>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareApplications.length}, 1fr)` }}>
          {compareApplications.map(app => (
            <Card key={app.id} className="relative">
              <button
                onClick={() => toggleCompare(app)}
                className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium">
                    {app.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-base">{app.fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tier</span>
                  <Badge variant="outline">{getTierLabel(app.tier)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Platform</span>
                  <span>{getPlatformName(app.platform)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Clips</span>
                  <span>{app.clipLinks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Screenshot</span>
                  <span>{app.followerScreenshotUrl ? "✓" : "—"}</span>
                </div>
                <div className="pt-2 border-t">
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
                </div>
                {app.status === "PENDING" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusUpdate(app.id, "APPROVED")}
                      disabled={updating === app.id}
                    >
                      {updating === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleStatusUpdate(app.id, "REJECTED")}
                      disabled={updating === app.id}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bounty Applications</h1>
            <p className="text-muted-foreground">Organize and review bounty tier applications</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/campaigns">
              <Button variant="outline" size="sm">← Campaigns</Button>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="font-semibold">{stats?.total || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Pending:</span>
            <span className="font-semibold text-amber-600">{stats?.byStatus?.PENDING || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Approved:</span>
            <span className="font-semibold text-green-600">{stats?.byStatus?.APPROVED || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-muted-foreground">Rejected:</span>
            <span className="font-semibold text-red-600">{stats?.byStatus?.REJECTED || 0}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Crown className="w-4 h-4" />
            <span className="text-sm">T1: {tier1Apps.length}</span>
            <Award className="w-4 h-4 ml-2" />
            <span className="text-sm">T2: {tier2Apps.length}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="TIER_1_HIGH_VOLUME">Tier 1 - High Volume</SelectItem>
              <SelectItem value="TIER_2_QUALITY">Tier 2 - Quality</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded ${viewMode === "kanban" ? "bg-foreground text-background" : "hover:bg-muted"}`}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-foreground text-background" : "hover:bg-muted"}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={`p-2 rounded relative ${viewMode === "compare" ? "bg-foreground text-background" : "hover:bg-muted"}`}
              title="Compare View"
            >
              <Columns className="w-4 h-4" />
              {compareApplications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-xs rounded-full flex items-center justify-center">
                  {compareApplications.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Kanban View */}
            {viewMode === "kanban" && (
              <div className="flex gap-4 overflow-x-auto pb-4">
                <KanbanColumn 
                  title="Pending Review" 
                  apps={pendingApps} 
                  status="PENDING"
                  icon={<Clock className="w-4 h-4" />}
                />
                <KanbanColumn 
                  title="Approved" 
                  apps={approvedApps} 
                  status="APPROVED"
                  icon={<CheckCircle className="w-4 h-4" />}
                />
                <KanbanColumn 
                  title="Rejected" 
                  apps={rejectedApps} 
                  status="REJECTED"
                  icon={<XCircle className="w-4 h-4" />}
                />
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All ({filteredApplications.length})</TabsTrigger>
                  <TabsTrigger value="tier1">Tier 1 ({tier1Apps.length})</TabsTrigger>
                  <TabsTrigger value="tier2">Tier 2 ({tier2Apps.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredApplications.map(app => (
                      <ApplicationCard key={app.id} app={app} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tier1" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tier1Apps.map(app => (
                      <ApplicationCard key={app.id} app={app} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tier2" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tier2Apps.map(app => (
                      <ApplicationCard key={app.id} app={app} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* Compare View */}
            {viewMode === "compare" && <CompareView />}
          </>
        )}

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
                  <Badge className={getStatusColor(selectedApplication.status)}>{selectedApplication.status}</Badge>
                  <Badge variant="outline">
                    {getTierIcon(selectedApplication.tier)}
                    <span className="ml-1">{getTierLabel(selectedApplication.tier)}</span>
                  </Badge>
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
                      disabled={updating === selectedApplication.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {updating === selectedApplication.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Approve Application
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(selectedApplication.id, "REJECTED")}
                      disabled={updating === selectedApplication.id}
                      className="flex-1"
                    >
                      {updating === selectedApplication.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
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
