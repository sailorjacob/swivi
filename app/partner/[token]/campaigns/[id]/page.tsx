"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Play,
  FolderOpen,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"

interface CampaignDetail {
  id: string
  title: string
  description: string
  creator: string
  status: string
  budget: number
  spent: number
  payoutRate: number
  targetPlatforms: string[]
  requirements: string[]
  featuredImage: string | null
  contentFolderUrl: string | null
  startDate: string | null
  endDate: string | null
  completedAt: string | null
  createdAt: string
  stats: {
    totalViews: number
    viewsGained: number
    totalSubmissions: number
    approvedSubmissions: number
    pendingSubmissions: number
    rejectedSubmissions: number
    uniqueCreators: number
  }
  submissions: Array<{
    id: string
    clipUrl: string
    platform: string
    status: string
    creatorName: string
    creatorImage: string | null
    initialViews: number
    currentViews: number
    viewsGained: number
    submittedAt: string
  }>
}

export default function PartnerCampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const campaignId = params.id as string
  
  const [data, setData] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/partner/${token}/campaigns/${campaignId}`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError("Unable to load campaign")
        }
      } catch (err) {
        setError("Connection error")
      } finally {
        setLoading(false)
      }
    }

    if (token && campaignId) {
      fetchData()
    }
  }, [token, campaignId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return (
          <Badge className="bg-foreground/10 text-foreground border-foreground/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge className="bg-muted text-muted-foreground border-border">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-muted text-muted-foreground/70 border-border">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center py-12">
        <p className="text-muted-foreground mb-4">{error || "Campaign not found"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const spentNum = Number(data.spent ?? 0)
  const budgetNum = Number(data.budget ?? 0)
  const isBudgetExhausted = spentNum >= budgetNum
  const isActive = data.status === "ACTIVE" && !isBudgetExhausted
  const isCompleted = data.status === "COMPLETED" || isBudgetExhausted
  const progress = budgetNum > 0 ? Math.min(100, (spentNum / budgetNum) * 100) : 0
  const remainingBudget = Math.max(0, budgetNum - spentNum)

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
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
        {data.featuredImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={data.featuredImage}
              alt={data.title}
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
                <div className="flex gap-1">
                  {data.targetPlatforms.map(platform => (
                    <div key={platform} className="w-5 h-5">
                      {getPlatformLogo(platform, '', 18)}
                    </div>
                  ))}
                </div>
              </div>
              
              <h1 className="text-2xl font-bold mb-2">{data.title}</h1>
              <p className="text-muted-foreground mb-4">{data.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs">
                    {data.creator.charAt(0)}
                  </div>
                  {data.creator}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {data.stats.totalSubmissions} submissions
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {data.stats.totalViews.toLocaleString()} views
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {data.contentFolderUrl && (
                <Button
                  variant="outline"
                  asChild
                >
                  <a href={data.contentFolderUrl} target="_blank" rel="noopener noreferrer">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Content Folder
                  </a>
                </Button>
              )}
              <Link href={`/client/${token}/report`}>
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Full Report
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs">Total Budget</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(budgetNum)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Payout Rate</span>
              </div>
              <p className="text-xl font-bold">${data.payoutRate}/1K</p>
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
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Budget Used</span>
              <span>{formatCurrency(spentNum)} / {formatCurrency(budgetNum)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-foreground h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Requirements Section */}
      {data.requirements && data.requirements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Submissions Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="w-5 h-5" />
                Submissions ({data.submissions.length})
              </CardTitle>
              <div className="flex gap-3 text-sm text-muted-foreground">
                <span>{data.stats.approvedSubmissions} approved</span>
                <span>·</span>
                <span>{data.stats.pendingSubmissions} pending</span>
                <span>·</span>
                <span>{data.stats.rejectedSubmissions} rejected</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.submissions.length === 0 ? (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.submissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank */}
                    <span className="w-6 text-sm font-medium text-muted-foreground">
                      {index + 1}.
                    </span>

                    {/* Creator */}
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={submission.creatorImage || undefined} />
                      <AvatarFallback className="text-xs">
                        {submission.creatorName[0] || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{submission.creatorName}</span>
                        {getSubmissionStatusBadge(submission.status)}
                      </div>
                    </div>

                    {/* Platform */}
                    <div className="flex-shrink-0">
                      {getPlatformLogo(submission.platform, '', 18)}
                    </div>

                    {/* Views */}
                    <div className="text-right text-sm">
                      <span className="font-medium">{submission.currentViews.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1">views</span>
                    </div>

                    {/* Views Gained */}
                    {submission.viewsGained > 0 && (
                      <div className="text-right text-sm text-muted-foreground">
                        +{submission.viewsGained.toLocaleString()}
                      </div>
                    )}

                    {/* Link */}
                    <a
                      href={submission.clipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
