"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LinkifyText } from "@/components/ui/linkify-text"
import {
  DollarSign,
  Users,
  Clock,
  Instagram,
  Youtube,
  Music,
  Eye,
  Loader2
} from "lucide-react"
import Link from "next/link"

interface Campaign {
  id: string
  title: string
  description: string
  creator: string
  budget: number
  spent: number
  payoutRate: number
  targetPlatforms: string[]
  requirements: string[]
  featuredImage?: string
  bountiesEnabled?: boolean
  _count: {
    clipSubmissions: number
  }
}

const platformIcons = {
  tiktok: Music,
  instagram: Instagram,
  youtube: Youtube,
}

export function CampaignsPreview() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/campaigns?status=ACTIVE&limit=6")
        if (response.ok) {
          const data = await response.json()
          setCampaigns(data.slice(0, 6)) // Show max 6 campaigns
        } else {
          console.error("Failed to fetch campaigns")
          setError("Unable to load campaigns")
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error)
        setError("Unable to load campaigns")
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getProgressPercentage = (spent: number, budget: number) => {
    return budget > 0 ? (spent / budget) * 100 : 0
  }

  if (loading) {
    return (
      <section className="py-20 md:py-32 border-t border-black/5 bg-background relative">
        <div className="max-width-wrapper section-padding">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  if (error || campaigns.length === 0) {
    return null // Don't show the section if there are no campaigns or error
  }

  return (
    <section className="py-20 md:py-32 border-t border-black/5 bg-background relative">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
              Active Campaigns
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              See what's happening on our platform right now. Join creators in building authentic content that drives real results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => {
              const budgetNum = Number(campaign.budget ?? 0)
              const spentNum = Number(campaign.spent ?? 0)
              const progress = getProgressPercentage(spentNum, budgetNum)
              const remainingBudget = Math.max(0, budgetNum - spentNum)
              const budgetText = remainingBudget > 0 ? `$${remainingBudget.toFixed(0)} left` : "Budget Full"

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="bg-card border-border hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                    <CardContent className="p-0">
                      {/* Campaign Image */}
                      <div className="relative h-40 bg-muted overflow-hidden">
                        {campaign.featuredImage && campaign.featuredImage.trim() !== '' ? (
                          <>
                            <img
                              src={campaign.featuredImage}
                              alt={campaign.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                console.log('Image failed to load:', campaign.featuredImage)
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.parentElement?.querySelector('.gradient-fallback') as HTMLElement
                                if (fallback) {
                                  fallback.style.display = 'flex'
                                }
                              }}
                            />
                            <div className="gradient-fallback hidden w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <span className="text-white text-sm font-medium text-center px-2">{campaign.title}</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium text-center px-2">{campaign.title}</span>
                          </div>
                        )}

                        {/* Live Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-foreground text-background text-xs px-2 py-1">
                            LIVE
                          </Badge>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-2">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Campaign Info */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">
                            {campaign.creator.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-muted-foreground">{campaign.creator}</span>
                        </div>

                        <h3 className="text-base font-medium text-foreground mb-2 line-clamp-2">
                          {campaign.title}
                        </h3>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          <LinkifyText text={campaign.description} />
                        </p>

                        {/* Budget Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
                            <span>{budgetText}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {/* Key Metrics */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">${campaign.payoutRate} per 1K views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{campaign._count.clipSubmissions} submissions</span>
                            </div>
                          </div>
                        </div>

                        {/* Platforms */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex gap-1">
                            {campaign.targetPlatforms.slice(0, 3).map((platform) => {
                              const Icon = platformIcons[platform.toLowerCase() as keyof typeof platformIcons]
                              return (
                                <div key={platform} className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                                  {Icon && <Icon className="w-2.5 h-2.5 text-muted-foreground" />}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button
                          className="w-full bg-foreground text-background hover:bg-foreground/90 text-sm"
                          asChild
                        >
                          <Link href="/creators/dashboard/campaigns">
                            View Campaign
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button variant="outline" size="lg" asChild>
              <Link href="/creators/dashboard/campaigns">
                View All Campaigns
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}