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
    budget: 968,
    budgetStructure: "$100 per 100,000 views",
    goal: "6,700,000 views",
    timeline: "2 days",
    clipsDistributed: 60,
    clipsPaid: 60,
    viewsGenerated: 6700000,
    roi: 593,
    exampleContent: "https://www.instagram.com/reel/DOKGK_ciO-9/",
    contentPlatform: "instagram",
    status: "completed",
    highlights: [
      "6.7M views generated",
      "Completed in just 2 days",
      "60 clips submitted",
      "$968 budget delivered"
    ],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif"
  },
  {
    id: "rod-khlief",
    clientName: "Rod Khleif",
    clientType: "Real Estate Educator",
    description: "Real estate education and investment content targeting property investors and aspiring entrepreneurs",
    budget: 864,
    budgetStructure: "$100 per 100,000 views",
    goal: "864,000 views",
    timeline: "3 days",
    clipsDistributed: 720,
    clipsPaid: 720,
    viewsGenerated: 840000,
    roi: 0,
    exampleContent: "https://www.instagram.com/reel/example-rod-khlief/",
    contentPlatform: "instagram",
    status: "completed",
    highlights: [
      "840K views generated",
      "720 clips submitted",
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
      "429 clips submitted",
      "5-day timeline"
    ],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/shvty.jpeg"
  },
  {
    id: "sportz-playz",
    clientName: "Sportz Playz",
    clientType: "Gambling Company",
    description: "Sports betting platform targeting sports enthusiasts and betting communities",
    budget: 249,
    budgetStructure: "$100 per 1,000,000 views",
    goal: "2,490,000 views",
    timeline: "2 weeks",
    clipsDistributed: 98,
    clipsPaid: 98,
    viewsGenerated: 9500000,
    roi: 3717,
    exampleContent: "https://www.instagram.com/reel/DNVx_F0OKAx/",
    contentPlatform: "instagram",
    status: "completed",
    highlights: [
      "9.5M views generated",
      "98 clips submitted",
      "2-week timeline",
      "Exceeded expectations"
    ],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png"
  }
]

const industryStats = [
  {
    icon: TrendingUp,
    label: "Success Rate",
    value: "100%",
    description: "Campaign completion"
  },
  {
    icon: Users,
    label: "Total Views",
    value: "24.5M+",
    description: "Generated for clients"
  },
  {
    icon: DollarSign,
    label: "Total Budget",
    value: "$2,981",
    description: "Client investment"
  },
  {
    icon: Clock,
    label: "Avg. Timeline",
    value: "3 days",
    description: "Campaign completion"
  }
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
        className="text-center mb-12 sm:mb-16 lg:mb-20"
      >
        <motion.h1
          variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-6 sm:mb-8 text-foreground"
        >
            Proven <span className="font-normal text-foreground">Campaign Results</span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl text-neutral-300 max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4 sm:px-0"
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
        <div className="space-y-8">
          {campaignResults.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              variants={itemVariants}
              className="relative"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-neutral-900/40 border-neutral-800/50">
                <CardHeader className="border-b border-neutral-800/30 pb-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 mb-6">
                        {campaign.clientLogo && (
                          <div className="flex-shrink-0 mx-auto sm:mx-0">
                            <Image
                              src={campaign.clientLogo}
                              alt={campaign.clientName}
                              width={280}
                              height={280}
                              className="w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-xl object-cover ring-2 ring-neutral-800/40"
                              unoptimized
                            />
                          </div>
                        )}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                        <CardTitle className="text-2xl sm:text-3xl font-light text-foreground">
                          {campaign.clientName}
                        </CardTitle>
                        <span className="text-3xl sm:text-4xl opacity-60">{getCampaignIcon(campaign)}</span>
                      </div>
                      <p className="text-neutral-300 leading-relaxed text-base sm:text-lg">
                        {campaign.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 lg:p-8">
                  {/* Key Metrics - Large and Prominent */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                    <div className="text-center p-4 sm:p-6 lg:p-8 bg-neutral-800/30 rounded-xl border border-neutral-700/30">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-2 sm:mb-3">
                        {formatNumber(campaign.viewsGenerated)}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-neutral-400 uppercase tracking-wider">
                        Views Generated
                      </div>
                    </div>
                    <div className="text-center p-4 sm:p-6 lg:p-8 bg-neutral-800/30 rounded-xl border border-neutral-700/30">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-2 sm:mb-3">
                        {campaign.clipsDistributed}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-neutral-400 uppercase tracking-wider">
                        Submitted Clips
                      </div>
                    </div>
                  </div>

                  {/* Campaign Details - Condensed */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="font-medium text-neutral-400 uppercase tracking-wider text-xs sm:text-sm">
                        Campaign Overview
                      </h4>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center py-2 sm:py-3 border-b border-neutral-700/30">
                          <span className="text-sm sm:text-base text-neutral-400">Budget:</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">${campaign.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 sm:py-3 border-b border-neutral-700/30">
                          <span className="text-sm sm:text-base text-neutral-400">Timeline:</span>
                          <span className="font-medium text-foreground text-sm sm:text-base">{campaign.timeline}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 sm:py-3">
                          <span className="text-sm sm:text-base text-neutral-400">Submitted Clips:</span>
                          <span className="font-medium text-green-400 text-sm sm:text-base">
                            {campaign.clipsDistributed}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="font-medium text-neutral-400 uppercase tracking-wider text-xs sm:text-sm">
                        Key Highlights
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {campaign.highlights.slice(0, 3).map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 sm:p-4 bg-neutral-800/30 rounded-lg border border-neutral-700/30">
                            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-neutral-300 leading-relaxed">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 sm:pt-6 border-t border-neutral-700/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <Link
                      href={campaign.exampleContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-neutral-300 hover:text-foreground transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      View Example Content
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {/* View Full Gallery button temporarily hidden */}
                    {/* {campaign.id === "owning-manhattan" && (
                      <Link
                        href="/case-studies/owning-manhattan"
                        className="inline-flex items-center gap-2 text-sm font-medium bg-white text-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-full hover:bg-neutral-200 transition-colors"
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

      {/* CTA Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-20 md:py-32 border-t border-neutral-800/30"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6 text-white">
            Ready to Scale Your Brand?
          </h2>
          <p className="text-neutral-300 mb-8">
            Book a call with our team to discuss how we can help you create
            viral content that drives real results.
          </p>

          <a
            href="https://calendly.com/bykevingeorge/30min?month=2025-05"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-normal bg-white text-black px-8 py-4 rounded-full hover:bg-neutral-200 transition-all duration-300 group"
          >
            Schedule a Call
            <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>

          <p className="mt-8 text-xs text-neutral-400">
            Free consultation • No commitment required • Start scaling today
          </p>
        </div>
      </motion.section>

    </div>
  )
}
