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
  Trophy,
  ExternalLink
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import Image from "next/image"
import { ClipSubmissionModal } from "@/components/clippers/clip-submission-modal"

// Types for real data
interface DashboardStats {
  title: string
  value: string
  change: string
  changeType: "positive" | "neutral"
  icon: string
  color: string
}

interface RecentClip {
  id: string
  title: string
  campaign: string
  status: string
  submittedAt: string
  views: number
  earnings: number
  clipUrl: string
  platform: string
}

export default function ClipperDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats[]>([])
  const [recentClips, setRecentClips] = useState<RecentClip[]>([])
  const [activeCampaigns, setActiveCampaigns] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  // Check if current user is an admin
  const isAdmin = session?.user?.role === "ADMIN"

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/clippers/login")
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/clippers/dashboard")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentClips(data.recentClips)
        setActiveCampaigns(data.activeCampaigns)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "DollarSign": return DollarSign
      case "Target": return Target
      case "Play": return Play
      case "Eye": return Eye
      default: return DollarSign
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-light mb-2">Clipper Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name || session?.user?.email}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Link href="/clippers/dashboard">
                <Button variant="default" size="sm" disabled>
                  Clipper Dashboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = getIcon(stat.icon)
          return (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
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
        })}
      </div>

      {/* Recent Clips Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Recent Clips</h2>
          {/* Removed "View All" button as requested */}
        </div>

        {recentClips.length > 0 ? (
          <div className="space-y-4">
            {recentClips.map((clip) => (
              <Card key={clip.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          clip.status === 'approved' ? 'border-green-500 text-green-700 bg-green-50' :
                          clip.status === 'pending' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                          clip.status === 'rejected' ? 'border-red-500 text-red-700 bg-red-50' :
                          'border-gray-500 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {clip.status}
                      </Badge>
                      <span className="text-muted-foreground text-sm">{clip.platform}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">{clip.submittedAt}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-foreground font-medium mb-1">{clip.title}</h4>
                      <p className="text-muted-foreground text-sm mb-2">{clip.campaign}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{clip.views.toLocaleString()} views</span>
                        {clip.earnings > 0 && (
                          <span>${clip.earnings.toFixed(2)} earned</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(clip.clipUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No clips submitted yet</h3>
              <p className="text-muted-foreground mb-4">
                Start earning by submitting clips to active campaigns
              </p>
              <Button onClick={() => setShowSubmissionModal(true)}>
                Submit Your First Clip
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Campaigns Section */}
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-6">Active Campaigns ({activeCampaigns})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/clippers/campaigns">
            <Card className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Browse Campaigns</h3>
                  <Target className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  Discover active campaigns and start earning from your content
                </p>
                <Button variant="outline" className="w-full">
                  View All Campaigns
                </Button>
              </CardContent>
            </Card>
          </Link>

          <div onClick={() => setShowSubmissionModal(true)} className="cursor-pointer">
            <Card className="bg-card border-border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Submit Clip</h3>
                  <Play className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  Submit your content to active campaigns and start earning
                </p>
                <Button className="w-full">
                  Submit Content
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Clip Submission Modal */}
      <ClipSubmissionModal
        open={showSubmissionModal}
        onOpenChange={(open) => {
          setShowSubmissionModal(open)
          if (!open) {
            fetchDashboardData() // Refresh data after submission
          }
        }}
      />
    </div>
  )
}
