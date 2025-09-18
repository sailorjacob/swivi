"use client"

import { useState } from "react"
import {
  Users,
  DollarSign,
  Share2,
  Copy,
  Trophy,
  TrendingUp,
  Gift,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import toast from "react-hot-toast"

// Mock data
const referralStats = {
  totalReferrals: 12,
  activeReferrals: 8,
  totalEarned: 240,
  pendingRewards: 85,
  referralCode: "CLIPPER2024",
  referralLink: "https://swivi.com/clippers/join?ref=CLIPPER2024"
}

const referralTiers = [
  {
    name: "Bronze Clipper",
    referrals: 5,
    bonus: "$25 bonus",
    current: true,
    progress: 60,
    icon: Trophy
  },
  {
    name: "Silver Clipper",
    referrals: 15,
    bonus: "$75 bonus",
    current: false,
    progress: 40,
    icon: Trophy
  },
  {
    name: "Gold Clipper",
    referrals: 30,
    bonus: "$200 bonus",
    current: false,
    progress: 13,
    icon: Trophy
  }
]

const recentReferrals = [
  {
    name: "Alex Johnson",
    email: "alex@email.com",
    joinedAt: "2024-09-10",
    status: "active",
    earnings: 45,
    avatar: "AJ"
  },
  {
    name: "Sarah Chen",
    email: "sarah@email.com",
    joinedAt: "2024-09-08",
    status: "active",
    earnings: 32,
    avatar: "SC"
  },
  {
    name: "Mike Davis",
    email: "mike@email.com",
    joinedAt: "2024-09-05",
    status: "pending",
    earnings: 0,
    avatar: "MD"
  },
  {
    name: "Emma Wilson",
    email: "emma@email.com",
    joinedAt: "2024-09-01",
    status: "active",
    earnings: 28,
    avatar: "EW"
  }
]

const rewards = [
  {
    type: "signup_bonus",
    description: "Friend signs up and completes onboarding",
    amount: 15,
    status: "available"
  },
  {
    type: "first_clip",
    description: "Friend submits their first approved clip",
    amount: 25,
    status: "available"
  },
  {
    type: "monthly_bonus",
    description: "Friend earns $100+ in a month",
    amount: 50,
    status: "locked"
  },
  {
    type: "tier_bonus",
    description: "Reach referral tier milestone",
    amount: 25,
    status: "available"
  }
]

function ReferralCard({ referral }: { referral: typeof recentReferrals[0] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-foreground bg-green-400/10'
      case 'pending': return 'text-yellow-400 bg-yellow-400/10'
      default: return 'text-muted-foreground bg-muted/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'pending': return Clock
      default: return Clock
    }
  }

  const StatusIcon = getStatusIcon(referral.status)

  return (
    <Card className="bg-card border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center text-white font-medium">
              {referral.avatar}
            </div>
            <div>
              <p className="text-white font-medium">{referral.name}</p>
              <p className="text-muted-foreground text-sm">{referral.email}</p>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(referral.status)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {referral.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Joined {new Date(referral.joinedAt).toLocaleDateString()}
          </span>
          {referral.earnings > 0 && (
            <span className="text-foreground font-medium">
              ${referral.earnings} earned
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TierCard({ tier }: { tier: typeof referralTiers[0] }) {
  const Icon = tier.icon

  return (
    <Card className={`bg-card border-gray-800 ${tier.current ? 'border-green-500/50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Icon className={`w-6 h-6 ${tier.current ? 'text-foreground' : 'text-muted-foreground'}`} />
            <div>
              <h3 className={`font-medium ${tier.current ? 'text-foreground' : 'text-white'}`}>
                {tier.name}
              </h3>
              <p className="text-muted-foreground text-sm">{tier.referrals} referrals</p>
            </div>
          </div>
          {tier.current && (
            <Badge className="bg-foreground">Current</Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-white">{Math.round(tier.progress)}%</span>
          </div>
          <Progress value={tier.progress} className="h-2" />
          <p className="text-foreground text-sm font-medium">{tier.bonus}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function RewardCard({ reward }: { reward: typeof rewards[0] }) {
  return (
    <Card className={`bg-card border-gray-800 ${reward.status === 'locked' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Gift className={`w-4 h-4 ${reward.status === 'available' ? 'text-foreground' : 'text-muted-foreground'}`} />
            <span className="text-white font-medium capitalize">
              {reward.type.replace('_', ' ')}
            </span>
          </div>
          <span className="text-foreground font-bold">${reward.amount}</span>
        </div>
        <p className="text-muted-foreground text-sm">{reward.description}</p>
        {reward.status === 'locked' && (
          <Badge variant="outline" className="mt-2 text-xs">
            Locked
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

export default function ReferralsPage() {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'code') {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } else {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      }
      toast.success("Copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Referrals</h1>
        <p className="text-muted-foreground">Invite friends and earn bonuses for each successful referral.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Referrals</p>
                <p className="text-2xl font-bold text-white">{referralStats.totalReferrals}</p>
              </div>
              <Users className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Referrals</p>
                <p className="text-2xl font-bold text-foreground">{referralStats.activeReferrals}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Earned</p>
                <p className="text-2xl font-bold text-foreground">${referralStats.totalEarned}</p>
              </div>
              <DollarSign className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Rewards</p>
                <p className="text-2xl font-bold text-yellow-400">${referralStats.pendingRewards}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card className="bg-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Your Referral Link</CardTitle>
          <p className="text-muted-foreground text-sm">
            Share this link with friends to start earning referral bonuses.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-muted-foreground text-sm mb-2 block">Referral Code</label>
            <div className="flex space-x-2">
              <Input
                value={referralStats.referralCode}
                readOnly
                className="bg-muted border-border text-white font-mono"
              />
              <Button
                onClick={() => copyToClipboard(referralStats.referralCode, 'code')}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-sm mb-2 block">Referral Link</label>
            <div className="flex space-x-2">
              <Input
                value={referralStats.referralLink}
                readOnly
                className="bg-muted border-border text-white font-mono"
              />
              <Button
                onClick={() => copyToClipboard(referralStats.referralLink, 'link')}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button className="bg-gray-700 hover:bg-gray-600">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="referrals" className="space-y-6">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="referrals" className="text-muted-foreground data-[state=active]:text-white">
            My Referrals
          </TabsTrigger>
          <TabsTrigger value="tiers" className="text-muted-foreground data-[state=active]:text-white">
            Achievement Tiers
          </TabsTrigger>
          <TabsTrigger value="rewards" className="text-muted-foreground data-[state=active]:text-white">
            Reward System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentReferrals.map((referral, index) => (
              <ReferralCard key={index} referral={referral} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {referralTiers.map((tier, index) => (
              <TierCard key={index} tier={tier} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((reward, index) => (
              <RewardCard key={index} reward={reward} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* How It Works */}
      <Card className="bg-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">How Referral Program Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-medium mb-2">1. Share Your Link</h3>
              <p className="text-muted-foreground text-sm">
                Share your unique referral link with friends interested in content creation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-medium mb-2">2. They Join & Earn</h3>
              <p className="text-muted-foreground text-sm">
                When they sign up and start earning, you get rewarded for each milestone.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-medium mb-2">3. You Get Paid</h3>
              <p className="text-muted-foreground text-sm">
                Earn bonuses for each successful referral and unlock higher reward tiers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
