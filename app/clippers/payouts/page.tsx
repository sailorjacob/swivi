'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/supabase-auth-provider'
import { useRouter } from 'next/navigation'
import { authenticatedFetch } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { Wallet, DollarSign, TrendingUp, ArrowLeft } from 'lucide-react'

interface DashboardData {
  totalEarnings: number
  availableBalance: number
  activeCampaignEarnings?: number
}

export default function ClipperPayoutsPage() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('PAYPAL')
  const [payoutDetails, setPayoutDetails] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push('/clippers/login')
    } else if (session) {
      fetchDashboardData()
    }
  }, [session, sessionLoading])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch('/api/clippers/dashboard')
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    try {
      const response = await authenticatedFetch('/api/clippers/payout-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          paymentMethod: payoutMethod,
          paymentDetails: payoutDetails
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Payout Request Submitted',
          description: 'Your payout request has been submitted for review.'
        })
        setPayoutDialogOpen(false)
        setPayoutAmount('')
        setPayoutDetails('')
        fetchDashboardData()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit payout request',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit payout request',
        variant: 'destructive'
      })
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/clippers/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-light">Payouts & Earnings</h1>
        </div>
        <p className="text-muted-foreground">
          View your earnings and request payouts
        </p>
      </div>

      {/* Earnings Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data?.totalEarnings?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${data?.availableBalance?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">From completed campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${data?.activeCampaignEarnings?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">From active campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Payout Card */}
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Available Balance</p>
                <p className="text-xs text-muted-foreground">From completed campaigns</p>
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${data?.availableBalance?.toFixed(2) || '0.00'}
              </div>
            </div>

            {data && data.availableBalance < 20 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Need ${(20 - (data.availableBalance || 0)).toFixed(2)} more</strong> to request a payout.
                  Minimum payout amount is $20.00.
                </p>
              </div>
            )}

            {data && data.activeCampaignEarnings && data.activeCampaignEarnings > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                  Active Campaign Earnings: ${data.activeCampaignEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  These earnings will be available for payout once the campaigns are completed.
                </p>
              </div>
            )}
          </div>

          {/* Payout Button */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm font-medium">Ready to withdraw?</p>
              <p className="text-xs text-muted-foreground">
                {data && data.availableBalance >= 20 
                  ? 'You can request a payout now'
                  : 'Minimum $20 required to request payout'
                }
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                setPayoutAmount(data?.availableBalance?.toFixed(2) || '')
                setPayoutDialogOpen(true)
              }}
              disabled={!data || data.availableBalance < 20}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Request Payout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payout Request Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Request a payout of your available balance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="20"
                max={data?.availableBalance || 0}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="20.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: ${data?.availableBalance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <Label htmlFor="method">Payment Method</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
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
              <Label htmlFor="details">Payment Details</Label>
              <Input
                id="details"
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder={
                  payoutMethod === 'PAYPAL' 
                    ? 'your@email.com' 
                    : payoutMethod === 'BANK_TRANSFER'
                    ? 'Account number'
                    : 'Payment details'
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={!payoutAmount || parseFloat(payoutAmount) < 20 || !payoutDetails}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

