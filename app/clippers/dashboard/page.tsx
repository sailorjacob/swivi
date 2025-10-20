"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardData {
  stats: Array<{
    title: string
    value: string
    change: string
    icon: string
  }>
  recentClips: Array<{
    id: string
    title: string
    campaign: string
    status: string
    views: number
    earnings: number
    clipUrl: string
    platform: string
  }>
  activeCampaigns: number
}

export default function ClipperDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated" || (!loading && !session?.user)) {
      router.push("/clippers/login")
    }
  }, [status, session, router, loading])

  // Fetch dashboard data
  useEffect(() => {
    if (status === "authenticated" && session?.user && loading) {
      fetchDashboardData()
    }
  }, [status, session])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📊 Fetching dashboard data for user:', session?.user?.email)

      const response = await authenticatedFetch("/api/clippers/dashboard")

      if (response.ok) {
        const dashboardData = await response.json()
        console.log('✅ Dashboard data loaded:', dashboardData)
        setData(dashboardData)
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-4">Dashboard Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchDashboardData}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard render
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {data?.stats?.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-sm mt-1 text-muted-foreground">{stat.change}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="w-6 h-6 bg-muted-foreground/20 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )) || (
          // Fallback stats
          <>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total Earned</p>
                    <p className="text-2xl font-bold text-foreground mt-1">$0.00</p>
                    <p className="text-sm mt-1 text-muted-foreground">Start earning</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Active Campaigns</p>
                    <p className="text-2xl font-bold text-foreground mt-1">0</p>
                    <p className="text-sm mt-1 text-muted-foreground">Join campaigns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Clips */}
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-6">Recent Clips</h2>

        {data?.recentClips?.length > 0 ? (
          <div className="space-y-4">
            {data.recentClips.map((clip) => (
              <Card key={clip.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          clip.status === 'approved' ? 'bg-green-100 text-green-800' :
                          clip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {clip.status}
                        </span>
                        <span className="text-sm text-muted-foreground">{clip.platform}</span>
                      </div>

                      <h4 className="text-foreground font-medium mb-1">{clip.title}</h4>
                      <p className="text-muted-foreground text-sm mb-2">{clip.campaign}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{clip.views.toLocaleString()} views</span>
                        {clip.earnings > 0 && (
                          <span>${clip.earnings.toFixed(2)} earned</span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(clip.clipUrl, '_blank')}
                      >
                        View Clip
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No clips submitted yet</h3>
              <p className="text-muted-foreground mb-4">
                Start earning by submitting clips to active campaigns
              </p>
              <Link href="/clippers/dashboard/campaigns">
                <Button>Submit Your First Clip</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Admin Link */}
      {session?.user?.role === "ADMIN" && (
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="outline">🛡️ Admin Dashboard</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
