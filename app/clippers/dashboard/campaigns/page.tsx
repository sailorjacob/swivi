"use client"

import { useState, useEffect } from "react"
import { supabase, authenticatedFetch } from "@/lib/supabase-auth"
import { motion } from "framer-motion"
import { Card, CardContent } from "../../../../components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { Button } from "../../../../components/ui/button"
import { Progress } from "../../../../components/ui/progress"
import { CampaignDetailModal } from "../../../../components/clippers/campaign-detail-modal"
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
  Loader2
} from "lucide-react"

interface Campaign {
  id: string
  title: string
  description: string
  creator: string
  budget: number
  spent: number
  payoutRate: number
  deadline: string
  startDate?: string
  status: string
  targetPlatforms: string[]
  requirements: string[]
  createdAt: string
  _count: {
    submissions: number
  }
}

const platformIcons = {
  tiktok: Music,
  instagram: Instagram, 
  youtube: Youtube,
  twitter: Twitter,
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await authenticatedFetch("/api/clippers/campaigns")
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
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
      image: "", // We don't have image in current schema
      pool: Number(campaign.budget),
      spent: Number(campaign.spent),
      cpm: Number(campaign.payoutRate), // Payout rate per 1K views
      platforms: campaign.targetPlatforms,
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-foreground">Active Campaigns</h1>
        <p className="text-muted-foreground mt-2">
          Join campaigns and start earning from your content
        </p>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map((campaign) => {
          // Calculate progress percentage
          const progress = getProgressPercentage(campaign.spent, campaign.budget)
          const isActive = campaign.status === "ACTIVE"
          const isLaunching = campaign.status === "DRAFT"

          // Calculate days until deadline
          const deadlineDate = new Date(campaign.deadline)
          const now = new Date()
          const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          const deadlineText = daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : "Ended"

          return (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-card border-border hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-0">
                {/* Campaign Image */}
                <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
                  {isActive && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-foreground text-background text-xs px-2 py-1">
                        LIVE
                      </Badge>
                    </div>
                  )}
                  {isLaunching && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30 text-xs px-2 py-1 font-medium">
                        LAUNCHING SOON
                      </Badge>
                    </div>
                  )}
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-lg font-medium">{campaign.title}</span>
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

                  {/* Key Metrics */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">${campaign.payoutRate} per 1K views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{deadlineText}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Pool: ${formatCurrency(campaign.budget)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{campaign._count.clipSubmissions} submissions</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Budget Progress</span>
                        <span>${formatCurrency(campaign.spent)} / ${formatCurrency(campaign.budget)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-foreground h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
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

                  {/* Join Button */}
                  <Button
                    className="w-full"
                    onClick={() => handleJoinCampaign(campaign)}
                    disabled={isLaunching}
                  >
                    {isLaunching ? "Coming Soon" : "Join Campaign"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )
        })}
      </div>

      {/* Campaign Detail Modal */}
      <CampaignDetailModal
        campaign={selectedCampaign ? transformCampaignForModal(selectedCampaign) : null}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}