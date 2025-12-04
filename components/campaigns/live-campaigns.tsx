"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, DollarSign, Users, TrendingUp, Eye, Filter, Search, Play, ExternalLink, Calendar, Target, Globe, Loader2, Trophy, Flame, Sparkles, Gift } from "lucide-react"
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
  _count: {
    submissions: number
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

  // Fetch campaigns from API
  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus.toUpperCase())
      }

      // Fetch both campaigns and real-time stats
      const [campaignsResponse, statsResponse] = await Promise.all([
        fetch(`/api/campaigns?${params}`),
        fetch('/api/campaigns/stats')
      ])
      
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json()
        setCampaigns(campaignsData)
      } else {
        setError("Failed to load campaigns")
      }
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setCampaignStats(statsData)
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
    const remainingBudget = campaign.budget - (campaign.spent || 0)
    const budgetProgress = campaign.budget > 0 ? ((campaign.spent || 0) / campaign.budget) * 100 : 0
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
      description: "Clippers earning"
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
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <Button onClick={fetchCampaigns} variant="outline">
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
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y5NzMxNiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
            <div className="relative p-8 md:p-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                      <Flame className="w-7 h-7 text-amber-500" />
                    </div>
                    <Badge className="bg-red-500 text-white text-xs px-3 py-1 animate-pulse">
                      🔥 LIVE NOW — BIGGEST EVER
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
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
                      <div className="text-2xl font-bold text-foreground">$20K</div>
                      <p className="text-xs text-muted-foreground">Total Budget</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                        <Gift className="w-5 h-5" />
                        $2K
                      </div>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/80">In Bounties</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
                      <div className="text-2xl font-bold text-foreground">$1</div>
                      <p className="text-xs text-muted-foreground">Per 1K Views</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
                      <div className="text-2xl font-bold text-foreground">3</div>
                      <p className="text-xs text-muted-foreground">Platforms</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" asChild>
                      <Link href="/clippers/signup">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Earning Now
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => setBonusModalOpen(true)}
                      className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      View $2K Bounties
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

      {/* Campaign Cards */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-12"
      >
        <div className="grid md:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`h-full hover:shadow-lg transition-shadow duration-300 ${hasBonuses(campaign) ? 'border-amber-500/30' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl font-normal">
                          {campaign.title}
                        </CardTitle>
                        {hasBonuses(campaign) && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                            <Trophy className="w-3 h-3 mr-1" />
                            BONUSES
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        {campaign.clientLogo && (
                          <div className="flex-shrink-0">
                            <Image
                              src={campaign.clientLogo || ""}
                              alt={campaign.creator}
                              width={28}
                              height={28}
                              className="rounded-md object-cover ring-1 ring-black/10"
                              unoptimized
                            />
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {campaign.creator} • Entertainment
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {campaign.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Budget Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span className="font-medium">Budget Progress</span>
                      <span className="font-medium">${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-foreground h-3 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(getBudgetSpent(campaign), campaign.budget)}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Payout:</span>
                        <span className="text-xs font-medium">{campaign.payoutStructure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Duration:</span>
                        <span className="text-xs font-medium">{campaign.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Participants:</span>
                        <span className="text-xs font-medium">
                          {campaign.participants}{campaign.maxParticipants && `/${campaign.maxParticipants}`}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Potential:</span>
                        <span className="text-xs font-medium">
                          {campaign.estimatedEarnings ? `$${campaign.estimatedEarnings.min}-$${campaign.estimatedEarnings.max}` : "TBD"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Time Left:</span>
                        <span className="text-xs font-medium">{campaign.timeRemaining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Views Goal:</span>
                        <span className="text-xs font-medium">
                          {campaign.viewGoal ? `${(campaign.viewGoal / 1000000).toFixed(1)}M` : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>



                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={campaign.status === "DRAFT"}
                      asChild
                    >
                      <Link href="/clippers/signup">
                        {campaign.status === "DRAFT" ? "Coming Soon" : "Join Campaign"}
                      </Link>
                    </Button>
                    {hasBonuses(campaign) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setBonusModalOpen(true)}
                        className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600"
                      >
                        <Trophy className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {campaign.exampleContent && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={campaign.exampleContent} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search terms to find more campaigns.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm("")
              setSelectedStatus("all")
              setSelectedDifficulty("all")
            }}
          >
            Clear All Filters
          </Button>
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center mt-16"
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
            connect with other clippers, and start building your earnings today.
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
