"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { 
  X, 
  Trophy, 
  DollarSign, 
  Users,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Eye,
  Play,
  Clock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FeaturedCampaign {
  id: string
  title: string
  description: string
  creator: string
  budget: number
  spent: number
  payoutRate: number
  status: string
  featuredImage?: string
  targetPlatforms: string[]
  _count?: {
    clipSubmissions: number
  }
}

interface CampaignStats {
  totalViews?: number
  totalSubmissions?: number
  budgetProgress?: number
}

interface FeaturedCampaignModalProps {
  campaign?: FeaturedCampaign | null
  stats?: CampaignStats | null
  isOpen: boolean
  onClose: () => void
}

const STORAGE_KEY = "swivi-featured-campaign-dismissed"
const DISMISS_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export function FeaturedCampaignModal({ 
  campaign, 
  stats,
  isOpen, 
  onClose 
}: FeaturedCampaignModalProps) {
  
  if (!isOpen || !campaign) return null

  const budgetNum = Number(campaign.budget ?? 0)
  const spentNum = Number(campaign.spent ?? 0)
  const remainingBudget = budgetNum - spentNum
  const progressPercent = budgetNum > 0 ? Math.min((spentNum / budgetNum) * 100, 100) : 0
  const participantCount = campaign._count?.clipSubmissions || stats?.totalSubmissions || 0
  
  // Determine if this is a high-value campaign
  const isHighValue = budgetNum >= 10000
  const hasBounties = campaign.title.toLowerCase().includes('season 2') && 
                      campaign.title.toLowerCase().includes('owning manhattan')

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal - Mobile: slide up from bottom, Desktop: centered */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Close Button - Larger touch target on mobile */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2.5 sm:p-2 rounded-full sm:rounded-lg bg-background/80 hover:bg-muted transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>

            {/* Scrollable Content Container */}
            <div className="overflow-y-auto flex-1">
              {/* Featured Image or Gradient Header */}
              <div className="relative h-28 sm:h-32 bg-gradient-to-br from-foreground/5 via-foreground/10 to-foreground/5 overflow-hidden flex-shrink-0">
                {campaign.featuredImage ? (
                  <Image
                    src={campaign.featuredImage}
                    alt={campaign.title}
                    fill
                    className="object-cover opacity-50"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 6, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-foreground/5 blur-2xl"
                    />
                  </div>
                )}
                
                {/* Live Badge */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                  <Badge className="bg-foreground text-background text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-background rounded-full mr-1.5 sm:mr-2 animate-pulse" />
                    LIVE NOW
                  </Badge>
                </div>

                {/* Bounties Badge */}
                {hasBounties && (
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] sm:text-xs px-2.5 sm:px-3 py-1">
                      <Trophy className="w-3 h-3 mr-1 sm:mr-1.5" />
                      $2K IN BOUNTIES
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="mb-3 sm:mb-4">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                    Featured Campaign
                  </p>
                  <h2 className="text-lg sm:text-xl font-medium mb-1 pr-8">
                    {campaign.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    by {campaign.creator}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 sm:mb-5 line-clamp-2">
                  {campaign.description}
                </p>

                {/* Stats Grid - Responsive sizing */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 text-center">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-1 sm:mb-1.5 text-muted-foreground" />
                    <div className="text-base sm:text-lg font-semibold">{formatCurrency(budgetNum)}</div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">Budget</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 text-center">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-1 sm:mb-1.5 text-muted-foreground" />
                    <div className="text-base sm:text-lg font-semibold">${campaign.payoutRate}</div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">Per 1K</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 text-center">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-1 sm:mb-1.5 text-muted-foreground" />
                    <div className="text-base sm:text-lg font-semibold">{participantCount}</div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">Creators</p>
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex justify-between text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                    <span className="text-muted-foreground">Campaign Progress</span>
                    <span className="font-medium">{formatCurrency(remainingBudget)} left</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                      className="bg-foreground h-1.5 sm:h-2 rounded-full"
                    />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 sm:mt-1.5">
                    {progressPercent.toFixed(0)}% distributed to creators
                  </p>
                </div>

                {/* Platforms */}
                {campaign.targetPlatforms && campaign.targetPlatforms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Platforms:</span>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {campaign.targetPlatforms.map((platform) => (
                        <span 
                          key={platform} 
                          className="px-2 py-0.5 text-[9px] sm:text-[10px] bg-muted rounded-full capitalize"
                        >
                          {platform.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Buttons - Larger touch targets on mobile, snappy hover effects */}
                <div className="flex flex-col gap-2 sm:gap-2">
                  <Link 
                    href="/creators/signup"
                    className="group relative w-full h-12 sm:h-11 flex items-center justify-center rounded-full text-sm sm:text-base font-medium bg-foreground text-background overflow-hidden transition-transform duration-150 ease-out active:scale-[0.98]"
                  >
                    <span className="absolute inset-0 bg-background/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out" />
                    <span className="relative flex items-center">
                      Start Earning Now
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-150 ease-out group-hover:translate-x-1" />
                    </span>
                  </Link>
                  <Link 
                    href="/activations"
                    className="group relative w-full h-11 sm:h-10 flex items-center justify-center rounded-full text-sm sm:text-base font-medium border border-foreground text-foreground overflow-hidden transition-transform duration-150 ease-out active:scale-[0.98]"
                  >
                    <span className="absolute inset-0 bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform duration-150 ease-out origin-left" />
                    <span className="relative flex items-center transition-colors duration-150 ease-out group-hover:text-background">
                      <Eye className="w-4 h-4 mr-2" />
                      View All Campaigns
                    </span>
                  </Link>
                </div>

                {/* Footer Note */}
                <p className="text-[9px] sm:text-[10px] text-center text-muted-foreground mt-3 sm:mt-4 pb-2 sm:pb-0">
                  Create viral content and earn real money. Payouts tracked automatically.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Demo campaign for when no real data is available
const DEMO_CAMPAIGN: FeaturedCampaign = {
  id: "demo",
  title: "Owning Manhattan Season 2",
  description: "Season 2 is LIVE on Netflix! Post clips, drive views, and earn $1 per 1,000 views automatically. Plus $2,000 in bounties for performance-based bonuses.",
  creator: "Netflix",
  budget: 20000,
  spent: 4500,
  payoutRate: 1,
  status: "ACTIVE",
  targetPlatforms: ["TIKTOK", "INSTAGRAM", "YOUTUBE"],
  _count: {
    clipSubmissions: 47
  }
}

// Hook to manage the featured campaign modal state with localStorage persistence
export function useFeaturedCampaignModal(enableDemoMode = true) {
  const [isOpen, setIsOpen] = useState(false)
  const [campaign, setCampaign] = useState<FeaturedCampaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the modal recently
    const checkDismissed = () => {
      if (typeof window === 'undefined') return true
      
      const dismissedAt = localStorage.getItem(STORAGE_KEY)
      if (!dismissedAt) return false
      
      const dismissedTime = parseInt(dismissedAt, 10)
      const now = Date.now()
      
      // If more than 24 hours have passed, show again
      if (now - dismissedTime > DISMISS_DURATION) {
        localStorage.removeItem(STORAGE_KEY)
        return false
      }
      
      return true
    }

    const fetchFeaturedCampaign = async () => {
      try {
        // Fetch active campaigns
        const response = await fetch('/api/campaigns?status=ACTIVE')
        
        if (response.ok) {
          const campaigns = await response.json()
          
          if (campaigns && campaigns.length > 0) {
            // Find the featured campaign (highest budget active campaign with bounties, or just highest budget)
            const featured = campaigns.find((c: FeaturedCampaign) => 
              c.title.toLowerCase().includes('owning manhattan') &&
              c.title.toLowerCase().includes('season 2') &&
              c.status === 'ACTIVE'
            ) || campaigns.find((c: FeaturedCampaign) => 
              c.budget >= 10000 && c.status === 'ACTIVE'
            ) || campaigns[0]

            if (featured) {
              setCampaign(featured)
              setIsDemo(false)
              
              // Fetch stats for this campaign
              try {
                const statsResponse = await fetch(`/api/campaigns/stats?campaignId=${featured.id}`)
                if (statsResponse.ok) {
                  const statsData = await statsResponse.json()
                  setStats(statsData.campaign || null)
                }
              } catch (e) {
                // Stats are optional
              }

              // Only show modal if not recently dismissed
              if (!checkDismissed()) {
                setTimeout(() => setIsOpen(true), 1500)
              }
              return
            }
          }
        }
        
        // Fall back to demo mode if enabled and no campaigns found
        if (enableDemoMode) {
          setCampaign(DEMO_CAMPAIGN)
          setIsDemo(true)
          
          if (!checkDismissed()) {
            setTimeout(() => setIsOpen(true), 1500)
          }
        }
      } catch (error) {
        console.error('Error fetching featured campaign:', error)
        
        // Fall back to demo mode on error
        if (enableDemoMode) {
          setCampaign(DEMO_CAMPAIGN)
          setIsDemo(true)
          
          if (!checkDismissed()) {
            setTimeout(() => setIsOpen(true), 1500)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedCampaign()
  }, [enableDemoMode])

  const close = () => {
    setIsOpen(false)
    // Save dismissal timestamp
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    }
  }

  const open = () => {
    setIsOpen(true)
  }

  // Force reset the dismissal (useful for testing)
  const reset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    if (campaign) {
      setIsOpen(true)
    }
  }

  return {
    isOpen,
    campaign,
    stats,
    isLoading,
    isDemo,
    open,
    close,
    reset,
  }
}

