"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CampaignBonusModal } from "@/components/campaigns/campaign-bonus-modal"
import { CampaignUpdateButton, CampaignUpdateAutoOpen } from "@/components/campaigns/campaign-announcement-banner"
import { LinkifyParagraph } from "@/components/ui/linkify-text"
import toast from "react-hot-toast"
import Link from "next/link"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft,
  DollarSign, 
  Users, 
  Clock,
  Instagram,
  Youtube,
  // Twitter, // Hidden - re-enable when Apify actors are working
  Music,
  Target,
  Loader2,
  CheckCircle,
  XCircle,
  Trophy,
  Flame,
  Link2,
  ExternalLink,
  Eye,
  AlertCircle,
  Send,
  FileVideo,
  FolderOpen,
  Activity,
  Crown,
  Play
} from "lucide-react"

// Countdown hook
function useCountdown(targetDate: string | undefined) {
  const calculateTimeLeft = useCallback(() => {
    if (!targetDate) return null
    const difference = new Date(targetDate).getTime() - new Date().getTime()
    if (difference <= 0) return null
    
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    }
  }, [targetDate])

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(timer)
  }, [calculateTimeLeft])

  return timeLeft
}

interface Campaign {
  id: string
  title: string
  description: string
  creator: string
  budget: number
  spent: number
  payoutRate: number
  startDate?: string
  status: string
  targetPlatforms: string[]
  requirements: string[]
  featuredImage?: string
  contentFolderUrl?: string
  createdAt: string
  _count: {
    clipSubmissions: number
  }
}

interface Submission {
  id: string
  clipUrl: string
  platform: string
  status: string
  initialViews: string
  currentViews?: string
  viewChange?: string
  finalEarnings: string
  createdAt: string
  trackingCount?: number
  lastTracked?: string
  campaigns: {
    title: string
    payoutRate: number
  }
  clips?: {
    id: string
    views?: string
    earnings?: string
    status?: string
  }
}

interface VerifiedAccount {
  id: string
  platform: string
  username: string
  displayName: string | null
  verified: boolean
  verifiedAt: string | null
}

const platformIcons: Record<string, any> = {
  tiktok: Music,
  instagram: Instagram, 
  youtube: Youtube,
  // twitter: Twitter, // Hidden - re-enable when Apify actors are working
  TIKTOK: Music,
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  // TWITTER: Twitter, // Hidden - re-enable when Apify actors are working
}

const submitSchema = z.object({
  clipUrl: z.string().url("Please enter a valid URL"),
  // TWITTER hidden - re-enable when Apify actors are working
  platform: z.enum(["TIKTOK", "INSTAGRAM", "YOUTUBE"], {
    errorMap: () => ({ message: "Please select a platform" }),
  }),
  socialAccountId: z.string().min(1, "Please select your verified account"),
})

// Helper to check if a campaign has special bonuses
const hasBonuses = (campaign: Campaign) => {
  return campaign.title.toLowerCase().includes('owning manhattan') && 
         campaign.title.toLowerCase().includes('season 2')
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [verifiedAccounts, setVerifiedAccounts] = useState<VerifiedAccount[]>([])
  const [loading, setLoading] = useState(true) // Initial load only
  const [isRefreshing, setIsRefreshing] = useState(false) // Background refresh indicator
  const [submitting, setSubmitting] = useState(false)
  const [bonusModalOpen, setBonusModalOpen] = useState(false)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [activityData, setActivityData] = useState<{
    topClippers: Array<{
      userId: string
      name: string | null
      image: string | null
      totalViewsGained: number
      totalEarnings: number
      clipCount: number
    }>
    topClips: Array<{
      id: string
      url: string
      platform: string
      viewsGained: number
      currentViews: number
      earnings: number
      clipper: { name: string | null; image: string | null }
    }>
    recentActivity: Array<{
      id: string
      type: string
      timestamp: string
      clipper: string
      clipperImage: string | null
      platform: string
      clipUrl: string | null
      views: number | null
      viewsGained: number | null
    }>
    totals: {
      totalSubmissions: number
      totalClippers: number
      totalClips: number
      totalViewsGained: number
      totalEarnings: number
      remainingBudget: number
    }
  } | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  
  // Countdown timer for scheduled campaigns
  const countdown = useCountdown(campaign?.startDate)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<z.infer<typeof submitSchema>>({
    resolver: zodResolver(submitSchema),
  })

  const selectedPlatform = watch("platform")

  // Fetch campaign and user's submissions
  const fetchData = async (isBackgroundRefresh = false) => {
    try {
      // Only show full loading on initial load, not background refresh
      if (!isBackgroundRefresh) {
      setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      
      // Fetch campaign details
      const campaignRes = await authenticatedFetch(`/api/creators/campaigns/${campaignId}`)
      if (campaignRes.ok) {
        const campaignData = await campaignRes.json()
        setCampaign(campaignData)
      }

      // Fetch user's submissions for this campaign
      const submissionsRes = await authenticatedFetch("/api/creators/submissions")
      if (submissionsRes.ok) {
        const allSubmissions = await submissionsRes.json()
        // Filter to only this campaign's submissions
        const campaignSubmissions = allSubmissions.filter(
          (s: Submission) => s.campaigns && s.campaigns.title === campaign?.title
        )
        setSubmissions(allSubmissions) // We'll filter in render
      }

      // Fetch user's verified social accounts
      const accountsRes = await authenticatedFetch("/api/user/verified-accounts")
      if (accountsRes.ok) {
        const accounts = await accountsRes.json()
        setVerifiedAccounts(accounts)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      if (!isBackgroundRefresh) toast.error("Failed to load campaign")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (campaignId) {
      fetchData(false) // Initial load
    }
  }, [campaignId])

  // Auto-refresh data every 30 seconds to show real-time view tracking updates
  useEffect(() => {
    if (!campaignId) return
    
    const interval = setInterval(() => {
      // Only refresh if not currently loading to avoid race conditions
      if (!loading && !isRefreshing) {
        fetchData(true) // Silent background refresh
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [campaignId, loading, isRefreshing])

  // Fetch campaign activity data when modal opens
  const fetchActivityData = async () => {
    if (!campaignId) return
    
    try {
      setActivityLoading(true)
      const response = await authenticatedFetch(`/api/creators/campaigns/${campaignId}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivityData(data)
      }
    } catch (error) {
      console.error("Error fetching activity data:", error)
    } finally {
      setActivityLoading(false)
    }
  }

  // Fetch activity data when modal opens
  useEffect(() => {
    if (activityModalOpen && !activityData) {
      fetchActivityData()
    }
  }, [activityModalOpen])

  // Re-filter submissions when campaign loads
  const campaignSubmissions = submissions.filter(s => {
    // Match by campaign ID if available, otherwise by title
    return s.campaigns?.title === campaign?.title
  })

  const onSubmit = async (data: z.infer<typeof submitSchema>) => {
    if (!campaign) return
    
    setSubmitting(true)
    try {
      const response = await authenticatedFetch("/api/creators/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaignId: campaign.id,
          clipUrl: data.clipUrl,
          platform: data.platform,
          socialAccountId: data.socialAccountId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.requiresVerification) {
          toast.error(`Please verify your ${data.platform} account first`)
        } else {
          toast.error(result.error || "Failed to submit post")
        }
        return
      }
      
      toast.success("Post submitted successfully! It will be reviewed shortly.")
      reset()
      // Refresh submissions
      fetchData()
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("Failed to submit post. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getPlatformPlaceholder = (platform: string) => {
    switch (platform) {
      case "TIKTOK":
        return "https://tiktok.com/@username/video/123456789"
      case "YOUTUBE":
        return "https://youtube.com/shorts/ABC123def456"
      case "INSTAGRAM":
        return "https://instagram.com/reel/ABC123def456"
      case "TWITTER":
        return "https://x.com/username/status/123456789"
      default:
        return "Paste your video URL here"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-foreground/10 text-foreground border-foreground/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case "PENDING":
        return <Badge className="bg-muted text-muted-foreground border-border"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "REJECTED":
        return <Badge className="bg-muted text-muted-foreground/70 border-border"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Campaign not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  // CRITICAL: Ensure budget/spent are numbers for proper comparison
  // Prisma Decimal types can be serialized as strings in JSON, causing
  // lexicographic comparison bugs (e.g., "6.00" >= "20000.00" is TRUE alphabetically!)
  const spentNum = Number(campaign.spent ?? 0)
  const budgetNum = Number(campaign.budget ?? 0)
  
  const isBudgetExhausted = spentNum >= budgetNum
  const isActive = campaign.status === "ACTIVE" && !isBudgetExhausted
  const isScheduled = campaign.status === "SCHEDULED"
  const isCompleted = campaign.status === "COMPLETED" || isBudgetExhausted
  const progress = budgetNum > 0 ? (spentNum / budgetNum) * 100 : 0
  const remainingBudget = budgetNum - spentNum

  return (
    <div className="space-y-6">
      {/* Auto-open team update dialog */}
      {campaign && <CampaignUpdateAutoOpen campaignTitle={campaign.title} />}

      {/* Floating refresh indicator - positioned absolute so it doesn't push content */}
      {isRefreshing && (
        <div className="fixed top-20 right-4 z-50 pointer-events-none">
          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Updating...</span>
          </div>
        </div>
      )}

      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Campaigns
      </Button>

      {/* Activity Modal */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-lg font-semibold">Campaign Activity</DialogTitle>
          </DialogHeader>

          {activityLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : activityData ? (
            <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-120px)] pr-2">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center py-3 px-2 border border-border rounded-md">
                  <p className="text-xl font-semibold">{activityData.totals.totalSubmissions}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Submissions</p>
                </div>
                <div className="text-center py-3 px-2 border border-border rounded-md">
                  <p className="text-xl font-semibold">{activityData.totals.totalViewsGained.toLocaleString()}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Views</p>
                </div>
                <div className="text-center py-3 px-2 border border-border rounded-md">
                  <p className="text-xl font-semibold">${activityData.totals.remainingBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Remaining</p>
                </div>
              </div>

              {/* Top Creators Section */}
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5" />
                  Top Creators
                </h3>
                <div className="space-y-1.5">
                  {activityData.topClippers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No creators yet</p>
                  ) : (
                    activityData.topClippers.slice(0, 5).map((clipper, index) => (
                      <div
                        key={clipper.userId}
                        className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <span className="w-5 text-xs font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={clipper.image || undefined} />
                          <AvatarFallback className="text-xs">{clipper.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{clipper.name || 'Anonymous'}</p>
                        </div>
                        <div className="text-right text-sm">
                          <span className="text-muted-foreground">+{clipper.totalViewsGained.toLocaleString()} views</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activity Section */}
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Recent Activity
                </h3>
                <div className="space-y-1">
                  {activityData.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
                  ) : (
                    activityData.recentActivity.slice(0, 8).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={activity.clipperImage || undefined} />
                          <AvatarFallback className="text-[10px]">{activity.clipper?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-sm">
                          <span className="font-medium">{activity.clipper}</span>
                          {' '}
                          {activity.type === 'SUBMISSION' && (
                            <span className="text-muted-foreground">submitted a post</span>
                          )}
                          {activity.type === 'APPROVED' && (
                            <span className="text-muted-foreground">was approved</span>
                          )}
                          {activity.type === 'REJECTED' && (
                            <span className="text-muted-foreground">was rejected</span>
                          )}
                          {activity.type === 'VIEW_GROWTH' && activity.viewsGained && (
                            <span className="text-muted-foreground">
                              gained <span className="font-medium">+{activity.viewsGained.toLocaleString()}</span> views
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(activity.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Posts Section */}
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                  <Play className="w-3.5 h-3.5" />
                  Top Posts
                </h3>
                <div className="space-y-1.5">
                  {activityData.topClips.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No posts yet</p>
                  ) : (
                    activityData.topClips.slice(0, 5).map((clip, index) => (
                      <a
                        key={clip.id}
                        href={clip.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <span className="w-5 text-xs font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{clip.clipper.name || 'Anonymous'}</span>
                            <span className="text-xs text-muted-foreground">· {clip.platform}</span>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <span className="text-muted-foreground">+{clip.viewsGained.toLocaleString()} views</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50" />
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-16">Failed to load data</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Campaign Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-border bg-card"
      >
        {/* Featured Image Banner */}
        {campaign.featuredImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={campaign.featuredImage}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isScheduled && (
                  <Badge className="bg-muted text-muted-foreground border-border">
                    <Clock className="w-3 h-3 mr-1.5" />
                    UPCOMING
                  </Badge>
                )}
                {isActive && (
                  <Badge className="bg-foreground/10 text-foreground border-foreground/20">
                    <span className="w-2 h-2 bg-foreground rounded-full mr-1.5 animate-pulse" />
                    LIVE
                  </Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-muted text-muted-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    COMPLETED
                  </Badge>
                )}
                {hasBonuses(campaign) && (
                  <Badge variant="outline" className="text-foreground">
                    <Trophy className="w-3 h-3 mr-1" />
                    BOUNTIES
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl font-bold mb-2">{campaign.title}</h1>
              <LinkifyParagraph text={campaign.description} className="text-muted-foreground mb-4" />
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs">
                    {campaign.creator.charAt(0)}
                  </div>
                  {campaign.creator}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {campaign._count.clipSubmissions} submissions
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Team Update Button */}
              <CampaignUpdateButton campaignTitle={campaign.title} />
              {/* Activity Button */}
              <Button
                variant="outline"
                onClick={() => setActivityModalOpen(true)}
                className="group border-zinc-400/30 hover:border-zinc-300 hover:bg-gradient-to-r hover:from-zinc-300/20 hover:to-zinc-400/20"
              >
                <Activity className="w-4 h-4 mr-2 text-zinc-400 group-hover:text-zinc-200" />
                <span className="group-hover:text-zinc-100">
                  Activity
                </span>
              </Button>
              {campaign.contentFolderUrl && (
                <Button
                  variant="outline"
                  asChild
                  className="group border-zinc-400/30 hover:border-zinc-300 hover:bg-gradient-to-r hover:from-zinc-300/20 hover:to-zinc-400/20"
                >
                  <a href={campaign.contentFolderUrl} target="_blank" rel="noopener noreferrer">
                    <FolderOpen className="w-4 h-4 mr-2 text-zinc-400 group-hover:text-zinc-200" />
                    <span className="group-hover:text-zinc-100">
                      Content Folder
                    </span>
                  </a>
                </Button>
              )}
              {hasBonuses(campaign) && (
                <Button
                  variant="outline"
                  onClick={() => setBonusModalOpen(true)}
                  className="group border-zinc-400/30 hover:border-zinc-300 hover:bg-gradient-to-r hover:from-zinc-300/20 hover:to-zinc-400/20"
                >
                  <Trophy className="w-4 h-4 mr-2 text-zinc-400 group-hover:text-zinc-200" />
                  <span className="group-hover:text-zinc-100">
                    View Bounties
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs">Total Budget</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(campaign.budget)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Payout Rate</span>
              </div>
              <p className="text-xl font-bold">${campaign.payoutRate}/1K</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Remaining</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(remainingBudget)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Eye className="w-4 h-4" />
                <span className="text-xs">Progress</span>
              </div>
              <p className="text-xl font-bold">{progress.toFixed(1)}%</p>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Platforms */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Platforms:</span>
            {campaign.targetPlatforms.map((platform) => {
              const Icon = platformIcons[platform]
              return (
                <div key={platform} className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                  {Icon && <Icon className="w-3 h-3" />}
                  <span className="text-xs capitalize">{platform.toLowerCase()}</span>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Submit Form & Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scheduled Campaign Notice */}
          {isScheduled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-muted bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">Upcoming Campaign</h3>
                      <p className="text-sm text-muted-foreground">
                        This campaign hasn't started yet. Check back when it goes live to submit your posts.
                      </p>
                      {campaign.startDate && (
                        <p className="text-sm text-foreground/70 mt-1">
                          Launches: {new Date(campaign.startDate).toLocaleString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            timeZoneName: 'short'
                          })}
                        </p>
                      )}
                      
                      {/* Countdown Timer */}
                      {countdown && (
                        <div className="mt-4 grid grid-cols-4 gap-2 max-w-xs">
                          <div className="text-center p-2 rounded-lg bg-background border border-border">
                            <div className="text-xl font-bold tabular-nums">{countdown.days}</div>
                            <div className="text-xs text-muted-foreground">days</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-background border border-border">
                            <div className="text-xl font-bold tabular-nums">{countdown.hours}</div>
                            <div className="text-xs text-muted-foreground">hours</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-background border border-border">
                            <div className="text-xl font-bold tabular-nums">{countdown.minutes}</div>
                            <div className="text-xs text-muted-foreground">mins</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-background border border-border">
                            <div className="text-xl font-bold tabular-nums">{countdown.seconds}</div>
                            <div className="text-xs text-muted-foreground">secs</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Budget Exhausted Notice */}
          {isBudgetExhausted && campaign.status !== "COMPLETED" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-muted bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Campaign Budget Reached</h3>
                      <p className="text-sm text-muted-foreground">
                        This campaign has reached its budget limit and is no longer accepting new submissions.
                        Your existing submissions will continue to be tracked.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Submit Form */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Submit Your Post
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="platform">Platform</Label>
                        <Select onValueChange={(value) => {
                          setValue("platform", value as any)
                          // Reset account selection when platform changes
                          setValue("socialAccountId", "")
                        }}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {campaign.targetPlatforms
                              .filter(p => p !== 'TWITTER' && p !== 'twitter') // Twitter hidden - re-enable when Apify actors are working
                              .map((platform) => {
                              const Icon = platformIcons[platform]
                              return (
                                <SelectItem key={platform} value={platform}>
                                  <div className="flex items-center gap-2">
                                    {Icon && <Icon className="w-4 h-4" />}
                                    <span className="capitalize">{platform.toLowerCase()}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        {errors.platform && (
                          <p className="text-destructive text-sm mt-1">{errors.platform.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="socialAccountId">Your Verified Account <span className="text-destructive">*</span></Label>
                        <Select 
                          onValueChange={(value) => setValue("socialAccountId", value)}
                          disabled={!selectedPlatform}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder={selectedPlatform ? "Select your account" : "Select platform first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {verifiedAccounts
                              .filter(acc => acc.platform === selectedPlatform && acc.verified)
                              .map((account) => {
                                const Icon = platformIcons[account.platform]
                                return (
                                  <SelectItem key={account.id} value={account.id}>
                                    <div className="flex items-center gap-2">
                                      {Icon && <Icon className="w-4 h-4" />}
                                      <span>@{account.username}</span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            {selectedPlatform && verifiedAccounts.filter(acc => acc.platform === selectedPlatform && acc.verified).length === 0 && (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No verified accounts — <Link href="/creators/dashboard/settings" className="underline">verify one</Link>
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {errors.socialAccountId && (
                          <p className="text-destructive text-sm mt-1">{errors.socialAccountId.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="clipUrl">Video URL</Label>
                      <Input
                        id="clipUrl"
                        placeholder={getPlatformPlaceholder(selectedPlatform)}
                        className="mt-1.5"
                        {...register("clipUrl")}
                      />
                      {errors.clipUrl && (
                        <p className="text-destructive text-sm mt-1">{errors.clipUrl.message}</p>
                      )}
                    </div>

                    {selectedPlatform && verifiedAccounts.filter(acc => acc.platform === selectedPlatform && acc.verified).length === 0 && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        You must verify a {selectedPlatform.toLowerCase()} account in{' '}
                        <Link href="/creators/dashboard/settings" className="underline">settings</Link>{' '}
                        before submitting.
                      </p>
                    )}

                    <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Post
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Your Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileVideo className="w-5 h-5" />
                  Your Submissions ({campaignSubmissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaignSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileVideo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No submissions yet for this campaign</p>
                    <p className="text-sm">Submit your first post above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaignSubmissions.map((submission) => {
                      const Icon = platformIcons[submission.platform]
                      const earnings = parseFloat(submission.finalEarnings || submission.clips?.earnings || "0")
                      const initialViews = parseInt(submission.initialViews || "0")
                      const currentViews = parseInt(submission.currentViews || submission.clips?.views || submission.initialViews || "0")
                      const viewGrowth = currentViews - initialViews
                      
                      return (
                        <div
                          key={submission.id}
                          className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded bg-muted">
                                  {Icon && <Icon className="w-4 h-4" />}
                                </div>
                                {getStatusBadge(submission.status)}
                                {submission.trackingCount !== undefined && submission.trackingCount > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {submission.trackingCount} update{submission.trackingCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <a
                                href={submission.clipUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:text-blue-600 truncate block flex items-center gap-1"
                              >
                                {submission.clipUrl.length > 50 
                                  ? `${submission.clipUrl.substring(0, 50)}...` 
                                  : submission.clipUrl}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>Submitted {new Date(submission.createdAt).toLocaleDateString()}</span>
                                {currentViews > 0 && (
                                  <span className="font-medium text-foreground">
                                    {currentViews.toLocaleString()} views
                                    {viewGrowth > 0 && (
                                      <span className="text-green-600 dark:text-green-400 ml-1">
                                        (+{viewGrowth.toLocaleString()})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {submission.status === "APPROVED" && earnings > 0 ? (
                                <>
                                  <p className="font-bold text-foreground">{formatCurrency(earnings)}</p>
                                  <p className="text-xs text-muted-foreground">earned</p>
                                </>
                              ) : submission.status === "APPROVED" ? (
                                <p className="text-xs text-muted-foreground">Tracking views...</p>
                              ) : submission.status === "PENDING" ? (
                                <>
                                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                                  {currentViews > 0 && (
                                    <p className="text-xs text-muted-foreground/70 italic">views being tracked</p>
                                  )}
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Requirements */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.requirements.length > 0 ? (
                  <ul className="space-y-2 ml-1">
                    {campaign.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="text-foreground mt-1.5">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific requirements</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tips Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Target className="w-4 h-4" />
                  Tips to Maximize Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">•</span>
                    Submit 3-7 posts per day for best results
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">•</span>
                    Use a fast hook in the first 0.2 seconds
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">•</span>
                    Best posts are 6-15 seconds long
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">•</span>
                    Add subtitles and on-screen context
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">•</span>
                    Cross-post across all platforms
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Bonus Banner - Bottom */}
      {hasBonuses(campaign) && isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border border-border rounded-lg p-4 bg-muted/30"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Performance Bounties Available</p>
                <p className="text-sm text-muted-foreground">
                  $2,000 in additional rewards for top performers
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setBonusModalOpen(true)}>
              Learn More
            </Button>
          </div>
        </motion.div>
      )}

      {/* Bonus Modal */}
      <CampaignBonusModal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        campaign={{
          id: campaignId,
          title: campaign?.title || "Campaign",
          totalBudget: campaign?.budget || 20000,
          bonusBudget: 2000,
          payoutRate: `$${campaign?.payoutRate || 1} per 1,000 views`
        }}
      />
    </div>
  )
}

