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
            className="relative bg-card border border-border rounded-lg max-w-xl w-full max-h-[85vh] overflow-y-auto"
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="border-b border-border pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium mb-1 text-foreground">
                      {campaign.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {campaign.clientLogo && (
                        <div className="flex-shrink-0">
                          <Image
                            src={campaign.clientLogo}
                            alt={campaign.creator}
                            width={20}
                            height={20}
                            className="rounded object-cover ring-1 ring-border"
                            unoptimized
                          />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {campaign.creator}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4">

                {/* Campaign Info - Compact */}
                <div className="border border-border rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Budget</div>
                      <div className="text-sm font-medium text-foreground">${campaign.budget.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Payout Rate</div>
                      <div className="text-sm font-medium text-foreground">{campaign.payoutStructure}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                      <div className="text-sm font-medium text-foreground">{campaign.duration}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Participants</div>
                      <div className="text-sm font-medium text-foreground">
                        {campaign.participants}{campaign.maxParticipants && `/${campaign.maxParticipants}`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Budget Spent</span>
                        <span className="text-foreground">${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-foreground h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(campaign.spent, campaign.budget)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="border border-border rounded-lg p-3 mb-4">
                  <div className="text-xs text-muted-foreground mb-2">Description</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {campaign.description}
                  </p>
                </div>


                {/* Requirements */}
                {campaign.requirements.length > 0 && (
                  <div className="border border-border rounded-lg p-3 mb-4">
                    <div className="text-xs text-muted-foreground mb-2">Requirements</div>
                    <div className="space-y-1">
                      {campaign.requirements.map((requirement, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{requirement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    className="flex-1 h-9"
                    disabled={campaign.status === "DRAFT"}
                    size="sm"
                  >
                    {campaign.status === "DRAFT" ? "Coming Soon" : "Join Campaign"}
                  </Button>
                  {campaign.exampleContent && (
                    <Button variant="outline" asChild size="sm" className="h-9">
                      <Link href={campaign.exampleContent} target="_blank">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Example
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" asChild size="sm" className="h-9">
                    <Link href="https://discord.gg/CtZ4tecJ7Y" target="_blank">
                      <Users className="mr-1 h-3 w-3" />
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
