"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Clock, DollarSign, Users, Target, ExternalLink, Play, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

interface CampaignDetailModalProps {
  campaign: {
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
    difficulty: "beginner" | "intermediate" | "advanced"
    estimatedEarnings: { min: number; max: number }
    exampleContent?: string
    tags: string[]
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
            className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-light mb-2">
                      {campaign.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {campaign.clientLogo && (
                        <Image
                          src={campaign.clientLogo}
                          alt={campaign.client}
                          width={28}
                          height={28}
                          className="rounded-sm object-cover"
                        />
                      )}
                      <p className="text-muted-foreground">
                        {campaign.client} • {campaign.industry}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Status and Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="outline" className="text-xs">
                    {campaign.status.replace('-', ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {campaign.difficulty}
                  </Badge>
                  {campaign.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Campaign Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {campaign.description}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium mb-3">Campaign Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Budget:</span>
                        <span className="text-sm font-medium">${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Duration:</span>
                        <span className="text-sm font-medium">{campaign.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Time Remaining:</span>
                        <span className="text-sm font-medium">{campaign.timeRemaining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">View Goal:</span>
                        <span className="text-sm font-medium">
                          {(campaign.viewGoal / 1000000).toFixed(1)}M views
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Earnings</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Payout Rate:</span>
                        <span className="text-sm font-medium">{campaign.payoutStructure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Potential Earnings:</span>
                        <span className="text-sm font-medium text-green-600">
                          ${campaign.estimatedEarnings.min}-${campaign.estimatedEarnings.max}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Participants:</span>
                        <span className="text-sm font-medium">
                          {campaign.participants}{campaign.maxParticipants && `/${campaign.maxParticipants}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Campaign Progress</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Budget Spent</span>
                        <span>${campaign.budgetSpent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(campaign.budgetSpent, campaign.budget)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Views Generated</span>
                        <span>{(campaign.viewsGenerated / 1000000).toFixed(1)}M / {(campaign.viewGoal / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(campaign.viewsGenerated, campaign.viewGoal)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platforms */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Supported Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                    {campaign.platforms.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Requirements</h4>
                  <div className="space-y-2">
                    {campaign.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    disabled={campaign.status === "launching-soon"}
                  >
                    {campaign.status === "launching-soon" ? "Coming Soon" : "Join Campaign"}
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
