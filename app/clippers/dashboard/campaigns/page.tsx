"use client"

import { useState } from "react"
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
  Target
} from "lucide-react"

// Real campaigns data
const campaigns = [
  {
    id: "campaign-1",
    title: "Owning Manhattan Netflix Series",
    creator: "Owning Manhattan",
    description: "Create viral clips showcasing the luxury real estate and drama from Netflix's hit series Owning Manhattan. Focus on the most engaging moments and character interactions.",
    image: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif",
    pool: 3000,
    spent: 750,
    cpm: 1.25,
    platforms: ["tiktok", "instagram", "youtube"],
    totalSubmissions: 32,
    totalViews: 850000,
    status: "live",
    deadline: "6 days left",
    progress: 25,
    requirements: [
      "Netflix series content focus",
      "0.5% minimum engagement rate", 
      "10+ seconds duration",
      "Include #OwningManhattan hashtag"
    ],
    contentSources: [
      "Season 1 Episodes 1-8 (Netflix)",
      "Behind-the-scenes footage",
      "Cast interview segments",
      "Property showcase moments"
    ]
  },
  {
    id: "campaign-2", 
    title: "Sportz Playz Betting Campaign",
    creator: "Sportz Playz",
    description: "Create engaging sports betting content and highlights. Focus on game predictions, betting tips, and exciting sports moments that drive engagement.",
    image: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png",
    pool: 2500,
    spent: 1200,
    cpm: 1.50,
    platforms: ["tiktok", "instagram", "youtube"],
    totalSubmissions: 28,
    totalViews: 1600000,
    status: "live",
    deadline: "3 days left",
    progress: 48,
    requirements: [
      "Sports/betting content focus",
      "0.5% minimum engagement rate",
      "8+ seconds duration", 
      "Include #SportzPlayz hashtag"
    ],
    contentSources: [
      "Sports highlights and analysis",
      "Betting tips and predictions",
      "Game reaction content",
      "Sports news and updates"
    ]
  },
  {
    id: "campaign-3",
    title: "Rod Khleif Real Estate Content",
    creator: "Rod Khleif",
    description: "Create educational content around real estate investing, property management, and wealth building strategies from renowned real estate expert Rod Khleif.",
    image: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/rodkhlief.avif",
    pool: 4000,
    spent: 0,
    cpm: 1.75,
    platforms: ["tiktok", "instagram", "youtube"],
    totalSubmissions: 0,
    totalViews: 0,
    status: "launching",
    deadline: "Launches in 2 days",
    progress: 0,
    requirements: [
      "Real estate education focus",
      "0.5% minimum engagement rate",
      "15+ seconds duration",
      "Educational and informative"
    ],
    contentSources: [
      "Educational videos and webinars",
      "Real estate investment case studies",
      "Property analysis content",
      "Market insights and trends"
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
                      <Badge className="bg-foreground text-background text-xs px-2 py-1">
                        LIVE
                      </Badge>
                    </div>
                  )}
                  {campaign.status === "launching" && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant="outline" className="text-muted-foreground border-muted-foreground text-xs px-2 py-1">
                        LAUNCHING SOON
                      </Badge>
                    </div>
                  )}
                  <Image
                    src={campaign.image}
                    alt={campaign.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>

                {/* Campaign Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Image
                      src={campaign.image}
                      alt={campaign.creator}
                      width={24}
                      height={24}
                      className="rounded-full object-cover ring-1 ring-border"
                      unoptimized
                    />
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
                        <span className="text-sm text-muted-foreground">${campaign.cpm} per 1K views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{campaign.deadline}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Pool: ${campaign.pool.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{campaign.totalSubmissions} submissions</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Budget Progress</span>
                        <span>${campaign.spent.toLocaleString()} / ${campaign.pool.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-foreground h-2 rounded-full transition-all duration-300"
                          style={{ width: `${campaign.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">Platforms:</span>
                    <div className="flex gap-1">
                      {campaign.platforms.map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons]
                        return (
                          <div key={platform} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                            <Icon className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Join Button */}
                  <Button 
                    className="w-full"
                    onClick={() => handleJoinCampaign(campaign)}
                    disabled={campaign.status === "launching"}
                  >
                    {campaign.status === "launching" ? "Coming Soon" : "Join Campaign"}
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