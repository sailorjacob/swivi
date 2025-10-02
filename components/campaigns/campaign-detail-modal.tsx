"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Clock, DollarSign, Users, Target, ExternalLink, Play, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

interface CampaignDetailModalProps {
  campaign: {
    id: string
    title: string
    creator: string
    description: string
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
  isOpen: boolean
  onClose: () => void
}

export function CampaignDetailModal({ campaign, isOpen, onClose }: CampaignDetailModalProps) {
  if (!isOpen) return null

  const getProgressPercentage = (spent: number, total: number) => {
    return Math.min((spent / total) * 100, 100)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-light mb-2 text-white">
                      {campaign.title}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {campaign.clientLogo && (
                        <div className="flex-shrink-0">
                          <Image
                            src={campaign.clientLogo}
                            alt={campaign.creator}
                            width={32}
                            height={32}
                            className="rounded-md object-cover ring-1 ring-border"
                            unoptimized
                          />
                        </div>
                      )}
                      <p className="text-muted-foreground">
                        {campaign.creator} • Entertainment
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-white">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-medium mb-2 text-white">Campaign Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {campaign.description}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium mb-3 text-white">Campaign Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Budget:</span>
                        <span className="text-sm font-medium text-white">${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Duration:</span>
                        <span className="text-sm font-medium text-white">{campaign.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Time Remaining:</span>
                        <span className="text-sm font-medium text-white">{campaign.timeRemaining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">View Goal:</span>
                        <span className="text-sm font-medium text-white">
                          {campaign.viewGoal ? `${(campaign.viewGoal / 1000000).toFixed(1)}M views` : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 text-white">Earnings</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Payout Rate:</span>
                        <span className="text-sm font-medium text-white">{campaign.payoutStructure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Potential Earnings:</span>
                        <span className="text-sm font-medium text-white">
                          {campaign.estimatedEarnings ? `$${campaign.estimatedEarnings.min}-$${campaign.estimatedEarnings.max}` : "TBD"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Participants:</span>
                        <span className="text-sm font-medium text-white">
                          {campaign.participants}{campaign.maxParticipants && `/${campaign.maxParticipants}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-white">Campaign Progress</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Budget Spent</span>
                        <span className="text-white">${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-foreground h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(campaign.spent, campaign.budget)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Views Generated</span>
                        <span className="text-white">
                          {campaign.viewsGenerated ? `${(campaign.viewsGenerated / 1000000).toFixed(1)}M` : "0"} / {campaign.viewGoal ? `${(campaign.viewGoal / 1000000).toFixed(1)}M` : "TBD"}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-foreground h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(campaign.viewsGenerated || 0, campaign.viewGoal || 1)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>


                {/* Requirements */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-white">Requirements</h4>
                  <div className="space-y-2">
                    {campaign.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    className="flex-1"
                    disabled={campaign.status === "DRAFT"}
                  >
                    {campaign.status === "DRAFT" ? "Coming Soon" : "Join Campaign"}
                  </Button>
                  {campaign.exampleContent && (
                    <Button variant="outline" asChild>
                      <Link href={campaign.exampleContent} target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Example
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link href="https://discord.gg/CtZ4tecJ7Y" target="_blank">
                      <Users className="mr-2 h-4 w-4" />
                      Discord
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
