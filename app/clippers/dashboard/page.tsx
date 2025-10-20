"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { supabase, authenticatedFetch } from "@/lib/supabase-browser"
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
  viewGrowth: number
  earnings: number
  clipUrl: string
  platform: string
  lastTracked?: string
}

export default function ClipperDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats[]>([])
  const [recentClips, setRecentClips] = useState<RecentClip[]>([])
  const [activeCampaigns, setActiveCampaigns] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get display name with simplified fallback logic
  const getDisplayName = () => {
    if (session?.user) {
      // Use the user's name from the session, or fallback to email prefix
      return session.user.name || session.user.email?.split('@')[0] || 'User'
    }
    return 'User'
  }

  // Show loading state while session is loading
  if (status === 'loading') {
    console.log('⏳ Session still loading, showing loading state')

    // Force session refresh after 3 seconds if stuck
    useEffect(() => {
      const timer = setTimeout(() => {
        console.log('🔄 Force refreshing session...')
        // Try to refresh the session
        supabase.auth.getSession().then(({ data, error }) => {
          console.log('🔄 Session refresh result:', { data: !!data.session, error })
          if (data.session) {
            console.log('✅ Session found, reloading page...')
            window.location.reload()
          }
        })
      }, 3000)

      return () => clearTimeout(timer)
    }, [])

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      </div>
    )
  }

  // Force session refresh if stuck in loading state for too long
  useEffect(() => {
    if (status === 'loading') {
      console.log('🔄 Forcing session refresh...')
      const timer = setTimeout(() => {
        console.log('🔄 Reloading page to refresh session...')
        // Force a session refresh after 5 seconds
        window.location.reload()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [status])

  // Debug session provider state
  useEffect(() => {
    console.log('🔍 Session provider debug:', {
      status,
      hasSession: !!session?.user,
      sessionId: session?.user?.id,
      timestamp: new Date().toISOString()
    })
  }, [status, session])

  const fetchDashboardData = useCallback(async () => {
    // Don't fetch if session is still loading or no session
    if (status === 'loading' || !session?.user) {
      console.log('⏸️ Not fetching dashboard data - session loading or missing')
      return
    }

    // Don't fetch if already fetching
    if (loading) return

    try {
      setLoading(true)
      setError(null)
      console.log('📊 Fetching dashboard data...')
      console.log('🔍 Session status:', status)
      console.log('🔍 Session user:', session?.user)

      const response = await authenticatedFetch("/api/clippers/dashboard")
      console.log('🔍 API Response status:', response.status)
      console.log('🔍 API Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dashboard data loaded successfully:', data)
        console.log('📊 Stats:', data.stats)
        console.log('📊 Recent clips:', data.recentClips)
        setStats(data.stats)
        setRecentClips(data.recentClips)
        setActiveCampaigns(data.activeCampaigns)
      } else if (response.status === 401) {
        console.log('❌ Authentication failed - showing error instead of redirecting')
        // Authentication error - show error but don't redirect to avoid auth loop
        setError("Authentication failed. Please try refreshing the page or logging in again.")
      } else if (response.status === 404) {
        console.log('❌ User not found')
        setError("Your account was not found. Please contact support.")
      } else if (response.status >= 500) {
        console.log('❌ Server error:', response.status)
        setError("Server error. Please try again later.")
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.log('❌ Dashboard API error:', errorData.error)
        setError(errorData.error || "Failed to load dashboard data")
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error)
      console.error("❌ Error type:", typeof error)
      console.error("❌ Error message:", error instanceof Error ? error.message : String(error))
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack')

      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Network error. Please check your internet connection and try again.")
      } else {
        setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : String(error)}`)
      }
    } finally {
      setLoading(false)
    }
  }, [status, session?.user, loading])

  useEffect(() => {
    console.log('🔄 useEffect triggered:', { status, hasSession: !!session?.user })

    if (status === "loading") {
      console.log('⏳ Session still loading, waiting...')
      return
    }

    if (status === "unauthenticated" || !session?.user) {
      console.log('🚪 No session found, redirecting to login')
      router.push("/clippers/login")
      return
    }

    // User is authenticated, fetch dashboard data
    console.log('✅ User authenticated, fetching dashboard data')
    fetchDashboardData()
  }, [session, status, router, fetchDashboardData])

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

  console.log('🎨 Dashboard component rendering with:', {
    loading,
    statsLength: stats.length,
    recentClipsLength: recentClips.length,
    error,
    session: !!session?.user
  })

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

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Dashboard Error</p>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
          {/* Admin Link - Only show for admin users */}
          {session?.user?.role === "ADMIN" && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                🛡️ Admin Dashboard
              </Button>
            </Link>
          )}
          {/* Debug: Show current user role */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-muted-foreground">
              Role: {session?.user?.role || "undefined"}
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
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <span>{clip.views.toLocaleString()} views</span>
                          {clip.viewGrowth !== 0 && (
                            <span className={clip.viewGrowth > 0 ? "text-green-600" : "text-red-600"}>
                              {clip.viewGrowth > 0 ? "+" : ""}{clip.viewGrowth.toLocaleString()} today
                            </span>
                          )}
                          {clip.earnings > 0 && (
                            <span>${(typeof clip.earnings === 'number' ? clip.earnings : parseFloat(clip.earnings || 0)).toFixed(2)} earned</span>
                          )}
                        </div>
                        {clip.lastTracked && (
                          <div className="text-xs text-muted-foreground">
                            Last tracked: {clip.lastTracked}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          <button
                            onClick={() => window.open(clip.clipUrl, '_blank')}
                            className="text-sm text-blue-500 hover:text-blue-700 underline hover:underline-offset-2 transition-colors"
                          >
                            {clip.clipUrl.length > 60 ? `${clip.clipUrl.substring(0, 60)}...` : clip.clipUrl}
                          </button>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(clip.clipUrl, '_blank')}
                        className="ml-4"
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
              <Link href="/clippers/dashboard/campaigns">
                <Button>
                  Submit Your First Clip
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  )
}
}

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
