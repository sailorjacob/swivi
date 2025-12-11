"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Eye,
  Users,
  DollarSign,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  FolderOpen,
  Loader2,
  FileVideo,
  Instagram,
  Youtube,
  Music
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    creatorHandle: string
    creatorImage: string | null
    initialViews: number
    currentViews: number
    viewsGained: number
    submittedAt: string
  }>
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TIKTOK: Music,
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return <Badge className="bg-foreground/10 text-foreground border-foreground/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'PENDING':
        return <Badge className="bg-muted text-muted-foreground border-border"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'REJECTED':
        return <Badge className="bg-muted text-muted-foreground/70 border-border"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 w-full flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 w-full text-center">
        <p className="text-sm md:text-base text-muted-foreground mb-4">{error || "Campaign not found"}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
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
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-1 md:mb-2 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
        <span className="text-xs md:text-sm">Back</span>
      </Button>

      {/* Campaign Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-border bg-card"
      >
        {/* Featured Image Banner */}
        {data.featuredImage && (
          <div className="relative h-36 md:h-48 overflow-hidden">
            <img
              src={data.featuredImage}
              alt={data.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
        )}

        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                {isActive && (
                  <Badge className="bg-foreground/10 text-foreground border-foreground/20 text-[10px] md:text-xs">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-foreground rounded-full mr-1 md:mr-1.5 animate-pulse" />
                    LIVE
                  </Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-muted text-muted-foreground text-[10px] md:text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    COMPLETED
                  </Badge>
                )}
              </div>
              
              <h1 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{data.title}</h1>
              <p className="text-xs md:text-base text-muted-foreground mb-3 md:mb-4">{data.description}</p>
              
              <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1 md:gap-1.5">
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] md:text-xs">
                    {(data.creator || 'P').charAt(0)}
                  </div>
                  {data.creator || 'Partner'}
                </span>
                <span className="flex items-center gap-1 md:gap-1.5">
                  <Users className="w-3 h-3 md:w-4 md:h-4" />
                  {data.stats.totalSubmissions} posts
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 md:mt-0">
              {data.contentFolderUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-xs md:text-sm"
                >
                  <a href={data.contentFolderUrl} target="_blank" rel="noopener noreferrer">
                    <FolderOpen className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Content
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4 md:mt-6">
            <div className="p-3 md:p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 md:gap-2 text-muted-foreground mb-1">
                <Target className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs">Budget</span>
              </div>
              <p className="text-lg md:text-xl font-bold">{formatCurrency(budgetNum)}</p>
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 md:gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs">Rate</span>
              </div>
              <p className="text-lg md:text-xl font-bold">${data.payoutRate}/1K</p>
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 md:gap-2 text-muted-foreground mb-1">
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs">Left</span>
              </div>
              <p className="text-lg md:text-xl font-bold">{formatCurrency(remainingBudget)}</p>
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 md:gap-2 text-muted-foreground mb-1">
                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs">Progress</span>
              </div>
              <p className="text-xl font-bold">{progress.toFixed(1)}%</p>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="mt-3 md:mt-4">
            <div className="w-full bg-muted rounded-full h-1.5 md:h-2">
              <div
                className="bg-green-500 h-1.5 md:h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Platforms */}
          <div className="flex items-center gap-2 mt-3 md:mt-4 flex-wrap">
            <span className="text-xs md:text-sm text-muted-foreground">Platforms:</span>
            {data.targetPlatforms.map((platform) => {
              const Icon = platformIcons[platform]
              return (
                <div key={platform} className="flex items-center gap-1 px-1.5 md:px-2 py-1 bg-muted rounded">
                  {Icon && <Icon className="w-3 h-3" />}
                  <span className="text-[10px] md:text-xs capitalize">{platform.toLowerCase()}</span>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Submissions */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <FileVideo className="w-4 h-4 md:w-5 md:h-5" />
                  Submissions ({data.submissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {data.submissions.length === 0 ? (
                  <div className="text-center py-6 md:py-8 text-muted-foreground">
                    <FileVideo className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm md:text-base">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-1 md:pr-2">
                    {data.submissions.map((submission) => {
                      const Icon = platformIcons[submission.platform]
                      const viewGrowth = submission.viewsGained
                      
                      return (
                        <a
                          key={submission.id}
                          href={submission.clipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 md:p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="p-1 md:p-1.5 rounded bg-muted flex-shrink-0">
                              {Icon && <Icon className="w-3 h-3 md:w-4 md:h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs md:text-sm font-medium truncate">@{submission.creatorHandle}</span>
                                {getStatusBadge(submission.status)}
                              </div>
                              <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-muted-foreground mt-1">
                                <span className="hidden sm:inline">
                                  {new Date(submission.submittedAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  View
                                </span>
                              </div>
                            </div>
                            {submission.currentViews > 0 && (
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs md:text-sm font-medium">
                                  {submission.currentViews.toLocaleString()}
                                </p>
                                {viewGrowth > 0 && (
                                  <p className="text-[10px] md:text-xs text-green-600 dark:text-green-400">
                                    +{viewGrowth.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </a>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Requirements */}
        <div className="space-y-4 md:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {data.requirements && data.requirements.length > 0 ? (
                  <ul className="space-y-2 ml-1">
                    {data.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                        <span className="text-foreground mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground">No specific requirements</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
