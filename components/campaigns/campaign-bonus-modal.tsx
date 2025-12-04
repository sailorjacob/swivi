"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Crown,
  Award,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const bonusTiers: BonusTier[] = [
    {
      name: "Tier 1 — High-Follower Volume Bounty",
      icon: <Crown className="w-5 h-5" />,
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
      icon: <Award className="w-5 h-5" />,
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-hidden bg-card border border-border rounded-xl shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div className="px-6 pt-6 pb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-zinc-400/20 to-zinc-500/20 border border-zinc-400/30">
                    <Trophy className="w-6 h-6 text-zinc-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Performance Bounties</h2>
                    <p className="text-sm text-muted-foreground">{campaign.title}</p>
                  </div>
                </div>
                
                {/* Total Bounty Amount */}
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-zinc-400/10 via-zinc-300/10 to-zinc-400/10 border border-zinc-400/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bounty Pool</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                        ${campaign.bonusBudget.toLocaleString()}
                      </p>
                    </div>
                    <Sparkles className="w-8 h-8 text-zinc-400/50" />
                  </div>
                </div>
              </div>

              {/* Bounty Tiers */}
              <div className="px-6 pb-6 space-y-4">
                {bonusTiers.map((tier, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-xl border overflow-hidden ${
                      tier.highlight 
                        ? 'border-zinc-400/40 bg-gradient-to-br from-zinc-400/5 to-transparent' 
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    {tier.highlight && (
                      <div className="px-4 py-2 bg-gradient-to-r from-zinc-300 to-zinc-400 text-black text-xs font-bold flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        LIMITED SPOTS — FIRST COME, FIRST SERVED
                      </div>
                    )}
                    
                    <div className="p-5">
                      {/* Tier Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`p-2.5 rounded-lg ${
                          tier.highlight 
                            ? 'bg-gradient-to-br from-zinc-400/20 to-zinc-500/20 border border-zinc-400/30' 
                            : 'bg-muted border border-border'
                        }`}>
                          {tier.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{tier.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{tier.description}</p>
                        </div>
                      </div>

                      {/* Reward Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-background border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Reward</p>
                          <p className="font-bold text-lg">{tier.reward}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-background border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Total Pool</p>
                          <p className="font-bold text-lg">{tier.totalPayout}</p>
                        </div>
                      </div>

                      {/* Spots Progress */}
                      {tier.spots && (
                        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">Spots Available</span>
                            <span className="text-muted-foreground">{tier.spotsRemaining} / {tier.spots}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-zinc-300 to-zinc-500 h-2.5 rounded-full transition-all"
                              style={{ width: `${((tier.spots - (tier.spotsRemaining || 0)) / tier.spots) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Requirements */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Requirements:</p>
                        {tier.requirements.map((req, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-foreground/70" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>

                      {/* Deadline */}
                      {tier.deadline && (
                        <div className="mt-4 pt-3 border-t border-border/50">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {tier.deadline}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* CTA */}
                <Button className="w-full h-12 text-base font-semibold" onClick={onClose}>
                  Got It
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
