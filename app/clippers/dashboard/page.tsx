"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import {
  DollarSign,
  TrendingUp,
  Target,
  Play,
  Eye,
  ExternalLink,
  Wallet,
  Clock,
  CheckCircle,
  Trash2
} from "lucide-react"

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
    createdAt: string
    initialViews?: string
    currentViews?: string
    viewChange?: string
  }>
  activeCampaigns: number
  availableBalance?: number
  totalEarnings?: number
}

export default function ClipperDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Payout request state
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'PAYPAL' | 'BANK_TRANSFER' | 'STRIPE'>('PAYPAL')
  const [paymentDetails, setPaymentDetails] = useState('')
  const [submittingPayout, setSubmittingPayout] = useState(false)

  // Get icon component from string name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "DollarSign": return DollarSign
      case "Target": return Target
      case "Play": return Play
      case "Eye": return Eye
      case "TrendingUp": return TrendingUp
      default: return DollarSign
    }
  }

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

  const handleRequestPayout = async () => {
    try {
      setSubmittingPayout(true)

      const amount = parseFloat(payoutAmount)
      if (isNaN(amount) || amount < 20) {
        toast({
          title: 'Invalid Amount',
          description: 'Minimum payout is $20.00',
          variant: 'destructive'
        })
        return
      }

      if (!paymentDetails) {
        toast({
          title: 'Payment Details Required',
          description: 'Please enter your payment details',
          variant: 'destructive'
        })
        return
      }

      const response = await authenticatedFetch('/api/clippers/payout-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod,
          paymentDetails
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Payout Requested! 🎉',
          description: `Your request for $${amount.toFixed(2)} has been submitted`
        })
        setPayoutDialogOpen(false)
        setPayoutAmount('')
        setPaymentDetails('')
        fetchDashboardData()
      } else {
        toast({
          title: 'Request Failed',
          description: data.error || 'Failed to submit payout request',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit payout request',
        variant: 'destructive'
      })
    } finally {
      setSubmittingPayout(false)
    }
  }

  const handleDeleteSubmission = async (submissionId: string, hasEarnings: boolean) => {
    if (hasEarnings) {
      toast({
        title: 'Cannot Delete',
        description: 'Submissions with earnings cannot be deleted',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await authenticatedFetch(`/api/admin/submissions/${submissionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Submission Deleted',
          description: 'Your submission has been removed'
        })
        fetchDashboardData() // Refresh the dashboard
      } else {
        const data = await response.json()
        toast({
          title: 'Delete Failed',
          description: data.error || 'Failed to delete submission',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete submission',
        variant: 'destructive'
      })
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
            <Button onClick={fetchDashboardData}>
              Try Again
            </Button>
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
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-light mb-2">Dashboard</h1>
            <p className="text-muted-foreground mb-4">
              Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
            </p>
            
            {/* Compact Earnings Breakdown */}
            {data && (data.totalEarnings > 0 || (data as any).activeCampaignEarnings > 0) && (
              <div className="inline-flex items-center gap-6 text-sm bg-muted/50 px-4 py-2 rounded-lg">
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-semibold">${data.totalEarnings?.toFixed(2) || '0.00'}</span>
                </div>
                {data.availableBalance > 0 && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <div>
                      <span className="text-muted-foreground">Available: </span>
                      <span className="font-semibold text-foreground">${data.availableBalance.toFixed(2)}</span>
                      {data.availableBalance >= 20 && (
                        <Button 
                          size="sm" 
                          variant="default"
                          className="ml-3 h-7 text-xs"
                          onClick={() => {
                            setPayoutAmount(data.availableBalance?.toFixed(2) || '')
                            setPayoutDialogOpen(true)
                          }}
                        >
                          <Wallet className="w-3 h-3 mr-1" />
                          Request Payout
                        </Button>
                      )}
                    </div>
                  </>
                )}
                {(data as any).activeCampaignEarnings > 0 && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <div>
                      <span className="text-muted-foreground">Pending: </span>
                      <span className="font-semibold text-muted-foreground">${((data as any).activeCampaignEarnings).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Admin and Test Links - Top Right */}
          <div className="flex gap-2">
            {/* Test Link - Available to all users */}
            <Link href="/test/view-tracking">
              <Button variant="outline" size="sm">
                🧪 Test View Tracking
              </Button>
            </Link>

            {/* Admin Link */}
            {session?.user?.role === "ADMIN" && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  🛡️ Admin Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {data?.stats?.map((stat, index) => {
          const Icon = getIcon(stat.icon)
          return (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-sm mt-1 text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        }) || (
          // Fallback stats with proper icons
          <>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total Earned</p>
                    <p className="text-2xl font-bold text-foreground mt-1">$0.00</p>
                    <p className="text-sm mt-1 text-muted-foreground">Start earning from approved clips</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <DollarSign className="w-6 h-6 text-muted-foreground" />
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
                    <p className="text-sm mt-1 text-muted-foreground">Available to join</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <Target className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>


      {/* Payout Request Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Submit a payout request for your earnings (minimum $20)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input
                type="number"
                min="20"
                step="0.01"
                placeholder="20.00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: ${data?.availableBalance?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="STRIPE">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                {paymentMethod === 'PAYPAL' ? 'PayPal Email' : 
                 paymentMethod === 'STRIPE' ? 'Wallet Address' : 
                 'Bank Account Details'}
              </label>
              <Input
                type="text"
                placeholder={
                  paymentMethod === 'PAYPAL' ? 'your@email.com' : 
                  paymentMethod === 'STRIPE' ? '0x...' : 
                  'Account number or details'
                }
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayoutDialogOpen(false)}
              disabled={submittingPayout}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={submittingPayout}
            >
              {submittingPayout ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recent Clips */}
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-6">Recent Clips</h2>

        {data?.recentClips?.length > 0 ? (
          <div className="space-y-4">
            {data.recentClips.map((clip) => (
              <Card key={clip.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={`capitalize font-medium ${
                          clip.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' :
                          clip.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' :
                          clip.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800' :
                          'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950/50 dark:text-slate-300 dark:border-slate-800'
                        }`}
                      >
                        {clip.status}
                      </Badge>
                      <span className="text-muted-foreground text-sm">{clip.platform}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-foreground font-medium mb-1">Clip Submission</h4>
                      <p className="text-muted-foreground text-sm mb-2">{clip.campaign}</p>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <span>{clip.views.toLocaleString()} views
                          {clip.viewChange && Number(clip.viewChange) > 0 && (
                            <span className="text-green-600 ml-1">(+{Number(clip.viewChange).toLocaleString()})</span>
                          )}
                        </span>
                        {clip.earnings > 0 && (
                          <span>${clip.earnings.toFixed(2)} earned</span>
                        )}
                        <span>•</span>
                        <span>Submitted {new Date(clip.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: new Date(clip.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>

                      {/* Clean clickable clip URL - just the essential link */}
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        <button
                          onClick={() => window.open(clip.clipUrl, '_blank')}
                          className="text-sm text-blue-500 hover:text-blue-700 underline hover:underline-offset-2 transition-colors"
                          title={`Open clip: ${clip.clipUrl}`}
                        >
                          {clip.clipUrl.length > 60 ? `${clip.clipUrl.substring(0, 60)}...` : clip.clipUrl}
                        </button>
                      </div>
                    </div>
                    
                    {/* Delete button - only show for pending/rejected clips with no earnings */}
                    {(clip.status === 'pending' || clip.status === 'rejected') && clip.earnings === 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your submission.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSubmission(clip.id, clip.earnings > 0)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
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

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
