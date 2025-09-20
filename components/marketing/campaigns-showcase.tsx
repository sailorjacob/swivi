"use client"

import { motion } from "framer-motion"
import { ExternalLink, TrendingUp, Users, DollarSign, Clock, Play, Target, Award, Eye } from "lucide-react"
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
    clientType: "Netflix TV Series",
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
      "610% ROI achieved",
      "Completed in just 2 days",
      "81.7% clip success rate",
      "6.1M views on $1K budget"
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
      "240% ROI achieved",
      "1.8M views generated",
      "80% clip success rate",
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
      "211% ROI achieved",
      "258 clips distributed",
      "60% clip success rate",
      "1.9M views generated"
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
      "3,240% ROI achieved",
      "8.1M views on $250 budget",
      "324x return on investment",
      "Exceeded goal by 224%"
    ],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png"
  }
]

const industryStats = [
  {
    icon: TrendingUp,
    label: "Average ROI",
    value: "1,020%",
    description: "Across all campaigns"
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
  "Netflix TV Series",
  "Twitch Streamers",
  "Gambling Companies",
  "Content Creators",
  "Musicians",
  "Entrepreneurs",
  "Tech Startups",
  "E-commerce Brands"
]

export function CampaignsShowcase() {
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
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
          Proven <span className="font-normal">Campaign Results</span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8"
        >
          We work with creators across all niches, from entrepreneurs and content creators 
          to musicians, TV series, and betting apps. Here are some of our most successful campaigns.
        </motion.p>
      </motion.div>

      {/* Industry Stats */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-20"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {industryStats.map((stat, index) => (
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

      {/* Campaign Results */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-20"
      >
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-light mb-4 text-center">
            Featured Campaign Results
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Real results from real campaigns. See how we've helped clients achieve 
            exceptional ROI through our clipper network.
          </p>
        </div>

        <div className="space-y-8">
          {campaignResults.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              variants={itemVariants}
              className="relative"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-neutral-800/60 border-neutral-700">
                <CardHeader className="border-b border-neutral-600/30">
                  <div className="flex items-center gap-3 mb-3">
                        {campaign.clientLogo && (
                          <div className="flex-shrink-0">
                            <Image
                              src={campaign.clientLogo}
                              alt={campaign.clientName}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover ring-1 ring-neutral-600/30"
                              unoptimized
                            />
                          </div>
                        )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <CardTitle className="text-xl font-normal">
                          {campaign.clientName}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {campaign.clientType}
                        </Badge>
                        <span className="text-2xl">{getPlatformIcon(campaign.contentPlatform)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                        Campaign Details
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Budget:</span>
                          <span className="text-sm font-medium">${campaign.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Structure:</span>
                          <span className="text-sm font-medium">{campaign.budgetStructure}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Timeline:</span>
                          <span className="text-sm font-medium">{campaign.timeline}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                        Content Production
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Clips Made:</span>
                          <span className="text-sm font-medium">{campaign.clipsDistributed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Clips Paid:</span>
                          <span className="text-sm font-medium">{campaign.clipsPaid}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Success Rate:</span>
                          <span className="text-sm font-medium">
                            {Math.round((campaign.clipsPaid / campaign.clipsDistributed) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                        Performance
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Goal:</span>
                          <span className="text-sm font-medium">{campaign.goal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Achieved:</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatNumber(campaign.viewsGenerated)} views
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Efficiency:</span>
                          <span className="text-sm font-medium">
                            ${(campaign.budget / (campaign.viewsGenerated / 1000)).toFixed(2)}/1K views
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">ROI:</span>
                          <span className="text-sm font-medium text-green-600">
                            {campaign.roi.toLocaleString()}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                        Key Highlights
                      </h4>
                      <div className="space-y-2">
                        {campaign.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Award className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-black/5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <Link
                      href={campaign.exampleContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                    >
                      <Play className="h-4 w-4" />
                      View Example Content
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {campaign.id === "owning-manhattan" && (
                      <Link
                        href="/case-studies/owning-manhattan"
                        className="inline-flex items-center gap-2 text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:bg-foreground/90 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View Full Gallery
                      </Link>
                    )}
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
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-light mb-4">
            Industries We Serve
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From entertainment to tech, we help brands and creators across all industries 
            achieve viral success through our clipper network.
          </p>
        </div>

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-3"
        >
          {industries.map((industry, index) => (
            <Badge
              key={index}
              variant="outline"
              className="px-4 py-2 text-sm hover:bg-black/5 transition-colors"
            >
              {industry}
            </Badge>
          ))}
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center"
      >
        <motion.div
          variants={itemVariants}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-2xl md:text-3xl font-light mb-4">
            Ready to Achieve Similar Results?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join the brands and creators who trust Swivi to amplify their content 
            and achieve exceptional ROI through our proven clipper network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/brands"
              className="inline-flex items-center text-sm font-normal bg-foreground text-background px-8 py-4 rounded-full hover:bg-foreground/90 transition-all duration-300 group"
            >
              Start Your Campaign
              <Target className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            </Link>
            <Link
              href="/clippers"
              className="inline-flex items-center text-sm font-normal border border-black/20 px-8 py-4 rounded-full hover:bg-black/5 transition-all duration-300 group"
            >
              Join as Clipper
              <Users className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </motion.section>
    </div>
  )
}
