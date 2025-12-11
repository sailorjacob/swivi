"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  BarChart3,
  ArrowRight,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"

interface DashboardData {
  partnerName: string
  summary: {
    totalCampaigns: number
    activeCampaigns: number
    completedCampaigns: number
    totalBudget: number
    totalSpent: number
    totalViews: number
    totalSubmissions: number
    approvedSubmissions: number
  }
  recentCampaigns: Array<{
    id: string
    title: string
    status: string
    budget: number
    spent: number
    views: number
    submissions: number
    platforms: string[]
    createdAt: string
  }>
  topPerformers: Array<{
    id: string
    clipUrl: string
    platform: string
    creatorName: string
    views: number
    campaignTitle: string
  }>
}

export default function PartnerDashboardPage() {
  const params = useParams()
  const token = params.token as string
  
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/partner/${token}/dashboard`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError("Unable to load dashboard data")
        }
      } catch (err) {
        setError("Connection error")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token])

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
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error || "Unable to load data"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { summary, recentCampaigns, topPerformers } = data

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, {data.partnerName}</h1>
        <p className="text-muted-foreground">
          Here's an overview of your campaign performance on Swivi.
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Campaigns</span>
            </div>
            <p className="text-3xl font-bold">{summary.totalCampaigns}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {summary.activeCampaigns} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Total Views</span>
            </div>
            <p className="text-3xl font-bold">{summary.totalViews.toLocaleString()}</p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Submissions</span>
            </div>
            <p className="text-3xl font-bold">{summary.approvedSubmissions}</p>
            <p className="text-sm text-muted-foreground mt-1">
              of {summary.totalSubmissions} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Budget Used</span>
            </div>
            <p className="text-3xl font-bold">${summary.totalSpent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              of ${summary.totalBudget.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Your Campaigns
              </CardTitle>
              <Link href={`/partner/${token}/campaigns`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No campaigns yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCampaigns.slice(0, 5).map((campaign) => {
                    const progress = campaign.budget > 0 
                      ? Math.min((campaign.spent / campaign.budget) * 100, 100) 
                      : 0
                    return (
                      <div key={campaign.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{campaign.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(campaign.status)}
                              <div className="flex gap-1">
                                {campaign.platforms.slice(0, 3).map(p => (
                                  <div key={p} className="w-4 h-4">
                                    {getPlatformLogo(p, '', 16)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{campaign.views.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">views</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{campaign.submissions} clips</span>
                            <span>${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Performing Content
              </CardTitle>
              <Link href={`/partner/${token}/submissions`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {topPerformers.length === 0 ? (
                <div className="text-center py-8">
                  <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No content yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topPerformers.slice(0, 5).map((clip, index) => (
                    <a
                      key={clip.id}
                      href={clip.clipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{clip.creatorName}</p>
                        <p className="text-xs text-muted-foreground truncate">{clip.campaignTitle}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getPlatformLogo(clip.platform, '', 16)}
                        <div className="text-right">
                          <p className="font-medium text-sm">{clip.views.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Need a detailed report?</h3>
                <p className="text-muted-foreground text-sm">
                  View comprehensive performance reports for any of your campaigns.
                </p>
              </div>
              <Link href={`/partner/${token}/reports`}>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
