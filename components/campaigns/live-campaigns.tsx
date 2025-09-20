"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, DollarSign, Users, TrendingUp, Eye, Filter, Search, Play, ExternalLink, Calendar, Target, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CampaignDetailModal } from "./campaign-detail-modal"
import Link from "next/link"
import Image from "next/image"

interface LiveCampaign {
  id: string
  title: string
  client: string
  industry: string
  description: string
  budget: number
  budgetSpent: number
  viewGoal: number
  viewsGenerated: number
  duration: string
  timeRemaining: string
  payoutStructure: string
  platforms: string[]
  requirements: string[]
  status: "active" | "ending-soon" | "launching-soon"
  participants: number
  maxParticipants?: number
  featured: boolean
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedEarnings: { min: number; max: number }
  exampleContent?: string
  tags: string[]
  clientLogo?: string
}

const liveCampaigns: LiveCampaign[] = [
  {
    id: "campaign-1",
    title: "Owning Manhattan Netflix Series",
    client: "Owning Manhattan",
    industry: "Entertainment/TV",
    description: "Create viral clips showcasing the luxury real estate and drama from Netflix's hit series Owning Manhattan. Focus on the most engaging moments and character interactions.",
    budget: 3000,
    budgetSpent: 750,
    viewGoal: 3000000,
    viewsGenerated: 850000,
    duration: "10 days",
    timeRemaining: "6 days",
    payoutStructure: "$1.25 per 1K views",
    platforms: ["TikTok", "YouTube Shorts", "Instagram Reels"],
    requirements: [
      "Netflix series content focus",
      "0.5% minimum engagement rate",
      "10+ seconds duration",
      "Include #OwningManhattan hashtag"
    ],
    status: "active",
    participants: 32,
    maxParticipants: 75,
    featured: true,
    difficulty: "beginner",
    estimatedEarnings: { min: 30, max: 120 },
    exampleContent: "https://www.instagram.com/reel/DOKGK_ciO-9/",
    tags: ["Netflix", "Reality TV", "Luxury", "Trending"],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif"
  },
  {
    id: "campaign-2", 
    title: "Sportz Playz Betting Campaign",
    client: "Sportz Playz",
    industry: "Sports/Gaming",
    description: "Create engaging sports betting content and highlights. Focus on game predictions, betting tips, and exciting sports moments that drive engagement.",
    budget: 2500,
    budgetSpent: 1200,
    viewGoal: 2500000,
    viewsGenerated: 1600000,
    duration: "12 days",
    timeRemaining: "3 days",
    payoutStructure: "$1.50 per 1K views",
    platforms: ["Instagram Reels", "TikTok", "YouTube Shorts"],
    requirements: [
      "Sports/betting content focus",
      "0.5% minimum engagement rate",
      "8+ seconds duration",
      "Include #SportzPlayz hashtag"
    ],
    status: "ending-soon",
    participants: 28,
    maxParticipants: 60,
    featured: false,
    difficulty: "intermediate",
    estimatedEarnings: { min: 25, max: 150 },
    tags: ["Sports", "Betting", "High-Engagement"],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png"
  },
  {
    id: "campaign-3",
    title: "Rod Khleif Real Estate Content",
    client: "Rod Khleif",
    industry: "Real Estate/Education",
    description: "Create educational content around real estate investing, property management, and wealth building strategies from renowned real estate expert Rod Khleif.",
    budget: 4000,
    budgetSpent: 0,
    viewGoal: 4000000,
    viewsGenerated: 0,
    duration: "14 days",
    timeRemaining: "Launches in 2 days",
    payoutStructure: "$1.75 per 1K views",
    platforms: ["YouTube Shorts", "TikTok", "Instagram Reels"],
    requirements: [
      "Real estate education focus",
      "0.5% minimum engagement rate",
      "15+ seconds duration",
      "Educational and informative"
    ],
    status: "launching-soon",
    participants: 0,
    maxParticipants: 100,
    featured: true,
    difficulty: "intermediate",
    estimatedEarnings: { min: 40, max: 200 },
    tags: ["Real Estate", "Education", "Finance", "High-Payout"],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/rodkhlief.avif"
  },
  {
    id: "campaign-4",
    title: "Shvfty Streaming Highlights",
    client: "Shvfty",
    industry: "Gaming/Streaming",
    description: "Create viral moments from Twitch streams featuring epic gameplay, funny reactions, and community interactions. Perfect for gaming content creators.",
    budget: 2000,
    budgetSpent: 500,
    viewGoal: 2200000,
    viewsGenerated: 650000,
    duration: "10 days",
    timeRemaining: "7 days",
    payoutStructure: "$1.20 per 1K views",
    platforms: ["TikTok", "YouTube Shorts", "Instagram Reels"],
    requirements: [
      "Gaming/streaming content focus",
      "0.5% minimum engagement rate",
      "8+ seconds duration",
      "Include #Shvfty hashtag"
    ],
    status: "active",
    participants: 18,
    maxParticipants: 50,
    featured: false,
    difficulty: "beginner",
    estimatedEarnings: { min: 15, max: 85 },
    tags: ["Gaming", "Streaming", "Highlights", "Community"],
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/shvty.jpeg"
  }
]

const campaignStats = [
  {
    icon: Target,
    label: "Active Activations",
    value: "4",
    description: "Available now"
  },
  {
    icon: Users,
    label: "Total Participants",
    value: "78+",
    description: "Clippers earning"
  },
  {
    icon: DollarSign,
    label: "Live Budgets",
    value: "$11.5K",
    description: "Available payouts"
  },
  {
    icon: TrendingUp,
    label: "Views Generated",
    value: "3.7M",
    description: "This week"
  }
]


export function LiveCampaigns() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedCampaign, setSelectedCampaign] = useState<LiveCampaign | null>(null)

  const filteredCampaigns = liveCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.industry.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Stats */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-12"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {campaignStats.map((stat, index) => (
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

      {/* Filters */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-normal">Find Your Perfect Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search campaigns, clients, or industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Tabs */}
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">All Status</TabsTrigger>
                <TabsTrigger value="active" className="text-xs sm:text-sm px-2 py-2">Active</TabsTrigger>
                <TabsTrigger value="ending-soon" className="text-xs sm:text-sm px-2 py-2">Ending Soon</TabsTrigger>
                <TabsTrigger value="launching-soon" className="text-xs sm:text-sm px-2 py-2">Launching Soon</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">All Levels</TabsTrigger>
                <TabsTrigger value="beginner" className="text-xs sm:text-sm px-2 py-2">Beginner</TabsTrigger>
                <TabsTrigger value="intermediate" className="text-xs sm:text-sm px-2 py-2">Intermediate</TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs sm:text-sm px-2 py-2">Advanced</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
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
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-normal mb-2">
                        {campaign.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-1">
                        {campaign.clientLogo && (
                          <div className="flex-shrink-0">
                            <Image
                              src={campaign.clientLogo}
                              alt={campaign.client}
                              width={28}
                              height={28}
                              className="rounded-md object-cover ring-1 ring-black/10"
                              unoptimized
                            />
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {campaign.client} • {campaign.industry}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {campaign.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Budget Progress</span>
                      <span>${campaign.budgetSpent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(campaign.budgetSpent, campaign.budget)}%` }}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
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
                        <span className="text-xs font-medium text-green-600">
                          ${campaign.estimatedEarnings.min}-${campaign.estimatedEarnings.max}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Time Left:</span>
                        <span className="text-xs font-medium">{campaign.timeRemaining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Views Goal:</span>
                        <span className="text-xs font-medium">
                          {(campaign.viewGoal / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  </div>



                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      disabled={campaign.status === "launching-soon"}
                    >
                      {campaign.status === "launching-soon" ? "Coming Soon" : "Join Campaign"}
                    </Button>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="https://discord.gg/CtZ4tecJ7Y" target="_blank">
                <Users className="mr-2 h-4 w-4" />
                Join Discord Community
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/clippers/onboarding">
                <Play className="mr-2 h-4 w-4" />
                Start Onboarding
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
    </div>
  )
}
