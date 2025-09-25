"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import Image from "next/image"
import { ClipSubmissionModal } from "@/components/clippers/clip-submission-modal"

// Real stats - will be populated from user's actual data
const stats = [
  {
    title: "Total Earned",
    value: "$0.00",
    change: "Start earning from approved clips",
    changeType: "neutral" as const,
    icon: DollarSign,
    color: "text-foreground"
  },
  {
    title: "Active Campaigns",
    value: "2",
    change: "Available to join",
    changeType: "neutral" as const,
    icon: Target,
    color: "text-muted-foreground"
  },
  {
    title: "Clips Submitted",
    value: "0",
    change: "Submit your first clip",
    changeType: "neutral" as const,
    icon: Play,
    color: "text-muted-foreground"
  },
  {
    title: "Total Views",
    value: "0",
    change: "Grow your audience",
    changeType: "neutral" as const,
    icon: Eye,
    color: "text-muted-foreground"
  }
]

// User's recent clips - will be loaded from database
const recentClips: any[] = []

// Real active campaigns from the campaigns page
const activeCampaigns = [
  {
    id: "campaign-1",
    title: "Owning Manhattan Netflix Series",
    creator: "Owning Manhattan",
    budget: 3000,
    spent: 750,
    deadline: "6 days left",
    payout: "$1.25 per 1K views",
    progress: 25,
    image: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif"
  },
  {
    id: "campaign-2",
    title: "Sportz Playz Betting Campaign",
    creator: "Sportz Playz", 
    budget: 2500,
    spent: 1200,
    deadline: "3 days left",
    payout: "$1.50 per 1K views",
    progress: 48,
    image: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png"
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
            <p className="text-sm mt-1 text-muted-foreground">
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
          <div className="flex items-center gap-3">
            {campaign.image && (
              <Image
                src={campaign.image}
                alt={campaign.creator}
                width={32}
                height={32}
                className="rounded-md object-cover ring-1 ring-border"
                unoptimized
              />
            )}
            <h4 className="text-white font-medium">{campaign.title}</h4>
          </div>
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
          className="w-full mt-4"
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
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log("🔍 Dashboard session check:", { status, session })
    
    if (status === "loading") {
      console.log("⏳ Session loading...")
      return
    }
    
    if (status === "unauthenticated") {
      console.log("❌ Not authenticated, redirecting to login")
      router.replace("/clippers/login")
      return
    }
    
    if (session) {
      console.log("✅ User authenticated:", session.user)
    }
  }, [status, session, router])

  const handleSubmitClip = (campaign: typeof activeCampaigns[0]) => {
    setSelectedCampaignForSubmission(campaign)
    setSubmissionModalOpen(true)
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (status === "unauthenticated") {
    return null
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
      <div className="grid grid-cols-1 gap-8">
        {/* Recent Clips */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-white">Recent Clips</h2>
            <Link href="/clippers/dashboard/profile">
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {recentClips.length > 0 ? (
              recentClips.map((clip) => (
                <RecentClipCard key={clip.id} clip={clip} />
              ))
            ) : (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No clips submitted yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start earning by submitting clips to active campaigns
                </p>
                <Link href="/clippers/dashboard/campaigns">
                  <Button>
                    Browse Campaigns
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Active Campaigns - Hidden */}
        {/* <div>
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
        </div> */}
      </div>


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
