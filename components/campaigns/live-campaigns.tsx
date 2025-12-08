"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, DollarSign, Users, TrendingUp, Eye, Filter, Search, Play, ExternalLink, Calendar, Target, Globe, Loader2, Trophy, Gift } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CampaignDetailModal } from "./campaign-detail-modal"
import { CampaignBonusModal } from "./campaign-bonus-modal"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface LiveCampaign {
  id: string
  title: string
  description: string
  creator: string
  budget: number
  spent: number
  payoutRate: number
  startDate?: string
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED"
  targetPlatforms: string[]
  requirements: string[]
  createdAt: string
  featuredImage?: string
  _count: {
    submissions: number
    clipSubmissions?: number
  }
  // Additional computed fields for UI
  industry?: string
  viewGoal?: number
  viewsGenerated?: number
  duration?: string
  timeRemaining?: string
  payoutStructure?: string
  participants?: number
  maxParticipants?: number
  featured?: boolean
  difficulty?: "beginner" | "intermediate" | "advanced"
  estimatedEarnings?: { min: number; max: number }
  exampleContent?: string
  tags?: string[]
  clientLogo?: string
}

// Helper to check if a campaign has special bonuses
const hasBonuses = (campaign: LiveCampaign) => {
  return campaign.title.toLowerCase().includes('owning manhattan') && 
         campaign.title.toLowerCase().includes('season 2')
}

// Helper to check if campaign is featured/kickoff
const isFeaturedCampaign = (campaign: LiveCampaign) => {
  return campaign.budget >= 10000 && hasBonuses(campaign)
}

export function LiveCampaigns() {
  const [campaigns, setCampaigns] = useState<LiveCampaign[]>([])
  const [campaignStats, setCampaignStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedCampaign, setSelectedCampaign] = useState<LiveCampaign | null>(null)
  const [bonusModalOpen, setBonusModalOpen] = useState(false)

  // Fetch campaigns from API with better error handling
  const fetchCampaigns = async (retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus.toUpperCase())
      }

      // Fetch campaigns first (required)
      const campaignsResponse = await fetch(`/api/campaigns?${params}`)
      
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json()
        setCampaigns(campaignsData)
        setError(null) // Clear any previous errors
        
        // Fetch stats separately (optional, don't fail if this errors)
        try {
          const statsResponse = await fetch('/api/campaigns/stats')
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            setCampaignStats(statsData)
          }
        } catch (statsError) {
          // Stats are optional, don't show error for this
          console.log("Stats fetch failed (non-critical):", statsError)
        }
      } else {
        // Retry once on failure
        if (retryCount < 1) {
          console.log("Campaigns fetch failed, retrying...")
          setTimeout(() => fetchCampaigns(retryCount + 1), 1000)
          return
        }
        // Don't show error if we got a server error - just show empty state
        if (campaignsResponse.status >= 500) {
          console.log("Server error loading campaigns - showing empty state")
          setCampaigns([])
        } else {
          setError("Unable to load campaigns. Please try again.")
        }
      }
      
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      // Retry once on network error
      if (retryCount < 1) {
        console.log("Network error, retrying...")
        setTimeout(() => fetchCampaigns(retryCount + 1), 1000)
        return
      }
      // Show empty state instead of error for better UX
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [selectedStatus])

  // Auto-refresh every 5 minutes for live data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCampaigns()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Transform API data to UI format
  const transformCampaignForUI = (campaign: any): LiveCampaign => {
    // CRITICAL: Convert to numbers for proper calculations
    // Prisma Decimal types may be serialized as strings
    const budgetNum = Number(campaign.budget ?? 0)
    const spentNum = Number(campaign.spent ?? 0)
    const remainingBudget = budgetNum - spentNum
    const budgetProgress = budgetNum > 0 ? (spentNum / budgetNum) * 100 : 0
    const isBudgetFull = budgetProgress >= 100

    return {
      ...campaign,
      // Map API fields to UI fields
      creator: campaign.creator,
      budgetSpent: campaign.spent || 0,
      viewGoal: campaign.budget * 1000, // Estimate based on budget
      viewsGenerated: 0, // This would come from aggregated view tracking
      duration: isBudgetFull ? "Budget Full" : "Active",
      timeRemaining: isBudgetFull ? "Budget Full" : `$${remainingBudget.toFixed(0)} left`,
      payoutStructure: `${typeof campaign.payoutRate === 'number' ? '$' : ''}${campaign.payoutRate} per 1K views`,
      participants: campaign._count.clipSubmissions,
      maxParticipants: Math.floor(campaign.budget / campaign.payoutRate),
      featured: campaign.status === "ACTIVE" && !isBudgetFull,
      difficulty: campaign.requirements.length > 3 ? "advanced" : "beginner",
      estimatedEarnings: {
        min: campaign.payoutRate * 10,
        max: campaign.payoutRate * 50
      },
      tags: campaign.targetPlatforms,
      status: isBudgetFull ? "completed" : 
              campaign.status === "ACTIVE" ? "active" :
              campaign.status === "COMPLETED" ? "completed" : "paused"
    }
  }

  const liveCampaigns = campaigns.map(transformCampaignForUI)

  // Calculate real stats using live data
  const realTimeStats = [
    {
      icon: Target,
      label: "Active Activations",
      value: campaignStats?.summary?.totalActiveCampaigns?.toString() || campaigns.filter(c => c.status === "ACTIVE").length.toString(),
      description: "Available now"
    },
    {
      icon: Users,
      label: "Total Participants",
      value: (campaignStats?.summary?.totalSubmissions || campaigns.reduce((sum, c) => sum + c._count.clipSubmissions, 0)).toString() + "+",
      description: "Creators earning"
    },
    {
      icon: DollarSign,
      label: "Live Budgets",
      value: campaignStats?.summary?.totalBudget ? `$${(campaignStats.summary.totalBudget / 1000).toFixed(1)}K` : `$${(campaigns.reduce((sum, c) => sum + c.budget, 0) / 1000).toFixed(1)}K`,
      description: "Available payouts"
    },
    {
      icon: TrendingUp,
      label: "Views Generated",
      value: campaignStats?.summary?.totalViews ? 
        campaignStats.summary.totalViews > 1000000 ? 
          `${(campaignStats.summary.totalViews / 1000000).toFixed(1)}M` : 
          `${(campaignStats.summary.totalViews / 1000).toFixed(1)}K`
        : "Live",
      description: "Real-time tracking"
    }
  ]

  const filteredCampaigns = liveCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.creator && campaign.creator.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = selectedStatus === "all" || campaign.status === selectedStatus
    const matchesDifficulty = selectedDifficulty === "all" || campaign.difficulty === selectedDifficulty
    return matchesSearch && matchesStatus && matchesDifficulty
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  }

  const getProgressPercentage = (spent: number, total: number) => {
    return Math.min((spent / total) * 100, 100)
  }

  // Helper function to get budget spent with real-time data
  const getBudgetSpent = (campaign: LiveCampaign) => {
    const realTimeData = campaignStats?.campaigns?.find((c: any) => c.id === campaign.id)
    return realTimeData?.spent || campaign.spent || 0
  }

  // Helper function to get real-time views
  const getCampaignViews = (campaign: LiveCampaign) => {
    const realTimeData = campaignStats?.campaigns?.find((c: any) => c.id === campaign.id)
    return realTimeData?.totalViews || campaign.viewsGenerated || 0
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Target className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">Couldn't load campaigns</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchCampaigns(0)} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Subtle loading indicator */}
      {loading && (
        <div className="fixed top-4 right-4 z-50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Header */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-16"
      >
          <motion.h1
            variants={itemVariants}
            className="text-3xl md:text-4xl lg:text-5xl font-light mb-6"
          >
            Live <span className="font-normal">Activations</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8"
          >
            Join active brand activations and start earning immediately. Create viral content for top brands 
            and track your progress in real-time.
          </motion.p>
      </motion.div>

      {/* Featured Campaign Hero */}
      {liveCampaigns.find(c => isFeaturedCampaign(c) && c.status === "active") && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-xl border border-border bg-card">
            <div className="relative p-8 md:p-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-muted">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <Badge className="bg-foreground text-background text-xs px-3 py-1">
                      LIVE
                    </Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    Owning Manhattan Season 2
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl">
                    Season 2 is LIVE on Netflix! Post clips, drive views, and earn $1 per 1,000 views automatically. 
                    Plus $2,000 in bounties for performance-based bonuses.
                  </p>
                  
                  {/* Key Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold">$20K</div>
                      <p className="text-xs text-muted-foreground">Total Budget</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold flex items-center justify-center gap-1">
                        <Gift className="w-5 h-5" />
                        $2K
                      </div>
                      <p className="text-xs text-muted-foreground">In Bounties</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold">$1</div>
                      <p className="text-xs text-muted-foreground">Per 1K Views</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold">3</div>
                      <p className="text-xs text-muted-foreground">Platforms</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" asChild>
                      <Link href="/creators/signup">
                        Start Earning Now
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => setBonusModalOpen(true)}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      View Bounties
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Stats - Hidden */}
      {/*
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-12"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {realTimeStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="text-center"
            >
              <stat.icon className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <div className="text-2xl md:text-3xl font-light mb-1">{stat.value}</div>
              <div className="text-sm font-normal mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Campaign Cards - Redesigned to match modal style */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-12"
      >
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {filteredCampaigns.map((campaign) => {
            const budgetNum = Number(campaign.budget ?? 0)
            const spentNum = Number(campaign.spent ?? 0)
            const remainingBudget = budgetNum - spentNum
            const progressPercent = budgetNum > 0 ? Math.min((spentNum / budgetNum) * 100, 100) : 0
            const participantCount = campaign.participants || campaign._count?.clipSubmissions || campaign._count?.submissions || 0
            
            const formatCurrency = (amount: number) => {
              if (amount >= 1000) {
                return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`
              }
              return `$${amount.toLocaleString()}`
            }

            return (
              <motion.div
                key={campaign.id}
                variants={itemVariants}
                className="group"
              >
                <div className="h-full bg-card border border-border rounded-xl overflow-hidden transition-all duration-150 ease-out hover:border-foreground/20 hover:shadow-lg">
                  {/* Featured Image Header */}
                  <div className="relative h-32 sm:h-36 bg-gradient-to-br from-foreground/5 via-foreground/10 to-foreground/5 overflow-hidden">
                    {campaign.featuredImage ? (
                      <Image
                        src={campaign.featuredImage}
                        alt={campaign.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-foreground/5 blur-2xl" />
                      </div>
                    )}
                    
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-foreground text-background text-[10px] px-2.5 py-1 font-medium">
                        <span className="w-1.5 h-1.5 bg-background rounded-full mr-1.5 animate-pulse" />
                        {campaign.status === "ACTIVE" || campaign.status === "active" ? "LIVE" : campaign.status}
                      </Badge>
                    </div>

                    {/* Bounties Badge */}
                    {hasBonuses(campaign) && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="bg-card/80 backdrop-blur-sm text-foreground text-[10px] px-2.5 py-1">
                          <Trophy className="w-3 h-3 mr-1" />
                          BOUNTIES
                        </Badge>
                      </div>
                    )}

                    {/* Title overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                        {campaign.creator}
                      </p>
                      <h3 className="text-base sm:text-lg font-medium text-foreground leading-tight">
                        {campaign.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4">
                    {/* Description - truncated */}
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4 line-clamp-2">
                      {campaign.description}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-muted/50 text-center">
                        <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm sm:text-base font-semibold">{formatCurrency(budgetNum)}</div>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">Budget</p>
                      </div>
                      <div className="p-2 sm:p-2.5 rounded-lg bg-muted/50 text-center">
                        <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm sm:text-base font-semibold">${campaign.payoutRate}</div>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">Per 1K</p>
                      </div>
                      <div className="p-2 sm:p-2.5 rounded-lg bg-muted/50 text-center">
                        <Users className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm sm:text-base font-semibold">{participantCount}</div>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">Creators</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex justify-between text-[10px] sm:text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{formatCurrency(remainingBudget)} left</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 overflow-hidden">
                        <div
                          className="bg-foreground h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Platforms */}
                    {campaign.targetPlatforms && campaign.targetPlatforms.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-3 sm:mb-4">
                        {campaign.targetPlatforms.map((platform) => (
                          <span 
                            key={platform} 
                            className="px-2 py-0.5 text-[9px] sm:text-[10px] bg-muted rounded-full capitalize"
                          >
                            {platform.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTA Buttons - Snappy hover effects */}
                    <div className="flex gap-2">
                      <Link 
                        href="/creators/signup"
                        className="flex-1 h-10 sm:h-9 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium bg-foreground text-background overflow-hidden transition-all duration-150 ease-out active:scale-[0.98] hover:opacity-90"
                      >
                        Join Campaign
                      </Link>
                      {hasBonuses(campaign) && (
                        <button 
                          onClick={() => setBonusModalOpen(true)}
                          className="h-10 sm:h-9 px-3 flex items-center justify-center rounded-full text-xs font-medium border border-foreground text-foreground transition-all duration-150 ease-out active:scale-[0.98] hover:bg-foreground hover:text-background"
                        >
                          <Trophy className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedCampaign(campaign)}
                        className="h-10 sm:h-9 px-3 flex items-center justify-center rounded-full text-xs font-medium border border-foreground text-foreground transition-all duration-150 ease-out active:scale-[0.98] hover:bg-foreground hover:text-background"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-8"
        >
          {/* Illustration */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-foreground/10 rounded-2xl" />
            <div className="absolute inset-4 border-2 border-dashed border-foreground/20 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-foreground/10 flex items-center justify-center">
                  <Target className="w-8 h-8 text-foreground/40" />
                </div>
                <div className="flex gap-1 justify-center">
                  <div className="w-2 h-2 rounded-full bg-foreground/20" />
                  <div className="w-2 h-2 rounded-full bg-foreground/30" />
                  <div className="w-2 h-2 rounded-full bg-foreground/20" />
                </div>
              </div>
            </div>
          </div>
          <h3 className="text-xl font-medium mb-2">No campaigns found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            New brand activations are coming soon! Join our Discord to be the first to know when campaigns go live.
          </p>
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className={`text-center ${filteredCampaigns.length === 0 ? 'mt-4' : 'mt-16'}`}
      >
        <motion.div
          variants={itemVariants}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-2xl md:text-3xl font-light mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join our Discord community to get access to all live campaigns, 
            connect with other creators, and start building your earnings today.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link href="https://discord.gg/CtZ4tecJ7Y" target="_blank">
                <Users className="mr-2 h-4 w-4" />
                Join Discord Community
              </Link>
            </Button>
          </div>
        </motion.div>
      </motion.section>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}

      {/* Bonus Modal */}
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
  )
}
