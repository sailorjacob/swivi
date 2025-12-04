"use client"

import { useState, useEffect } from "react"
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
import toast from "react-hot-toast"
import Link from "next/link"
import { 
  ArrowLeft,
  DollarSign, 
  Users, 
  Clock,
  Instagram,
  Youtube,
  Twitter,
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
  FileVideo
} from "lucide-react"

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
  finalEarnings: string
  createdAt: string
  campaigns: {
    title: string
    payoutRate: number
  }
}

const platformIcons: Record<string, any> = {
  tiktok: Music,
  instagram: Instagram, 
  youtube: Youtube,
  twitter: Twitter,
  TIKTOK: Music,
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  TWITTER: Twitter,
}

const submitSchema = z.object({
  clipUrl: z.string().url("Please enter a valid URL"),
  platform: z.enum(["TIKTOK", "INSTAGRAM", "YOUTUBE", "TWITTER"], {
    errorMap: () => ({ message: "Please select a platform" }),
  }),
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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bonusModalOpen, setBonusModalOpen] = useState(false)

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
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch campaign details
      const campaignRes = await authenticatedFetch(`/api/clippers/campaigns/${campaignId}`)
      if (campaignRes.ok) {
        const campaignData = await campaignRes.json()
        setCampaign(campaignData)
      }

      // Fetch user's submissions for this campaign
      const submissionsRes = await authenticatedFetch("/api/clippers/submissions")
      if (submissionsRes.ok) {
        const allSubmissions = await submissionsRes.json()
        // Filter to only this campaign's submissions
        const campaignSubmissions = allSubmissions.filter(
          (s: Submission) => s.campaigns && s.campaigns.title === campaign?.title
        )
        setSubmissions(allSubmissions) // We'll filter in render
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load campaign")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (campaignId) {
      fetchData()
    }
  }, [campaignId])

  // Re-filter submissions when campaign loads
  const campaignSubmissions = submissions.filter(s => {
    // Match by campaign ID if available, otherwise by title
    return s.campaigns?.title === campaign?.title
  })

  const onSubmit = async (data: z.infer<typeof submitSchema>) => {
    if (!campaign) return
    
    setSubmitting(true)
    try {
      const response = await authenticatedFetch("/api/clippers/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaignId: campaign.id,
          clipUrl: data.clipUrl,
          platform: data.platform,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.requiresVerification) {
          toast.error(`Please verify your ${data.platform} account first`)
        } else {
          toast.error(result.error || "Failed to submit clip")
        }
        return
      }
      
      toast.success("Clip submitted successfully! It will be reviewed shortly.")
      reset()
      // Refresh submissions
      fetchData()
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("Failed to submit clip. Please try again.")
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
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>
      case "REJECTED":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
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

  const isActive = campaign.status === "ACTIVE"
  const isCompleted = campaign.status === "COMPLETED"
  const progress = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0
  const remainingBudget = campaign.budget - campaign.spent

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Campaigns
      </Button>

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
                {isActive && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
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
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Trophy className="w-3 h-3 mr-1" />
                    BOUNTIES AVAILABLE
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl font-bold mb-2">{campaign.title}</h1>
              <p className="text-muted-foreground mb-4">{campaign.description}</p>
              
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

            {hasBonuses(campaign) && (
              <Button
                variant="outline"
                onClick={() => setBonusModalOpen(true)}
                className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
              >
                <Trophy className="w-4 h-4 mr-2" />
                View $2K Bounties
              </Button>
            )}
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
                className="bg-foreground h-2 rounded-full transition-all duration-500"
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
                    Submit Your Clip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="platform">Platform</Label>
                        <Select onValueChange={(value) => setValue("platform", value as any)}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {campaign.targetPlatforms.map((platform) => {
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
                    </div>

                    {selectedPlatform && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Make sure you've verified your {selectedPlatform.toLowerCase()} account in your profile settings.
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
                          Submit Clip
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
                    <p className="text-sm">Submit your first clip above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaignSubmissions.map((submission) => {
                      const Icon = platformIcons[submission.platform]
                      const earnings = parseFloat(submission.finalEarnings || "0")
                      const views = parseInt(submission.initialViews || "0")
                      
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
                              <p className="text-xs text-muted-foreground mt-1">
                                Submitted {new Date(submission.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              {submission.status === "APPROVED" && (
                                <>
                                  <p className="font-bold text-green-600">{formatCurrency(earnings)}</p>
                                  <p className="text-xs text-muted-foreground">earned</p>
                                </>
                              )}
                              {submission.status === "PENDING" && (
                                <p className="text-xs text-muted-foreground">Awaiting review</p>
                              )}
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
                  <ul className="space-y-3">
                    {campaign.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
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
            <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Flame className="w-5 h-5" />
                  Tips to Maximize Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    Post 3-7 clips per day for best results
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    Use a fast hook in the first 0.2 seconds
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    Best clips are 6-15 seconds long
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    Add subtitles and on-screen context
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    Cross-post across all platforms
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Bonus Modal */}
      <CampaignBonusModal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        campaign={{
          title: "Owning Manhattan Season 2",
          totalBudget: 20000,
          bonusBudget: 2000,
          payoutRate: "$1 per 1,000 views"
        }}
      />
    </div>
  )
}

