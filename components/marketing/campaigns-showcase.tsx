"use client"

import { motion } from "framer-motion"
import { ExternalLink, TrendingUp, Users, DollarSign, Clock, Play, Award, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

interface CampaignResult {
  id: string
  clientName: string
  clientType: string
  description: string
  budget: number
  budgetStructure: string
  goal: string
  timeline: string
  clipsDistributed: number
  clipsPaid: number
  viewsGenerated: number
  roi: number
  exampleContent: string
  contentPlatform: "instagram" | "tiktok" | "youtube"
  status: "completed" | "ongoing"
  highlights: string[]
  clientLogo?: string
}

const campaignResults: CampaignResult[] = [
  {
    id: "owning-manhattan",
    clientName: "Owning Manhattan",
    clientType: "Entertainment",
    description: "Netflix series promotion campaign targeting real estate and lifestyle audiences",
    budget: 1000,
    budgetStructure: "$1 per 1,000 views",
    goal: "1,000,000 views",
    timeline: "2 days",
    clipsDistributed: 60,
    clipsPaid: 49,
    viewsGenerated: 6100000,
    roi: 610,
    exampleContent: "https://www.instagram.com/reel/DOKGK_ciO-9/",
    contentPlatform: "instagram",
    status: "completed",
    highlights: [
      "6.1M views generated",
      "Completed in just 2 days",
      "81.7% clip success rate",
      "$1K budget delivered"
    ],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif"
  },
  {
    id: "rod-khlief",
    clientName: "Rod Khlief",
    clientType: "Real Estate Educator",
    description: "Real estate education and investment content targeting property investors and aspiring entrepreneurs",
    budget: 750,
    budgetStructure: "$1 per 1,000 views",
    goal: "750,000 views",
    timeline: "3 days",
    clipsDistributed: 85,
    clipsPaid: 68,
    viewsGenerated: 1800000,
    roi: 240,
    exampleContent: "https://www.instagram.com/reel/example-rod-khlief/",
    contentPlatform: "instagram",
    status: "completed",
    highlights: [
      "1.8M views generated",
      "80% clip success rate",
      "3-day timeline",
      "Real estate education focus"
    ],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/rodkhlief.avif"
  },
  {
    id: "shvfty",
    clientName: "Shvfty",
    clientType: "Twitch Streamer",
    description: "Gaming content creator looking to expand reach across short-form platforms",
    budget: 900,
    budgetStructure: "$1 per 1,000 views",
    goal: "900,000 views",
    timeline: "5 days",
    clipsDistributed: 258,
    clipsPaid: 155,
    viewsGenerated: 1900000,
    roi: 211,
    exampleContent: "https://www.tiktok.com/@shvftysclips/video/7521097192539557151",
    contentPlatform: "tiktok",
    status: "completed",
    highlights: [
      "1.9M views generated",
      "258 clips distributed",
      "60% clip success rate",
      "5-day timeline"
    ],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/shvty.jpeg"
  },
  {
    id: "sportz-playz",
    clientName: "Sportz Playz",
    clientType: "Gambling Company",
    description: "Sports betting platform targeting sports enthusiasts and betting communities",
    budget: 250,
    budgetStructure: "$100 per 1,000,000 views",
    goal: "2.5M views",
    timeline: "2 weeks",
    clipsDistributed: 98,
    clipsPaid: 51,
    viewsGenerated: 8100000,
    roi: 3240,
    exampleContent: "https://www.instagram.com/reel/DNVx_F0OKAx/",
    contentPlatform: "instagram",
    status: "completed",
    highlights: [
      "8.1M views generated",
      "$250 budget delivered",
      "2-week timeline",
      "Exceeded goal by 224%"
    ],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png"
  }
]

const industryStats = [
  {
    icon: TrendingUp,
    label: "Success Rate",
    value: "94%",
    description: "Campaign completion"
  },
  {
    icon: Users,
    label: "Total Views",
    value: "16M+",
    description: "Generated for clients"
  },
  {
    icon: DollarSign,
    label: "Total Budget",
    value: "$2,150",
    description: "Client investment"
  },
  {
    icon: Clock,
    label: "Avg. Timeline",
    value: "6 days",
    description: "Campaign completion"
  }
]

const industries = [
  "Entertainment",
  "Twitch Streamers",
  "Music Collaborations",
  "Content Creators",
  "Musicians",
  "Entrepreneurs",
  "Tech Startups",
  "E-commerce Brands",
  "Athletes"
]

interface CampaignsShowcaseProps {
  showHeader?: boolean;
}

export function CampaignsShowcase({ showHeader = true }: CampaignsShowcaseProps) {
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

  const getCampaignIcon = (campaign: CampaignResult) => {
    // Return relevant emoji based on campaign content
    if (campaign.clientName.toLowerCase().includes("owning")) {
      return "🎬" // Film/movie for TV series (Owning Manhattan)
    }
    if (campaign.clientName.toLowerCase().includes("rod")) {
      return "📷" // Camera for real estate educator
    }
    if (campaign.clientName.toLowerCase().includes("shvfty")) {
      return "🎮" // Gaming for Twitch streamer
    }
    if (campaign.clientName.toLowerCase().includes("sportz")) {
      return "⚽" // Sports for gambling/sports betting
    }

    // Default based on platform
    switch (campaign.contentPlatform) {
      case "instagram":
        return "📸"
      case "tiktok":
        return "🎵"
      case "youtube":
        return "📺"
      default:
        return "🎬"
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`
    }
    return num.toString()
  }

  return (
    <div className="w-full">
      {/* Header - conditionally shown */}
      {showHeader && (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-20"
      >
        <motion.h1
          variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-light mb-8 text-foreground"
        >
            Proven <span className="font-normal text-foreground">Campaign Results</span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-xl text-neutral-300 max-w-4xl mx-auto mb-12 leading-relaxed"
        >
          We work with creators across all niches, from entrepreneurs and content creators
            to musicians, TV series, and athletes. Here are some of our most successful campaigns.
        </motion.p>
      </motion.div>
      )}


      {/* Campaign Results */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-20"
      >
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-light mb-6 text-center text-foreground">
            Featured Campaign Results
          </h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto text-lg leading-relaxed">
            Featured campaigns
          </p>
        </div>

        <div className="space-y-8">
          {campaignResults.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              variants={itemVariants}
              className="relative"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-neutral-900/40 border-neutral-800/50">
                <CardHeader className="border-b border-neutral-800/30 pb-8">
                  <div className="flex items-center gap-8 mb-6">
                        {campaign.clientLogo && (
                          <div className="flex-shrink-0">
                            <Image
                              src={campaign.clientLogo}
                              alt={campaign.clientName}
                              width={280}
                              height={280}
                              className="rounded-xl object-cover ring-2 ring-neutral-800/40 shadow-lg"
                              unoptimized
                            />
                          </div>
                        )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3">
                        <CardTitle className="text-3xl font-light text-foreground">
                          {campaign.clientName}
                        </CardTitle>
                        <span className="text-4xl opacity-60">{getCampaignIcon(campaign)}</span>
                      </div>
                      <p className="text-neutral-300 leading-relaxed text-lg">
                        {campaign.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8">
                  {/* Key Metrics - Large and Prominent */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="text-center p-8 bg-neutral-800/30 rounded-xl border border-neutral-700/30">
                      <div className="text-4xl md:text-5xl font-light text-foreground mb-3">
                        {formatNumber(campaign.viewsGenerated)}
                      </div>
                      <div className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                        Views Generated
                      </div>
                    </div>
                    <div className="text-center p-8 bg-neutral-800/30 rounded-xl border border-neutral-700/30">
                      <div className="text-4xl md:text-5xl font-light text-foreground mb-3">
                        {Math.round((campaign.clipsPaid / campaign.clipsDistributed) * 100)}%
                      </div>
                      <div className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                        Success Rate
                      </div>
                    </div>
                  </div>

                  {/* Campaign Details - Condensed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                      <h4 className="font-medium text-neutral-400 uppercase tracking-wider text-sm">
                        Campaign Overview
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-neutral-700/30">
                          <span className="text-neutral-400">Budget:</span>
                          <span className="font-medium text-foreground">${campaign.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-neutral-700/30">
                          <span className="text-neutral-400">Timeline:</span>
                          <span className="font-medium text-foreground">{campaign.timeline}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-neutral-400">Success Rate:</span>
                          <span className="font-medium text-green-400">
                            {Math.round((campaign.clipsPaid / campaign.clipsDistributed) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-neutral-400 uppercase tracking-wider text-sm">
                        Key Highlights
                      </h4>
                      <div className="space-y-3">
                        {campaign.highlights.slice(0, 3).map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-neutral-800/30 rounded-lg border border-neutral-700/30">
                            <Award className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-neutral-300 leading-relaxed">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-700/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <Link
                      href={campaign.exampleContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-neutral-300 hover:text-foreground transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      View Example Content
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {/* View Full Gallery button temporarily hidden */}
                    {/* {campaign.id === "owning-manhattan" && (
                      <Link
                        href="/case-studies/owning-manhattan"
                        className="inline-flex items-center gap-2 text-sm font-medium bg-white text-black px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View Full Gallery
                      </Link>
                    )} */}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Industries Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light mb-6 text-white">
            Industries We Serve
          </h2>
          <p className="text-neutral-300 max-w-3xl mx-auto text-lg leading-relaxed">
            From entertainment to tech, we help brands and creators across all industries
            achieve viral success through our clipper network.
          </p>
        </div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {industries.map((industry, index) => (
            <div
              key={index}
              className="p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/30 text-center hover:bg-neutral-800/40 transition-colors"
            >
              <span className="text-neutral-300 font-medium">{industry}</span>
            </div>
          ))}
        </motion.div>
      </motion.section>

    </div>
  )
}
