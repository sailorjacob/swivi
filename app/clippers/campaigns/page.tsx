"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CampaignDetailModal } from "@/components/clippers/campaign-detail-modal"
import { authenticatedFetch } from "@/lib/supabase-browser"
import {
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Instagram,
  Youtube,
  Twitter,
  Music,
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

function CampaignsPage() {
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
      } else if (response.status === 401) {
        setError("Please log in to view campaigns")
      } else if (response.status >= 500) {
        console.log('🔍 Server error loading campaigns - showing empty state')
        setCampaigns([])
        setError("Server temporarily unavailable")
      } else {
        setError("Failed to load campaigns")
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      setCampaigns([])
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
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-red-600 mb-4">{error}</p>
              <Button onClick={fetchCampaigns} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Campaigns Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id}>
              <Card className="bg-card border-border hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-0">
                  {/* Campaign Image */}
                  <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
                    {campaign.status === "ACTIVE" && (
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                          🔴 LIVE
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
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-foreground text-background text-xs">
                          P
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">Created by {campaign.creator}</span>
                    </div>

                    <h3 className="text-lg font-medium text-foreground mb-2 line-clamp-2">
                      {campaign.title}
                    </h3>

                    {/* Rate per 1000 Views */}
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Rate per 1000 Views</span>
                      <span className="text-lg font-bold text-green-500 ml-auto">
{typeof campaign.payoutRate === 'number' ? `$${campaign.payoutRate}` : campaign.payoutRate} per 1K views
                      </span>
                    </div>

                    {/* Accepted Platforms */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-muted-foreground">Accepted Platforms</span>
                      <div className="flex gap-2 ml-auto">
                        {campaign.targetPlatforms.map((platform) => {
                          const Icon = platformIcons[platform.toLowerCase() as keyof typeof platformIcons]
                          return (
                            <div key={platform} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Pool Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">Pool</span>
                        </div>
                        <span className="text-lg font-bold text-blue-500">
                          {formatCurrency(campaign.budget)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Progress
                          value={getProgressPercentage(campaign.spent, campaign.budget)}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{getProgressPercentage(campaign.spent, campaign.budget).toFixed(0)}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Join Button */}
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleJoinCampaign(campaign)}
                    >
                      Join Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
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

export default CampaignsPage
