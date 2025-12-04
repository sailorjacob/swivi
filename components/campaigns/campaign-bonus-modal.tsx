"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Trophy, 
  Zap, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle2, 
  Target,
  Crown,
  Award,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface BonusTier {
  name: string
  icon: React.ReactNode
  reward: string
  totalPayout: string
  spots?: number
  spotsRemaining?: number
  requirements: string[]
  description: string
  deadline?: string
  highlight?: boolean
}

interface CampaignBonusModalProps {
  isOpen: boolean
  onClose: () => void
  campaign?: {
    title: string
    totalBudget: number
    bonusBudget: number
    payoutRate: string
  }
}

const defaultCampaign = {
  title: "Owning Manhattan Season 2",
  totalBudget: 20000,
  bonusBudget: 2000,
  payoutRate: "$1 per 1,000 views"
}

export function CampaignBonusModal({ isOpen, onClose, campaign = defaultCampaign }: CampaignBonusModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tiers' | 'rules'>('overview')
  
  const bonusTiers: BonusTier[] = [
    {
      name: "Tier 1 — High-Follower Volume Bounty",
      icon: <Crown className="w-4 h-4" />,
      reward: "$150 per creator",
      totalPayout: "$1,200",
      spots: 8,
      spotsRemaining: 8,
      requirements: [
        "Must have 10,000+ followers on TikTok, IG, or YouTube",
        "Must provide a screenshot + profile link for verification",
        "Post 14 Owning Manhattan clips within 7 days"
      ],
      description: "First come, first served — Only the first 8 qualifying creators get this bounty.",
      deadline: "Closes once 8 spots filled",
      highlight: true
    },
    {
      name: "Tier 2 — Quality Bounty",
      icon: <Award className="w-4 h-4" />,
      reward: "$40 per winning clip",
      totalPayout: "$800",
      requirements: [
        "Focus on strongest editing and viewer retention",
        "Week 1: Top 10 clips selected",
        "Week 2: Top 10 clips selected",
        "Total of 20 winning clips across both weeks"
      ],
      description: "Rewarding the strongest editing and retention. Runs for two full selection cycles.",
      deadline: "Closes once all 20 winners are paid"
    }
  ]

  const contentRules = [
    "Must tag @owningmanhattan in the post caption",
    "Must tag @serhant in the post caption",
    "Must tag @ryanserhant in the post caption",
    "Must use approved content from the shared Google Drive folders",
    "If recording your own clips, must be clear, relevant, and tied to Season 2",
    'Caption must include: "Season 2 now on Netflix"',
  ]

  const maximizeTips = [
    "Post 3–7 clips per day",
    "Use a fast hook in the first 0.2 seconds",
    "Best-performing clips are 6–15 seconds",
    "Add subtitles and on-screen context",
    "Cross-post across all platforms",
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-card border border-border rounded-lg shadow-xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[85vh]">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-muted border border-border">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{campaign.title}</h2>
                    <p className="text-sm text-muted-foreground">Performance Bounties</p>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
                    <div className="text-lg font-semibold">${campaign.totalBudget.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total Budget</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
                    <div className="text-lg font-semibold flex items-center justify-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      ${campaign.bonusBudget.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">In Bounties</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
                    <div className="text-lg font-semibold">{campaign.payoutRate}</div>
                    <p className="text-xs text-muted-foreground">Payout Rate</p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-border px-6">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'tiers', label: 'Bonus Tiers' },
                  { id: 'rules', label: 'Rules' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Season 2 is live on Netflix. This is our biggest clipping campaign with a $20,000 total budget. 
                      Post clips, drive views, and earn $1 per 1,000 views automatically. Plus $2,000 in bounties for 
                      performance-based bonuses.
                    </p>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">$1 per 1K views</p>
                          <p className="text-xs text-muted-foreground">TikTok / Reels / Shorts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Unlimited Accounts</p>
                          <p className="text-xs text-muted-foreground">Post from all accounts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Weekly Payouts</p>
                          <p className="text-xs text-muted-foreground">PayPal / Bitcoin</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">$2,000 in Bounties</p>
                          <p className="text-xs text-muted-foreground">Performance bonuses</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-2">
                      <Button className="w-full" onClick={onClose}>
                        Start Posting
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Bonus Tiers Tab */}
                {activeTab === 'tiers' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {bonusTiers.map((tier, index) => (
                      <div
                        key={index}
                        className={`rounded-lg border overflow-hidden ${
                          tier.highlight 
                            ? 'border-foreground/30 bg-muted/20' 
                            : 'border-border'
                        }`}
                      >
                        {tier.highlight && (
                          <div className="px-4 py-1.5 bg-foreground text-background text-xs font-medium flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            LIMITED SPOTS — FIRST COME, FIRST SERVED
                          </div>
                        )}
                        
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded bg-muted border border-border">
                                {tier.icon}
                              </div>
                              <div>
                                <h3 className="font-medium text-sm">{tier.name}</h3>
                                <p className="text-xs text-muted-foreground">{tier.description}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="p-2.5 rounded bg-muted/50 border border-border/50">
                              <p className="text-xs text-muted-foreground">Reward</p>
                              <p className="font-semibold text-sm">{tier.reward}</p>
                            </div>
                            <div className="p-2.5 rounded bg-muted/50 border border-border/50">
                              <p className="text-xs text-muted-foreground">Total Payout</p>
                              <p className="font-semibold text-sm">{tier.totalPayout}</p>
                            </div>
                          </div>

                          {tier.spots && (
                            <div className="mb-3 p-2.5 rounded bg-muted/30 border border-border/50">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-medium">Spots Available</span>
                                <span className="text-muted-foreground">{tier.spotsRemaining} / {tier.spots} remaining</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-foreground h-2 rounded-full transition-all"
                                  style={{ width: `${((tier.spots - (tier.spotsRemaining || 0)) / tier.spots) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <p className="text-xs font-medium">Requirements:</p>
                            {tier.requirements.map((req, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-foreground" />
                                <span>{req}</span>
                              </div>
                            ))}
                          </div>

                          {tier.deadline && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {tier.deadline}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Rules Tab */}
                {activeTab === 'rules' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Content Rules */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Content Rules
                        </h3>
                      </div>
                      <div className="p-4 space-y-2.5">
                        {contentRules.map((rule, index) => (
                          <div key={index} className="flex items-start gap-2.5 text-sm">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Maximize Earnings
                        </h3>
                      </div>
                      <div className="p-4 space-y-2.5">
                        {maximizeTips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-2.5 text-sm">
                            <span className="text-muted-foreground">→</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA - Fixed: no more white fill */}
                    <div className="p-4 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Ready to start?</p>
                          <p className="text-xs text-muted-foreground">
                            Move fast. Secure your Tier 1 spot.
                          </p>
                        </div>
                        <Button size="sm" onClick={onClose}>
                          Join Campaign
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
