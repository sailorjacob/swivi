"use client"

import { useState } from "react"
import {
  DollarSign,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Play,
  Trophy
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { ClipSubmissionModal } from "@/components/clippers/clip-submission-modal"

// Mock data - replace with real data later
const stats = [
  {
    title: "Total Earned",
    value: "$2,847",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: DollarSign,
    color: "text-foreground"
  },
  {
    title: "Active Campaigns",
    value: "3",
    change: "2 ending soon",
    changeType: "neutral" as const,
    icon: Target,
    color: "text-white"
  },
  {
    title: "Clips Submitted",
    value: "127",
    change: "23 this week",
    changeType: "positive" as const,
    icon: Play,
    color: "text-purple-400"
  },
  {
    title: "Avg. Views",
    value: "12.4K",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: Eye,
    color: "text-orange-400"
  }
]

const recentClips = [
  {
    id: "1",
    title: "Viral TikTok Dance Edit",
    campaign: "Dance Challenge 2024",
    status: "approved",
    views: 15420,
    earnings: 85,
    submittedAt: "2 hours ago"
  },
  {
    id: "2",
    title: "Comedy Skit Compilation",
    campaign: "Funny Moments",
    status: "pending",
    views: 0,
    earnings: 0,
    submittedAt: "5 hours ago"
  },
  {
    id: "3",
    title: "Cooking Tutorial Edit",
    campaign: "Kitchen Hacks",
    status: "rejected",
    views: 3200,
    earnings: 0,
    submittedAt: "1 day ago"
  }
]

const activeCampaigns = [
  {
    id: "1",
    title: "Summer Vibes Collection",
    creator: "Lifestyle Guru",
    budget: 2500,
    spent: 1800,
    deadline: "2 days left",
    payout: "$25-75 per clip",
    progress: 72
  },
  {
    id: "2",
    title: "Tech Reviews 2024",
    creator: "Tech Reviewer Pro",
    budget: 5000,
    spent: 3200,
    deadline: "5 days left",
    payout: "$50-150 per clip",
    progress: 64
  },
  {
    id: "3",
    title: "Fitness Motivation",
    creator: "Fit Coach Max",
    budget: 1800,
    spent: 1200,
    deadline: "1 day left",
    payout: "$30-90 per clip",
    progress: 67
  }
]

function StatCard({ stat }: { stat: typeof stats[0] }) {
  const Icon = stat.icon

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            <p className={`text-sm mt-1 ${
              stat.changeType === 'positive' ? 'text-green-500' :
              'text-muted-foreground'
            }`}>
              {stat.change}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentClipCard({ clip }: { clip: typeof recentClips[0] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-foreground bg-muted border-muted-foreground'
      case 'pending': return 'text-muted-foreground bg-background border-muted-foreground'
      case 'rejected': return 'text-muted-foreground bg-muted border-border'
      default: return 'text-muted-foreground bg-background border-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle
      case 'pending': return Clock
      case 'rejected': return AlertCircle
      default: return Clock
    }
  }

  const StatusIcon = getStatusIcon(clip.status)

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-4 h-4 ${getStatusColor(clip.status).split(' ')[0]}`} />
            <Badge variant="outline" className={getStatusColor(clip.status)}>
              {clip.status}
            </Badge>
          </div>
          <span className="text-muted-foreground text-sm">{clip.submittedAt}</span>
        </div>

        <h4 className="text-white font-medium mb-1">{clip.title}</h4>
        <p className="text-muted-foreground text-sm mb-3">{clip.campaign}</p>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {clip.views > 0 ? `${clip.views.toLocaleString()} views` : 'Under review'}
          </span>
          {clip.earnings > 0 && (
            <span className="text-foreground font-medium">${clip.earnings}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CampaignCard({ campaign, onSubmitClip }: { campaign: typeof activeCampaigns[0]; onSubmitClip: (campaign: typeof activeCampaigns[0]) => void }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium">{campaign.title}</h4>
          <Badge variant="outline" className="text-muted-foreground border-muted-foreground">
            {campaign.deadline}
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm mb-4">{campaign.creator}</p>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget Progress</span>
            <span className="text-white">${campaign.spent}/${campaign.budget}</span>
          </div>
          <Progress value={campaign.progress} className="h-2" />
          <p className="text-foreground text-sm font-medium">{campaign.payout}</p>
        </div>

        <Button 
          className="w-full mt-4 bg-foreground hover:bg-foreground/90"
          onClick={() => onSubmitClip(campaign)}
        >
          Submit Clip
        </Button>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false)
  const [selectedCampaignForSubmission, setSelectedCampaignForSubmission] = useState<typeof activeCampaigns[0] | null>(null)

  const handleSubmitClip = (campaign: typeof activeCampaigns[0]) => {
    setSelectedCampaignForSubmission(campaign)
    setSubmissionModalOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your clipping overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Clips */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-white">Recent Clips</h2>
            <Link href="/clippers/dashboard/profile">
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {recentClips.map((clip) => (
              <RecentClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        </div>

        {/* Active Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-white">Active Campaigns</h2>
            <Link href="/clippers/dashboard/campaigns">
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {activeCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} onSubmitClip={handleSubmitClip} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-white">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/clippers/dashboard/campaigns">
              <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                🎯 Browse Active Campaigns
              </Button>
            </Link>
            <Link href="/clippers/dashboard/profile">
              <Button variant="outline" className="w-full">
                Update Profile
              </Button>
            </Link>
            <Link href="/clippers/dashboard/payouts">
              <Button variant="outline" className="w-full">
                Request Payout
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Submission Modal */}
      <ClipSubmissionModal
        open={submissionModalOpen}
        onOpenChange={setSubmissionModalOpen}
        campaign={selectedCampaignForSubmission ? {
          id: selectedCampaignForSubmission.id,
          title: selectedCampaignForSubmission.title,
          creator: selectedCampaignForSubmission.creator,
          payout: selectedCampaignForSubmission.payout
        } : undefined}
      />
    </div>
  )
}
