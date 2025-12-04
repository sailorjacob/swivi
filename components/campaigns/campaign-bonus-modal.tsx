"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Trophy, 
  Flame, 
  Zap, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle2, 
  Star,
  TrendingUp,
  Sparkles,
  Gift,
  Target,
  Crown,
  Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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
      name: "TIER 1 — High-Follower Volume Bounty",
      icon: <Crown className="w-5 h-5" />,
      reward: "$150 per creator",
      totalPayout: "$1,200",
      spots: 8,
      spotsRemaining: 8, // Update this as spots fill
      requirements: [
        "Must have 10,000+ followers on TikTok, IG, or YouTube",
        "Must provide a screenshot + profile link for verification",
        "Post 14 Owning Manhattan clips within 7 days"
      ],
      description: "FIRST COME, FIRST SERVE — Only the first 8 qualifying creators get this bounty. Move fast!",
      deadline: "Closes once 8 spots filled",
      highlight: true
    },
    {
      name: "TIER 2 — Quality Bounty",
      icon: <Award className="w-5 h-5" />,
      reward: "$40 per winning clip",
      totalPayout: "$800",
      requirements: [
        "Focus on strongest editing and viewer retention",
        "Week 1: Top 10 clips selected",
        "Week 2: Top 10 clips selected",
        "Total of 20 winning clips across both weeks"
      ],
      description: "Rewarding the strongest editing and retention. Runs for two full selection cycles regardless of when campaign ends.",
      deadline: "Closes once all 20 winners are paid"
    }
  ]

  const contentRules = [
    { icon: <CheckCircle2 className="w-4 h-4" />, text: "Must tag @owningmanhattan in the post caption" },
    { icon: <CheckCircle2 className="w-4 h-4" />, text: "Must tag @serhant in the post caption" },
    { icon: <CheckCircle2 className="w-4 h-4" />, text: "Must tag @ryanserhant in the post caption" },
    { icon: <CheckCircle2 className="w-4 h-4" />, text: "Must use approved content from the shared Google Drive folders" },
    { icon: <CheckCircle2 className="w-4 h-4" />, text: "If recording your own clips, must be clear, relevant, and tied to Season 2" },
    { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Caption must include: "Season 2 now on Netflix"' },
  ]

  const maximizeTips = [
    { icon: <Zap className="w-4 h-4" />, text: "Post 3–7 clips per day" },
    { icon: <Zap className="w-4 h-4" />, text: "Use a fast hook in the first 0.2 seconds" },
    { icon: <Zap className="w-4 h-4" />, text: "Best-performing clips are 6–15 seconds" },
    { icon: <Zap className="w-4 h-4" />, text: "Add subtitles and on-screen context" },
    { icon: <Zap className="w-4 h-4" />, text: "Cross-post across all platforms" },
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-gradient-to-b from-card to-card/95 border border-border rounded-2xl shadow-2xl"
          >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div className="relative px-6 pt-8 pb-6 border-b border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                    <Trophy className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold tracking-tight">{campaign.title}</h2>
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20 animate-pulse">
                        <Flame className="w-3 h-3 mr-1" />
                        LIVE NOW
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Official Clipping Campaign — Biggest Ever!</p>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-foreground mb-1">
                      <DollarSign className="w-5 h-5" />
                      {campaign.totalBudget.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Budget</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                      <Gift className="w-5 h-5" />
                      {campaign.bonusBudget.toLocaleString()}
                    </div>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wide">In Bounties</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {campaign.payoutRate}
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Payout Rate</p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-border/50 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: <Sparkles className="w-4 h-4" /> },
                  { id: 'tiers', label: 'Bonus Tiers', icon: <Trophy className="w-4 h-4" /> },
                  { id: 'rules', label: 'Rules & Tips', icon: <Target className="w-4 h-4" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-lg leading-relaxed">
                        Season 2 is <strong>LIVE on Netflix</strong> and this is the <strong>biggest clipping campaign we've ever run</strong>.
                      </p>
                      <p className="text-muted-foreground">
                        Post the clips. Drive views. Earn automatically. Plus $2,000 in bounties for performance-based bonuses.
                      </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="p-2 rounded-lg bg-background">
                          <DollarSign className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold">$1 per 1K views</p>
                          <p className="text-xs text-muted-foreground">TikTok / IG Reels / YT Shorts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="p-2 rounded-lg bg-background">
                          <Users className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-semibold">Unlimited Accounts</p>
                          <p className="text-xs text-muted-foreground">Post from all your accounts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="p-2 rounded-lg bg-background">
                          <Clock className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-semibold">Weekly Payouts</p>
                          <p className="text-xs text-muted-foreground">PayPal / Bitcoin</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                          <Trophy className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-amber-600 dark:text-amber-400">$2,000 in Bounties</p>
                          <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Performance bonuses</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button className="flex-1 h-12 text-base" onClick={onClose}>
                        <Zap className="w-4 h-4 mr-2" />
                        Start Posting Now
                      </Button>
                      <Button variant="outline" className="flex-1 h-12 text-base" asChild>
                        <Link href="https://discord.gg/CtZ4tecJ7Y" target="_blank">
                          <Users className="w-4 h-4 mr-2" />
                          Join Discord
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Bonus Tiers Tab */}
                {activeTab === 'tiers' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {bonusTiers.map((tier, index) => (
                      <div
                        key={index}
                        className={`relative overflow-hidden rounded-xl border ${
                          tier.highlight 
                            ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/30' 
                            : 'bg-muted/30 border-border/50'
                        }`}
                      >
                        {tier.highlight && (
                          <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold bg-amber-500 text-black rounded-bl-lg">
                            LIMITED SPOTS
                          </div>
                        )}
                        
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${tier.highlight ? 'bg-amber-500/20' : 'bg-muted'}`}>
                                {tier.icon}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{tier.name}</h3>
                                <p className="text-sm text-muted-foreground">{tier.description}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 rounded-lg bg-background/50">
                              <p className="text-xs text-muted-foreground uppercase mb-1">Reward</p>
                              <p className="font-bold text-lg">{tier.reward}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-background/50">
                              <p className="text-xs text-muted-foreground uppercase mb-1">Total Payout</p>
                              <p className="font-bold text-lg">{tier.totalPayout}</p>
                            </div>
                          </div>

                          {tier.spots && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Spots Available</span>
                                <span className="font-medium">{tier.spotsRemaining} / {tier.spots}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-amber-500 h-2 rounded-full transition-all"
                                  style={{ width: `${((tier.spots - (tier.spotsRemaining || 0)) / tier.spots) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Requirements:</p>
                            {tier.requirements.map((req, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{req}</span>
                              </div>
                            ))}
                          </div>

                          {tier.deadline && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
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

                {/* Rules & Tips Tab */}
                {activeTab === 'rules' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Content Rules */}
                    <div className="rounded-xl border border-border/50 overflow-hidden">
                      <div className="px-4 py-3 bg-muted/50 border-b border-border/50">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Content Rules (Required)
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        {contentRules.map((rule, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm">
                            <span className="text-green-500 mt-0.5">{rule.icon}</span>
                            <span>{rule.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Maximize Tips */}
                    <div className="rounded-xl border border-amber-500/30 overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                      <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                        <h3 className="font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <TrendingUp className="w-4 h-4" />
                          How to Maximize Earnings
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        {maximizeTips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm">
                            <span className="text-amber-500 mt-0.5">{tip.icon}</span>
                            <span>{tip.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Banner */}
                    <div className="p-6 rounded-xl bg-gradient-to-r from-foreground to-foreground/90 text-background text-center">
                      <h3 className="text-xl font-bold mb-2">⚡ Start Posting. Start Earning.</h3>
                      <p className="text-background/80 mb-4">
                        Move fast. Secure your Tier 1 spot. Submit your best edits for Tier 2.
                      </p>
                      <Button 
                        variant="secondary" 
                        size="lg"
                        onClick={onClose}
                        className="bg-background text-foreground hover:bg-background/90"
                      >
                        Join Campaign Now
                      </Button>
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

