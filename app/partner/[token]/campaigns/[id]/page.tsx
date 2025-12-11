"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
  FolderOpen
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"

interface CampaignDetail {
  id: string
  title: string
  description: string
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-foreground text-background">
            <span className="w-1.5 h-1.5 bg-background rounded-full mr-1.5 animate-pulse" />
            Live
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case 'PAUSED':
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return (
          <Badge className="bg-foreground text-background">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="secondary">
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
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error || "Campaign not found"}</p>
            <Link href={`/partner/${token}/campaigns`}>
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = data.budget > 0 ? Math.min((data.spent / data.budget) * 100, 100) : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <Link href={`/partner/${token}/campaigns`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Button>
      </Link>

      {/* Campaign Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Featured Image */}
        {data.featuredImage && (
          <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-6">
            <img
              src={data.featuredImage}
              alt={data.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(data.status)}
                <div className="flex gap-1">
                  {data.targetPlatforms.map(platform => (
                    <div key={platform} className="w-6 h-6">
                      {getPlatformLogo(platform, '', 20)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {!data.featuredImage && getStatusBadge(data.status)}
              {!data.featuredImage && (
                <div className="flex gap-1">
                  {data.targetPlatforms.map(platform => (
                    <div key={platform} className="w-5 h-5">
                      {getPlatformLogo(platform, '', 18)}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{data.title}</h1>
            <p className="text-muted-foreground mb-4">{data.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Started {new Date(data.startDate || data.createdAt).toLocaleDateString()}
              </span>
              {data.completedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Completed {new Date(data.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Content Folder Link */}
          {data.contentFolderUrl && (
            <a href={data.contentFolderUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <FolderOpen className="w-4 h-4 mr-2" />
                Content Folder
              </Button>
            </a>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Total Views</span>
            </div>
            <p className="text-3xl font-bold">{data.stats.totalViews.toLocaleString()}</p>
            {data.stats.viewsGained > 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +{data.stats.viewsGained.toLocaleString()} tracked
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Submissions</span>
            </div>
            <p className="text-3xl font-bold">{data.stats.approvedSubmissions}</p>
            <p className="text-sm text-muted-foreground mt-1">
              of {data.stats.totalSubmissions} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Budget Used</span>
            </div>
            <p className="text-3xl font-bold">${data.spent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              of ${data.budget.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Payout Rate</span>
            </div>
            <p className="text-3xl font-bold">${data.payoutRate}</p>
            <p className="text-sm text-muted-foreground mt-1">per 1K views</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Budget Progress</span>
              <span className="font-medium">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>${data.spent.toLocaleString()} spent</span>
              <span>${(data.budget - data.spent).toLocaleString()} remaining</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Requirements */}
      {data.requirements && data.requirements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Submissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="w-5 h-5" />
                Submissions ({data.submissions.length})
              </CardTitle>
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground">{data.stats.approvedSubmissions} approved</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{data.stats.pendingSubmissions} pending</span>
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
              <div className="space-y-3">
                {data.submissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>

                    {/* Creator */}
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={submission.creatorImage || undefined} />
                      <AvatarFallback className="text-sm">
                        {submission.creatorName[0] || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{submission.creatorName}</p>
                        {getSubmissionStatusBadge(submission.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Platform */}
                    <div className="flex-shrink-0">
                      {getPlatformLogo(submission.platform, '', 20)}
                    </div>

                    {/* Views */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="font-medium">{submission.currentViews.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>

                    {/* Views Gained */}
                    {submission.viewsGained > 0 && (
                      <div className="text-right flex-shrink-0 hidden md:block">
                        <p className="font-medium flex items-center gap-1 justify-end">
                          <TrendingUp className="w-3 h-3" />
                          +{submission.viewsGained.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">tracked</p>
                      </div>
                    )}

                    {/* Link */}
                    <a
                      href={submission.clipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
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
