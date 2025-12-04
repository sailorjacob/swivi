"use client"

import { useState, useEffect } from "react"
import { supabase, authenticatedFetch } from "@/lib/supabase-browser"
import { motion } from "framer-motion"
import { Card, CardContent } from "../../../../components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { Button } from "../../../../components/ui/button"
import { Progress } from "../../../../components/ui/progress"
import { CampaignDetailModal } from "../../../../components/clippers/campaign-detail-modal"
import { CampaignBonusModal } from "../../../../components/campaigns/campaign-bonus-modal"
import { ErrorBoundary, CampaignErrorFallback } from "../../../../components/error-boundary"
import Image from "next/image"
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  Instagram,
  Youtube,
  Twitter,
  Music,
  Eye,
  Target,
  Loader2,
  CheckCircle,
  Trophy,
  Flame,
  Sparkles
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

const platformIcons = {
  tiktok: Music,
  instagram: Instagram, 
  youtube: Youtube,
  twitter: Twitter,
}

// Helper to check if a campaign has special bonuses (featured campaigns)
const hasBonuses = (campaign: Campaign) => {
  return campaign.title.toLowerCase().includes('owning manhattan') && 
         campaign.title.toLowerCase().includes('season 2')
}

// Helper to check if campaign is featured/kickoff
const isFeaturedCampaign = (campaign: Campaign) => {
  return campaign.budget >= 10000 && hasBonuses(campaign)
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [bonusModalOpen, setBonusModalOpen] = useState(false)
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active')

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await authenticatedFetch("/api/clippers/campaigns")
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      } else if (response.status >= 500) {
        // For server errors, show empty state instead of error for better UX
        console.log('🔍 Server error loading campaigns - showing empty state')
        setCampaigns([])
      } else {
        setError("Failed to load campaigns")
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      setError("Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const handleJoinCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setModalOpen(true)
  }

  // Transform API campaign data to match CampaignDetailModal interface
  const transformCampaignForModal = (campaign: Campaign) => {
    return {
      id: campaign.id,
      title: campaign.title,
      creator: campaign.creator,
      description: campaign.description,
      image: campaign.featuredImage || null,
      pool: Number(campaign.budget),
      spent: Number(campaign.spent || 0),
      cpm: Number(campaign.payoutRate), // Payout rate per 1K views
      platforms: campaign.targetPlatforms.map(p => p.toLowerCase()),
      totalSubmissions: campaign._count.clipSubmissions,
      totalViews: 0, // We don't track total views in current schema
      status: campaign.status,
      requirements: campaign.requirements,
      contentSources: [] // We don't have content sources in current schema
    }
  }

  const getProgressPercentage = (spent: number, budget: number) => {
    return budget > 0 ? (spent / budget) * 100 : 0
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Filter campaigns based on selected filter
  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'active') return campaign.status === 'ACTIVE'
    if (filter === 'completed') return campaign.status === 'COMPLETED'
    return true // 'all' shows everything
  })

  // Count campaigns by status
  const activeCampaignsCount = campaigns.filter(c => c.status === 'ACTIVE').length
  const completedCampaignsCount = campaigns.filter(c => c.status === 'COMPLETED').length

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCampaigns} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  // Get featured campaign if any
  const featuredCampaign = campaigns.find(c => isFeaturedCampaign(c) && c.status === 'ACTIVE')

  return (
    <ErrorBoundary fallback={CampaignErrorFallback}>
      <div className="space-y-6">

      {/* Featured Campaign Banner */}
      {featuredCampaign && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y5NzMxNiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Flame className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold">{featuredCampaign.title}</h2>
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs animate-pulse">
                      LIVE NOW
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Our biggest campaign ever! ${featuredCampaign.budget.toLocaleString()} total budget + $2,000 in bonus rewards.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-medium">${featuredCampaign.payoutRate}/1K views</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-amber-600 dark:text-amber-400">$2,000 in Bounties</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => handleJoinCampaign(featuredCampaign)}
                  className="flex-1 sm:flex-none"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Join Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setBonusModalOpen(true)}
                  className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  View Bonuses
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-6 border-b border-border">
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
        <button
          onClick={() => setFilter('all')}
          className={`pb-2 text-sm transition-colors ${
            filter === 'all' 
              ? 'text-foreground border-b-2 border-foreground -mb-px' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All {campaigns.length > 0 && `(${campaigns.length})`}
        </button>
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {filter === 'active' ? 'No active campaigns right now. Check back soon.' :
             filter === 'completed' ? 'No completed campaigns yet.' :
             'No campaigns found.'}
          </p>
        </div>
      ) : (
        /* Campaigns Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
          // Calculate progress percentage
          const progress = getProgressPercentage(campaign.spent, campaign.budget)
          const isActive = campaign.status === "ACTIVE"
          const isLaunching = campaign.status === "DRAFT"
          const isCompleted = campaign.status === "COMPLETED"

          // Campaign runs until budget is exhausted
          const remainingBudget = campaign.budget - campaign.spent
          const budgetText = remainingBudget > 0 ? `$${(typeof remainingBudget === 'number' ? remainingBudget : parseFloat(remainingBudget || 0)).toFixed(0)} left` : "Budget Full"

          return (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`bg-card border-border hover:shadow-lg transition-all duration-300 cursor-pointer group ${isCompleted ? 'opacity-75 border-green-500/30' : ''}`}>
              <CardContent className="p-0">
                {/* Campaign Image */}
                <div 
                  className="relative h-48 bg-muted rounded-t-lg overflow-hidden cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  onClick={() => handleJoinCampaign(campaign)}
                >
                  {isActive && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                      <Badge className="bg-foreground text-background text-xs px-2 py-1">
                        LIVE
                      </Badge>
                      {hasBonuses(campaign) && (
                        <Badge className="bg-amber-500 text-black text-xs px-2 py-1 flex items-center gap-1 animate-pulse">
                          <Trophy className="w-3 h-3" />
                          BONUSES
                        </Badge>
                      )}
                    </div>
                  )}
                  {isLaunching && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30 text-xs px-2 py-1 font-medium">
                        LAUNCHING SOON
                      </Badge>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-green-600 text-white text-xs px-2 py-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        COMPLETED
                      </Badge>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 z-5 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="relative w-full h-full">
                    {campaign.featuredImage && campaign.featuredImage.trim() !== '' ? (
                      <>
                        <img
                          src={campaign.featuredImage}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Image failed to load:', campaign.featuredImage)
                            // Hide the image and show the gradient fallback
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.parentElement?.querySelector('.gradient-fallback') as HTMLElement
                            if (fallback) {
                              fallback.style.display = 'flex'
                            }
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', campaign.featuredImage)
                          }}
                        />
                        <div className="gradient-fallback hidden w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center absolute inset-0">
                          <span className="text-white text-lg font-medium">{campaign.title}</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-lg font-medium">{campaign.title}</span>
                        {/* Debug info */}
                        <div className="absolute bottom-0 left-0 text-xs text-white/50 p-1">
                          {campaign.featuredImage ? 'Empty URL' : 'No Image'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">
                      {campaign.creator.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-muted-foreground">{campaign.creator}</span>
                  </div>

                  <h3 className="text-lg font-medium text-foreground mb-2 line-clamp-2">
                    {campaign.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {campaign.description}
                  </p>

                  {/* Budget Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span className="font-medium">Budget Progress</span>
                      <span className="font-medium">{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-foreground h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{typeof campaign.payoutRate === 'number' ? `$${campaign.payoutRate}` : campaign.payoutRate} per 1K views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{budgetText}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Pool: {formatCurrency(campaign.budget)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{campaign._count.clipSubmissions} submissions</span>
                      </div>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">Platforms:</span>
                    <div className="flex gap-1">
                      {campaign.targetPlatforms.map((platform) => {
                        const Icon = platformIcons[platform.toLowerCase() as keyof typeof platformIcons]
                        return (
                          <div key={platform} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                            {Icon && <Icon className="w-3 h-3 text-muted-foreground" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleJoinCampaign(campaign)}
                      disabled={isLaunching || isCompleted}
                      variant={isCompleted ? "secondary" : "default"}
                    >
                      {isLaunching ? "Coming Soon" : isCompleted ? "Campaign Ended" : "Join Campaign"}
                    </Button>
                    {hasBonuses(campaign) && !isCompleted && (
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setBonusModalOpen(true)
                        }}
                        className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600"
                      >
                        <Trophy className="w-4 h-4 mr-1" />
                        Bonuses
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )
        })}
        </div>
      )}

        {/* Campaign Detail Modal */}
        <CampaignDetailModal
          campaign={selectedCampaign ? transformCampaignForModal(selectedCampaign) : null}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />

        {/* Bonus Modal for Featured Campaigns */}
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
    </ErrorBoundary>
  )
}