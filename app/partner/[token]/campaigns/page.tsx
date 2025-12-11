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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Your Campaigns</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          View and track all your campaigns.
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-4 md:gap-6 border-b border-border mb-4 md:mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2 text-xs md:text-sm whitespace-nowrap transition-colors ${
            filter === 'all' 
              ? 'text-foreground border-b-2 border-foreground -mb-px' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All {data.campaigns.length > 0 && `(${data.campaigns.length})`}
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`pb-2 text-xs md:text-sm whitespace-nowrap transition-colors ${
            filter === 'active' 
              ? 'text-foreground border-b-2 border-foreground -mb-px' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Active {activeCampaignsCount > 0 && `(${activeCampaignsCount})`}
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`pb-2 text-xs md:text-sm whitespace-nowrap transition-colors ${
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
        <div className="text-center py-12 md:py-16">
          <Target className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {filter === 'active' ? 'No active campaigns right now.' :
             filter === 'completed' ? 'No completed campaigns yet.' :
             'No campaigns found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
                <Card className={`bg-card border-border hover:shadow-xl transition-all duration-300 cursor-pointer group relative ${isCompleted ? 'opacity-75 border-green-500/30' : ''}`}>
                  <CardContent className="p-0">
                    {/* Campaign Image */}
                    <div 
                      className="relative h-36 md:h-48 bg-muted rounded-t-lg overflow-hidden cursor-pointer"
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
                          <Badge className="bg-green-600 text-white text-xs px-2 py-1 flex items-center gap-1">
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
                    <div className="p-3 md:p-4">
                      {/* Creator */}
                      <div className="flex items-center gap-2 mb-2 md:mb-3">
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] md:text-xs font-medium">
                          {(campaign.creator || 'P').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs md:text-sm text-muted-foreground">{campaign.creator || 'Partner'}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base md:text-lg font-medium text-foreground mb-1 md:mb-2 line-clamp-2">
                        {campaign.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2">
                        {campaign.description}
                      </p>

                      {/* Budget Progress Bar */}
                      <div className="mb-3 md:mb-4">
                        <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-1.5">
                          <span className="font-medium">Budget</span>
                          <span className="font-medium">{formatCurrency(spentNum)} / {formatCurrency(budgetNum)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 md:h-3">
                          <div
                            className="bg-green-500 h-2 md:h-3 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Key Metrics - Stack on mobile */}
                      <div className="grid grid-cols-2 gap-2 mb-3 md:mb-4 text-[10px] md:text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                          <span>${campaign.payoutRate}/1K</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <Users className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{campaign.stats.totalSubmissions} posts</span>
                        </div>
                      </div>

                      {/* Platforms */}
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
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
                        className="w-full text-xs md:text-sm bg-foreground text-background hover:bg-transparent hover:text-foreground border border-foreground"
                        onClick={() => handleViewCampaign(campaign)}
                        size="sm"
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
