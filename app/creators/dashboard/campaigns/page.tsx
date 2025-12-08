"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase, authenticatedFetch } from "@/lib/supabase-browser"
import { motion } from "framer-motion"
import { Card, CardContent } from "../../../../components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { Button } from "../../../../components/ui/button"
import { Progress } from "../../../../components/ui/progress"
import { CampaignBonusModal } from "../../../../components/campaigns/campaign-bonus-modal"
import { LinkifyText } from "../../../../components/ui/linkify-text"
import { ErrorBoundary, CampaignErrorFallback } from "../../../../components/error-boundary"
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar"
import Image from "next/image"
import Link from "next/link"
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  Instagram,
  Youtube,
  // Twitter, // Hidden - re-enable when Apify actors are working
  Music,
  Eye,
  Target,
  Loader2,
  CheckCircle,
  Trophy,
  Calendar,
  Activity,
  Crown,
  X,
  Info
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

// Countdown hook for scheduled campaigns
function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  
  useEffect(() => {
    if (!targetDate) return
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const difference = target - now
      
      if (difference <= 0) {
        setTimeLeft('Launching soon...')
        return
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }
    
    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    
    return () => clearInterval(timer)
  }, [targetDate])
  
  return timeLeft
}

// Scheduled Badge Component with Countdown
function ScheduledBadge({ startDate }: { startDate?: string }) {
  const countdown = useCountdown(startDate)
  
  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
      <Badge className="bg-muted/90 text-muted-foreground border-border text-xs px-2 py-1 font-medium flex items-center gap-1.5">
        <Clock className="w-3 h-3" />
        UPCOMING
      </Badge>
      {countdown && (
        <Badge variant="outline" className="bg-background/80 text-foreground text-xs px-2 py-1 font-mono">
          {countdown}
        </Badge>
      )}
    </div>
  )
}

const platformIcons = {
  tiktok: Music,
  instagram: Instagram, 
  youtube: Youtube,
  // twitter: Twitter, // Hidden - re-enable when Apify actors are working
}

// Helper to check if a campaign has special bonuses
const hasBonuses = (campaign: Campaign) => {
  return campaign.title.toLowerCase().includes('owning manhattan') && 
         campaign.title.toLowerCase().includes('season 2')
}

// Activity data type
interface ActivityData {
  topCreators: Array<{
    userId: string
    name: string | null
    image: string | null
    totalViewsGained: number
    totalEarnings: number
    clipCount: number
  }>
  recentActivity: Array<{
    id: string
    type: string
    timestamp: string
    creator: string
    creatorImage: string | null
    platform: string
    campaign: string | null
    campaignId: string | null
    viewsGained: number | null
  }>
  totals: {
    totalSubmissions: number
    totalCreators: number
    totalViewsGained: number
    totalEarnings: number
    totalRemainingBudget: number
  }
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true) // Initial load only
  const [isRefreshing, setIsRefreshing] = useState(false) // Background refresh indicator
  const [error, setError] = useState<string | null>(null)
  const [bonusModalOpen, setBonusModalOpen] = useState(false)
  const [selectedBountyCampaign, setSelectedBountyCampaign] = useState<Campaign | null>(null)
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'completed' | 'all'>('active')
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [activityLoading, setActivityLoading] = useState(true)
  
  // Info notice state - check localStorage to see if user dismissed it
  const [showInfoNotice, setShowInfoNotice] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('campaigns-info-notice-dismissed') !== 'true'
    }
    return true
  })
  
  const dismissInfoNotice = () => {
    setShowInfoNotice(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('campaigns-info-notice-dismissed', 'true')
    }
  }

  // Fetch activity data
  const fetchActivity = useCallback(async () => {
    try {
      const response = await authenticatedFetch("/api/creators/activity")
      if (response.ok) {
        const data = await response.json()
        setActivityData(data)
      }
    } catch (error) {
      console.error("Error fetching activity:", error)
    } finally {
      setActivityLoading(false)
    }
  }, [])

  const fetchCampaigns = async (isBackgroundRefresh = false) => {
    try {
      // Only show full loading on initial load, not on background refresh
      if (!isBackgroundRefresh) {
      setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)
      const response = await authenticatedFetch("/api/creators/campaigns")
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      } else if (response.status >= 500) {
        // For server errors, show empty state instead of error for better UX
        console.log('🔍 Server error loading campaigns - showing empty state')
        if (!isBackgroundRefresh) setCampaigns([])
      } else {
        if (!isBackgroundRefresh) setError("Failed to load campaigns")
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      if (!isBackgroundRefresh) setError("Failed to load campaigns")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCampaigns(false) // Initial load
    fetchActivity() // Fetch activity data
    
    // Background refresh every 30 seconds
    const interval = setInterval(() => {
      fetchCampaigns(true) // Silent background refresh
      fetchActivity() // Also refresh activity
    }, 30000)
    
    return () => clearInterval(interval)
  }, [fetchActivity])

  const handleViewCampaign = (campaign: Campaign) => {
    router.push(`/creators/dashboard/campaigns/${campaign.id}`)
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
  // Active tab now includes both ACTIVE and SCHEDULED (upcoming shown as darkened previews)
  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'active') return campaign.status === 'ACTIVE' || campaign.status === 'SCHEDULED'
    if (filter === 'upcoming') return campaign.status === 'SCHEDULED'
    if (filter === 'completed') return campaign.status === 'COMPLETED'
    return true // 'all' shows everything
  })
  
  // Sort so ACTIVE campaigns appear first, SCHEDULED at the bottom
  const sortedFilteredCampaigns = filter === 'active' 
    ? [...filteredCampaigns].sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status === 'SCHEDULED') return -1
        if (a.status === 'SCHEDULED' && b.status === 'ACTIVE') return 1
        return 0
      })
    : filteredCampaigns

  // Count campaigns by status
  const activeCampaignsCount = campaigns.filter(c => c.status === 'ACTIVE').length
  const upcomingCampaignsCount = campaigns.filter(c => c.status === 'SCHEDULED').length
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

  return (
    <ErrorBoundary fallback={CampaignErrorFallback}>
      <div className="space-y-6 relative">

      {/* Info Notice - Floating at bottom center */}
      {showInfoNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full mx-4">
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-background border border-border rounded-lg shadow-lg text-sm">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-muted-foreground">
                Posts are generally approved within 24 hours. Tracking starts as soon as posts are submitted.
              </p>
            </div>
            <button
              onClick={dismissInfoNotice}
              className="p-1 hover:bg-muted rounded transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
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
          onClick={() => setFilter('upcoming')}
          className={`pb-2 text-sm transition-colors ${
            filter === 'upcoming' 
              ? 'text-foreground border-b-2 border-foreground -mb-px' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upcoming {upcomingCampaignsCount > 0 && `(${upcomingCampaignsCount})`}
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

      {/* Main Content with Activity Sidebar */}
      <div className="flex gap-6">
        {/* Campaigns Section */}
        <div className="flex-1 min-w-0">
      {/* Empty State */}
      {sortedFilteredCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {filter === 'active' ? 'No active campaigns right now. Check back soon.' :
             filter === 'upcoming' ? 'No upcoming campaigns scheduled.' :
             filter === 'completed' ? 'No completed campaigns yet.' :
             'No campaigns found.'}
          </p>
        </div>
      ) : (
        /* Campaigns Grid */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedFilteredCampaigns.map((campaign) => {
          // CRITICAL: Convert budget/spent to numbers for proper calculations
          // Prisma Decimal types may be serialized as strings, causing comparison bugs
          const budgetNum = Number(campaign.budget ?? 0)
          const spentNum = Number(campaign.spent ?? 0)
          
          // Calculate progress percentage with numeric values
          const progress = getProgressPercentage(spentNum, budgetNum)
          const isActive = campaign.status === "ACTIVE"
          const isScheduled = campaign.status === "SCHEDULED"
          const isLaunching = campaign.status === "DRAFT"
          const isCompleted = campaign.status === "COMPLETED"

          // Campaign runs until budget is exhausted
          const remainingBudget = budgetNum - spentNum
          const budgetText = remainingBudget > 0 ? `$${remainingBudget.toFixed(0)} left` : "Budget Full"

          return (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className={`bg-card border-border hover:shadow-xl transition-all duration-300 cursor-pointer group ${isCompleted ? 'opacity-75 border-green-500/30' : ''} ${isScheduled && filter === 'active' ? 'opacity-60' : ''}`}>
              <CardContent className="p-0">
                {/* Campaign Image */}
                <div 
                  className="relative h-48 bg-muted rounded-t-lg overflow-hidden cursor-pointer"
                  onClick={() => handleViewCampaign(campaign)}
                >
                  {isActive && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                      <Badge className="bg-foreground text-background text-xs px-2 py-1">
                        LIVE
                      </Badge>
                      {hasBonuses(campaign) && (
                        <Badge variant="outline" className="bg-background/80 text-foreground text-xs px-2 py-1 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          BOUNTIES
                        </Badge>
                      )}
                    </div>
                  )}
                  {isScheduled && (
                    <ScheduledBadge startDate={campaign.startDate} />
                  )}
                  {isLaunching && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-muted/80 text-muted-foreground border-border text-xs px-2 py-1 font-medium">
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
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                        <div className="gradient-fallback hidden w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center absolute inset-0 group-hover:scale-110 transition-transform duration-500">
                          <span className="text-white text-lg font-medium">{campaign.title}</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
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
                    <LinkifyText text={campaign.description} />
                  </p>

                  {/* Budget Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span className="font-medium">Budget Progress</span>
                      <span className="font-medium">{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
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
                      className={`flex-1 ${!isCompleted && !isLaunching && !isScheduled ? 'bg-foreground text-background hover:bg-transparent hover:text-foreground border border-foreground' : ''}`}
                      onClick={() => handleViewCampaign(campaign)}
                      disabled={isLaunching}
                      variant={isCompleted ? "secondary" : (isLaunching || isScheduled) ? "default" : "default"}
                    >
                      {isLaunching ? "Coming Soon" : isScheduled ? "Preview" : isCompleted ? "View Results" : "Join Campaign"}
                    </Button>
                    {/* Bounties button moved to campaign details page only */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )
        })}
        </div>
      )}
        </div>

        {/* Activity Sidebar - Always visible on xl screens */}
        <div className="hidden xl:block w-80 shrink-0">
          <div className="sticky top-4 space-y-4">
            {/* Stats Summary */}
            {activityData && (
              <div className="border border-border rounded-lg p-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold">{activityData.totals.totalSubmissions}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Submissions</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{activityData.totals.totalViewsGained.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Views</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">${activityData.totals.totalRemainingBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Remaining</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Creators */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5" />
                Top Creators
              </h3>
              {activityLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : activityData?.topCreators.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No creators yet</p>
              ) : (
                <div className="space-y-1">
                  {activityData?.topCreators.slice(0, 5).map((creator, index) => (
                    <div
                      key={creator.userId}
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
                    >
                      <span className="w-4 text-xs text-muted-foreground">{index + 1}.</span>
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={creator.image || undefined} />
                        <AvatarFallback className="text-[10px]">{creator.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm truncate">{creator.name || 'Anonymous'}</span>
                      <span className="text-xs text-muted-foreground">+{creator.totalViewsGained.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                Recent Activity
              </h3>
              {activityLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : activityData?.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-1">
                  {activityData?.recentActivity.slice(0, 6).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => activity.campaignId && router.push(`/creators/dashboard/campaigns/${activity.campaignId}`)}
                    >
                      <Avatar className="w-5 h-5 mt-0.5">
                        <AvatarImage src={activity.creatorImage || undefined} />
                        <AvatarFallback className="text-[8px]">{activity.creator?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="font-medium">{activity.creator}</span>
                        {' '}
                        {activity.type === 'SUBMISSION' && (
                          <span className="text-muted-foreground">submitted</span>
                        )}
                        {activity.type === 'APPROVED' && (
                          <span className="text-muted-foreground">approved</span>
                        )}
                        {activity.type === 'REJECTED' && (
                          <span className="text-muted-foreground">rejected</span>
                        )}
                        {activity.type === 'VIEW_GROWTH' && activity.viewsGained && (
                          <span className="text-muted-foreground">
                            +{activity.viewsGained.toLocaleString()}
                          </span>
                        )}
                        {activity.campaign && (
                          <p className="text-muted-foreground/70 truncate">{activity.campaign}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Bonus Modal for Featured Campaigns */}
        <CampaignBonusModal
          isOpen={bonusModalOpen}
          onClose={() => {
            setBonusModalOpen(false)
            setSelectedBountyCampaign(null)
          }}
          campaign={selectedBountyCampaign ? {
            id: selectedBountyCampaign.id,
            title: selectedBountyCampaign.title,
            totalBudget: selectedBountyCampaign.budget,
            bonusBudget: 2000,
            payoutRate: `$${selectedBountyCampaign.payoutRate} per 1,000 views`
          } : undefined}
        />
      </div>
    </ErrorBoundary>
  )
}