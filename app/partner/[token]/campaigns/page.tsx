"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  Play,
  Calendar,
  Loader2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"

interface Campaign {
  id: string
  title: string
  description: string
  creator: string
  status: string
  budget: number
  spent: number
  payoutRate: number
  targetPlatforms: string[]
  featuredImage: string | null
  createdAt: string
  stats: {
    totalSubmissions: number
    approvedSubmissions: number
    totalViews: number
  }
}

interface CampaignsData {
  partnerName: string
  campaigns: Campaign[]
}

export default function PartnerCampaignsPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [data, setData] = useState<CampaignsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('all')

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

  const handleViewCampaign = (campaign: Campaign) => {
    router.push(`/partner/${token}/campaigns/${campaign.id}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
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

  // Filter campaigns
  const filteredCampaigns = data.campaigns.filter(campaign => {
    if (filter === 'active') return campaign.status === 'ACTIVE'
    if (filter === 'completed') return campaign.status === 'COMPLETED'
    return true
  })

  // Count by status
  const activeCampaignsCount = data.campaigns.filter(c => c.status === 'ACTIVE').length
  const completedCampaignsCount = data.campaigns.filter(c => c.status === 'COMPLETED').length

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

      {/* Filter Tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2 text-sm transition-colors ${
            filter === 'all' 
              ? 'text-foreground border-b-2 border-foreground -mb-px' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All {data.campaigns.length > 0 && `(${data.campaigns.length})`}
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`pb-2 text-sm transition-colors ${
            filter === 'active' 
              ? 'text-foreground border-b-2 border-foreground -mb-px' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Active {activeCampaignsCount > 0 && `(${activeCampaignsCount})`}
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`pb-2 text-sm transition-colors ${
            filter === 'completed' 
              ? 'text-foreground border-b-2 border-foreground -mb-px' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Completed {completedCampaignsCount > 0 && `(${completedCampaignsCount})`}
        </button>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {filter === 'active' ? 'No active campaigns right now.' :
             filter === 'completed' ? 'No completed campaigns yet.' :
             'No campaigns found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign) => {
            const budgetNum = Number(campaign.budget ?? 0)
            const spentNum = Number(campaign.spent ?? 0)
            const progress = budgetNum > 0 ? (spentNum / budgetNum) * 100 : 0
            const isActive = campaign.status === "ACTIVE"
            const isCompleted = campaign.status === "COMPLETED"
            const remainingBudget = Math.max(0, budgetNum - spentNum)

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Card className={`bg-card border-border hover:shadow-xl transition-all duration-300 cursor-pointer group relative ${isCompleted ? 'opacity-75' : ''}`}>
                  <CardContent className="p-0">
                    {/* Campaign Image */}
                    <div 
                      className="relative h-48 bg-muted rounded-t-lg overflow-hidden cursor-pointer"
                      onClick={() => handleViewCampaign(campaign)}
                    >
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                        {isActive && (
                          <Badge className="bg-foreground text-background text-xs px-2 py-1">
                            LIVE
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-muted text-muted-foreground text-xs px-2 py-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            COMPLETED
                          </Badge>
                        )}
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 z-5 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Image */}
                      {campaign.featuredImage ? (
                        <img
                          src={campaign.featuredImage}
                          alt={campaign.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-foreground/20 to-foreground/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <Target className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Campaign Info */}
                    <div className="p-4">
                      {/* Creator */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">
                          {campaign.creator.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-muted-foreground">{campaign.creator}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-medium text-foreground mb-2 line-clamp-2">
                        {campaign.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {campaign.description}
                      </p>

                      {/* Budget Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span className="font-medium">Budget Progress</span>
                          <span className="font-medium">{formatCurrency(spentNum)} / {formatCurrency(budgetNum)}</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

                      {/* Key Metrics */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">${campaign.payoutRate} per 1K views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {remainingBudget > 0 ? `${formatCurrency(remainingBudget)} left` : 'Budget Full'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{campaign.stats.totalViews.toLocaleString()} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{campaign.stats.approvedSubmissions} posts</span>
                          </div>
                        </div>
                      </div>

                      {/* Platforms */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-muted-foreground">Platforms:</span>
                        <div className="flex gap-1">
                          {campaign.targetPlatforms.map((platform) => (
                            <div key={platform} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                              {getPlatformLogo(platform, '', 14)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        className="w-full bg-foreground text-background hover:bg-transparent hover:text-foreground border border-foreground"
                        onClick={() => handleViewCampaign(campaign)}
                      >
                        {isCompleted ? "View Results" : "View Campaign"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
