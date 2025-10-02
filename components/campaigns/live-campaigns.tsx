"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, DollarSign, Users, TrendingUp, Eye, Filter, Search, Play, ExternalLink, Calendar, Target, Globe, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CampaignDetailModal } from "./campaign-detail-modal"
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
  deadline: string
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

export function LiveCampaigns() {
  const [campaigns, setCampaigns] = useState<LiveCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedCampaign, setSelectedCampaign] = useState<LiveCampaign | null>(null)

  // Fetch campaigns from API
  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus.toUpperCase())
      }

      const response = await fetch(`/api/campaigns?${params}`)
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

  useEffect(() => {
    fetchCampaigns()
  }, [selectedStatus])

  // Transform API data to UI format
  const transformCampaignForUI = (campaign: any): LiveCampaign => {
    const now = new Date()
    const deadline = new Date(campaign.deadline)
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      ...campaign,
      // Map API fields to UI fields
      creator: campaign.creator,
      budgetSpent: campaign.spent,
      viewGoal: campaign.budget * 1000, // Estimate based on budget
      viewsGenerated: 0, // This would come from aggregated view tracking
      duration: `${Math.max(1, daysUntilDeadline)} days`,
      timeRemaining: daysUntilDeadline > 0 ? `${daysUntilDeadline} days` : "Ended",
      payoutStructure: `$${campaign.payoutRate} per 1K views`,
      participants: campaign._count.submissions,
      maxParticipants: Math.floor(campaign.budget / campaign.payoutRate),
      featured: campaign.status === "ACTIVE",
      difficulty: campaign.requirements.length > 3 ? "advanced" : "beginner",
      estimatedEarnings: {
        min: campaign.payoutRate * 10,
        max: campaign.payoutRate * 50
      },
      tags: campaign.targetPlatforms,
      status: campaign.status === "ACTIVE" ? "active" :
              campaign.status === "COMPLETED" ? "completed" : "paused"
    }
  }

  const liveCampaigns = campaigns.map(transformCampaignForUI)

  // Calculate real stats
  const campaignStats = [
    {
      icon: Target,
      label: "Active Activations",
      value: campaigns.filter(c => c.status === "ACTIVE").length.toString(),
      description: "Available now"
    },
    {
      icon: Users,
      label: "Total Participants",
      value: campaigns.reduce((sum, c) => sum + c._count.submissions, 0).toString() + "+",
      description: "Clippers earning"
    },
    {
      icon: DollarSign,
      label: "Live Budgets",
      value: `$${(campaigns.reduce((sum, c) => sum + c.budget, 0) / 1000).toFixed(1)}K`,
      description: "Available payouts"
    },
    {
      icon: TrendingUp,
      label: "Views Generated",
      value: "Live", // This would be calculated from view tracking
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

  // Helper function to get budget spent (for backward compatibility)
  const getBudgetSpent = (campaign: LiveCampaign) => {
    return campaign.spent || 0
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

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Budget Progress</span>
                      <span>${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-foreground h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(getBudgetSpent(campaign), campaign.budget)}%` }}
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
                    >
                      {campaign.status === "DRAFT" ? "Coming Soon" : "Join Campaign"}
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
    </div>
  )
}
