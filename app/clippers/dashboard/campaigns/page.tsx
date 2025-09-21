"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CampaignDetailModal } from "@/components/clippers/campaign-detail-modal"
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  Instagram,
  Youtube,
  Twitter,
  Music
} from "lucide-react"

// Real campaigns data
const campaigns = [
  {
    id: "1",
    title: "Owning Manhattan Viral Clips",
    creator: "Swivi Media",
    description: "Create engaging clips from Owning Manhattan episodes highlighting the most dramatic and entertaining moments. Focus on luxury real estate, personal drama, and behind-the-scenes content.",
    image: "/owning-manhattan.jpg",
    pool: 8000,
    spent: 2100,
    cpm: 3.5,
    platforms: ["tiktok", "instagram"],
    totalSubmissions: 12,
    totalViews: 89420,
    status: "live",
    requirements: [
      "Use official Owning Manhattan episode content",
      "Focus on high-drama moments and luxury showcases",
      "Keep clips 15-60 seconds for maximum engagement",
      "Include relevant hashtags and mentions",
      "Maintain professional editing quality"
    ],
    contentSources: [
      "Season 1 Episodes 1-8 (Netflix)",
      "Behind-the-scenes footage",
      "Cast interview segments",
      "Property showcase moments"
    ]
  },
  {
    id: "2", 
    title: "Music Discovery Hub",
    creator: "Swivi Media",
    description: "Promote emerging artists and new music releases through creative short-form content. Help artists gain exposure while earning from viral music clips.",
    image: "/music-hub.jpg",
    pool: 12000,
    spent: 890,
    cpm: 2.8,
    platforms: ["tiktok", "instagram", "youtube"],
    totalSubmissions: 6,
    totalViews: 34200,
    status: "live",
    requirements: [
      "Feature provided music tracks prominently",
      "Create engaging visual content to match the music",
      "Use proper artist credits and tags",
      "Focus on hook/chorus sections for maximum impact",
      "Maintain high audio quality"
    ],
    contentSources: [
      "Featured artist tracks (provided monthly)",
      "Music video footage",
      "Artist promotional materials",
      "Lyric graphics and visualizers"
    ]
  }
]

const platformIcons = {
  tiktok: Music,
  instagram: Instagram, 
  youtube: Youtube,
  twitter: Twitter,
}

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<typeof campaigns[0] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleJoinCampaign = (campaign: typeof campaigns[0]) => {
    setSelectedCampaign(campaign)
    setModalOpen(true)
  }

  const getProgressPercentage = (spent: number, pool: number) => {
    return pool > 0 ? (spent / pool) * 100 : 0
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
        {campaigns.map((campaign) => (
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
                  {campaign.status === "live" && (
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
                      ${campaign.cpm}
                    </span>
                  </div>

                  {/* Accepted Platforms */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">Accepted Platforms</span>
                    <div className="flex gap-2 ml-auto">
                      {campaign.platforms.map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons]
                        return (
                          <div key={platform} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="w-4 h-4 text-muted-foreground" />
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
                        {formatCurrency(campaign.pool)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress 
                        value={getProgressPercentage(campaign.spent, campaign.pool)} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{getProgressPercentage(campaign.spent, campaign.pool).toFixed(0)}%</span>
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
          </motion.div>
        ))}
      </div>

      {/* Campaign Detail Modal */}
      <CampaignDetailModal
        campaign={selectedCampaign}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}