"use client"

import { useState, useEffect } from "react"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { useSession } from "@/lib/supabase-auth-provider"
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
  ExternalLink,
  Loader2
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
  const [error, setError] = useState<string | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  // Get display name with fallback logic
  const getDisplayName = () => {
    if (session?.user) {
      // Try to get name from user metadata (updated from database)
      const dbName = session.user.user_metadata?.full_name
      if (dbName && dbName !== ";Updated name;") return dbName

      // Fallback to OAuth name
      const oauthName = session.user.user_metadata?.name ||
                       session.user.user_metadata?.full_name
      if (oauthName) return oauthName

      // Final fallback to email
      return session.user.email?.split('@')[0] || 'Clipper'
    }
    return 'Clipper'
  }


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
      setLoading(true)
      setError(null)
      const response = await fetch("/api/clippers/dashboard")

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentClips(data.recentClips)
        setActiveCampaigns(data.activeCampaigns)
      } else if (response.status === 401) {
        // Authentication error - redirect to login
        router.push("/clippers/login?message=Please log in to access your dashboard")
        return
      } else if (response.status === 404) {
        setError("Your account was not found. Please contact support.")
      } else if (response.status >= 500) {
        setError("Server error. Please try again in a few moments.")
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to load dashboard data")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Network error. Please check your internet connection and try again.")
      } else {
        setError("Failed to load dashboard data. Please try again.")
      }
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


  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Unable to Load Dashboard</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>

            <div className="space-y-3">
              <Button onClick={fetchDashboardData} variant="outline" className="w-full">
                Try Again
              </Button>

              {error.includes("log in") ? (
                <Button asChild className="w-full">
                  <Link href="/clippers/login">Sign In</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/clippers/support">Contact Support</Link>
                </Button>
              )}
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>New to Swivi?</strong> Connect your social accounts and start earning from your content!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Subtle loading indicator */}
      {loading && (
        <div className="fixed top-4 right-4 z-50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {getDisplayName()}
            </p>
          </div>
          {/* Admin Link - Only show for admin users */}
          {session?.user?.role === "ADMIN" && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin Dashboard
              </Button>
            </Link>
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
