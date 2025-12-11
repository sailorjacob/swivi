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
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"

interface Campaign {
  id: string
  title: string
  description: string
  status: string
  budget: number
  spent: number
  payoutRate: number
  targetPlatforms: string[]
  featuredImage: string | null
  startDate: string | null
  endDate: string | null
  completedAt: string | null
  createdAt: string
  stats: {
    totalSubmissions: number
    approvedSubmissions: number
    totalViews: number
    viewsGained: number
  }
}

interface CampaignsData {
  partnerName: string
  campaigns: Campaign[]
}

export default function PartnerCampaignsPage() {
  const params = useParams()
  const token = params.token as string
  
  const [data, setData] = useState<CampaignsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/partner/${token}/campaigns`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError("Unable to load campaigns")
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
            <p className="text-muted-foreground">{error || "Unable to load campaigns"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredCampaigns = data.campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Your Campaigns</h1>
        <p className="text-muted-foreground">
          View and track all your campaigns on Swivi.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "ACTIVE" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ACTIVE")}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("COMPLETED")}
          >
            Completed
          </Button>
        </div>
      </motion.div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Your campaigns will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign, index) => {
            const progress = campaign.budget > 0 
              ? Math.min((campaign.spent / campaign.budget) * 100, 100) 
              : 0
            const isExpanded = expandedCampaign === campaign.id

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  {/* Campaign Header */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Featured Image */}
                      {campaign.featuredImage && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 hidden sm:block">
                          <img 
                            src={campaign.featuredImage} 
                            alt={campaign.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Campaign Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{campaign.title}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {campaign.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                            {campaign.targetPlatforms.map(p => (
                              <div key={p} className="w-4 h-4">
                                {getPlatformLogo(p, '', 16)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Stats Summary */}
                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{campaign.stats.totalViews.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{campaign.stats.approvedSubmissions}</p>
                          <p className="text-xs text-muted-foreground">Posts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{progress.toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground">Budget</p>
                        </div>
                      </div>

                      {/* Expand Button */}
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border"
                    >
                      <div className="p-6 bg-muted/20">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Eye className="w-4 h-4" />
                              <span className="text-xs">Total Views</span>
                            </div>
                            <p className="text-xl font-bold">{campaign.stats.totalViews.toLocaleString()}</p>
                            {campaign.stats.viewsGained > 0 && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3 h-3" />
                                +{campaign.stats.viewsGained.toLocaleString()} tracked
                              </p>
                            )}
                          </div>
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Users className="w-4 h-4" />
                              <span className="text-xs">Submissions</span>
                            </div>
                            <p className="text-xl font-bold">{campaign.stats.approvedSubmissions}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              of {campaign.stats.totalSubmissions} total
                            </p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-xs">Budget Used</span>
                            </div>
                            <p className="text-xl font-bold">${campaign.spent.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              of ${campaign.budget.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs">Payout Rate</span>
                            </div>
                            <p className="text-xl font-bold">${campaign.payoutRate}</p>
                            <p className="text-xs text-muted-foreground mt-1">per 1K views</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Budget Progress</span>
                            <span className="font-medium">{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 flex-wrap">
                          <Link href={`/partner/${token}/campaigns/${campaign.id}`}>
                            <Button size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details & Submissions
                            </Button>
                          </Link>
                          <Link href={`/client/${token}`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Live Dashboard
                            </Button>
                          </Link>
                          <Link href={`/client/${token}/report`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Full Report
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
