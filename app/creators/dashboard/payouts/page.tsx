"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { supabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { Badge } from "../../../../components/ui/badge"
import { 
  DollarSign,
  Wallet,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Info
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../../components/ui/tooltip"
import toast from "react-hot-toast"

interface PayoutRequestItem {
  id: string
  amount: number
  status: string
  paymentMethod: string
  requestedAt: string
  processedAt?: string
  notes?: string
}

export default function PayoutsPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  // Removed payoutAmount state - now using full payableBalance only
  const [payoutMethod, setPayoutMethod] = useState<'PAYPAL' | 'BANK_TRANSFER' | 'STRIPE' | 'ETHEREUM' | 'BITCOIN'>('PAYPAL')
  const [payoutSaving, setPayoutSaving] = useState(false)
  const [payoutSuccess, setPayoutSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequestItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  // Payout settings
  const [payoutData, setPayoutData] = useState({
    walletAddress: "",
    paypalEmail: "",
    bitcoinAddress: ""
  })

  const availableBalance = dashboardData?.availableBalance || 0.00
  const totalEarned = dashboardData?.totalEarnings || 0.00
  const activeCampaignEarnings = dashboardData?.activeCampaignEarnings || 0.00
  const completedCampaignEarnings = dashboardData?.completedCampaignEarnings || 0.00
  const payableBalance = dashboardData?.payableBalance || 0.00
  const minimumPayout = 20.00
  
  // Check if user can request payouts (has earnings from completed campaigns)
  const canRequestPayout = payableBalance >= minimumPayout
  const hasOnlyActiveEarnings = activeCampaignEarnings > 0 && completedCampaignEarnings <= 0

  // Load dashboard data (earnings)
  const loadDashboard = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await authenticatedFetch("/api/creators/dashboard")
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
  }, [session])

  // Load payout history
  const loadPayoutHistory = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      setHistoryLoading(true)
      const response = await authenticatedFetch("/api/creators/payout-request")
      if (response.ok) {
        const data = await response.json()
        setPayoutHistory(data.payoutRequests || [])
      }
    } catch (error) {
      console.error("Error loading payout history:", error)
    } finally {
      setHistoryLoading(false)
    }
  }, [session])

  useEffect(() => {
    loadDashboard()
    loadPayoutHistory()
  }, [loadDashboard, loadPayoutHistory])

  // Load user profile data for payout settings
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await authenticatedFetch("/api/user/profile")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setPayoutData({
            walletAddress: userData.walletAddress || "",
            paypalEmail: userData.paypalEmail || "",
            bitcoinAddress: userData.bitcoinAddress || ""
          })
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }

    loadProfile()
  }, [session])

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Use full payableBalance - no partial payouts allowed
    const amount = payableBalance
    
    if (amount < minimumPayout) {
      toast.error(`Minimum payout is $${minimumPayout}`)
      return
    }
    
    if (!payoutMethod) {
      toast.error("Please select a payout method")
      return
    }

    // Get payment details based on method
    let paymentDetails = ''
    if (payoutMethod === 'PAYPAL') {
      paymentDetails = payoutData.paypalEmail || ''
    } else if (payoutMethod === 'ETHEREUM') {
      paymentDetails = payoutData.walletAddress || ''
    } else if (payoutMethod === 'BITCOIN') {
      paymentDetails = payoutData.bitcoinAddress || ''
    }

    if (!paymentDetails) {
      toast.error(`Please set your ${payoutMethod} payment details in Payout Settings first`)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await authenticatedFetch("/api/creators/payout-request", {
        method: "POST",
        body: JSON.stringify({
          amount,
          paymentMethod: payoutMethod,
          paymentDetails
        })
      })

      if (response.ok) {
        toast.success("Payout request submitted successfully!")
        setPayoutMethod("PAYPAL")
        // Refresh dashboard data and payout history
        loadDashboard()
        loadPayoutHistory()
      } else {
        const errorData = await response.json()
        // Handle specific error codes
        if (errorData.code === 'ACTIVE_CAMPAIGNS_ONLY') {
          toast.error("Your earnings are from active campaigns. Payouts available after campaign ends.")
        } else if (errorData.code === 'FULL_BALANCE_REQUIRED') {
          toast.error(`You must request your full balance of $${errorData.payableBalance?.toFixed(2)}. Partial payouts are not allowed.`)
        } else {
          toast.error(errorData.error || "Failed to submit payout request")
        }
      }
    } catch (error) {
      console.error("Error submitting payout request:", error)
      toast.error("Failed to submit payout request")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayoutSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return
    
    setPayoutSaving(true)
    
    try {
      const response = await authenticatedFetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify({
          type: "payout",
          ...payoutData
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser((prev: any) => prev ? { ...prev, ...updatedUser } : null)
        setPayoutSuccess(true)
        toast.success("Payout settings updated successfully!")
        // Reset success state after animation
        setTimeout(() => setPayoutSuccess(false), 3000)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update payout settings")
      }
    } catch (error) {
      console.error("Error updating payout settings:", error)
      toast.error("Failed to update payout settings")
    } finally {
      setPayoutSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-foreground bg-foreground/10 border-foreground/20'
      case 'processing': return 'text-muted-foreground bg-muted border-border'
      case 'failed': return 'text-muted-foreground/70 bg-muted border-border'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  return (
    <div className="space-y-8">
      
      {/* Active Campaign Earnings Notice */}
      {hasOnlyActiveEarnings && (
        <div className="p-4 bg-muted/50 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            Your <span className="font-medium text-foreground">${activeCampaignEarnings.toFixed(2)}</span> in earnings 
            is from active campaigns. Payouts available once campaigns complete.
          </p>
        </div>
      )}
      
      {/* Earnings Overview */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalEarned.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payable Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${payableBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From completed campaigns</p>
            {payableBalance > 0 && payableBalance < minimumPayout && (
              <p className="text-xs text-muted-foreground/70 mt-2">
                Need ${(minimumPayout - payableBalance).toFixed(2)} more to request payout
              </p>
            )}
            {payableBalance <= 0 && completedCampaignEarnings <= 0 && activeCampaignEarnings > 0 && (
              <p className="text-xs text-muted-foreground/70 mt-2">
                Waiting for campaigns to complete
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${activeCampaignEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From active campaigns</p>
            {activeCampaignEarnings > 0 && (
              <p className="text-xs text-muted-foreground/70 mt-2">
                Available after campaign ends
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground mb-4 p-4 bg-muted/30 rounded-lg">
        <p><strong>Minimum payout:</strong> ${minimumPayout.toFixed(2)}</p>
        <p className="mt-1 text-xs">Payouts are only available for earnings from completed campaigns. Keep your videos live to maximize earnings!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Payout */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Request Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayoutRequest} className="space-y-4">
              {/* Full Balance Display - No partial payouts allowed */}
              <div>
                <Label>Payout Amount</Label>
                <div className="mt-1 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-foreground" />
                    <span className="text-2xl font-bold text-foreground">{payableBalance.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Full balance from completed campaigns
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="payout-method">Payout Method</Label>
                <Select value={payoutMethod} onValueChange={(value: 'PAYPAL' | 'BANK_TRANSFER' | 'STRIPE' | 'ETHEREUM' | 'BITCOIN') => {
                  setPayoutMethod(value)
                }} required>
                  <SelectTrigger id="payout-method" className="mt-1">
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAYPAL">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        PayPal
                      </div>
                    </SelectItem>
                    <SelectItem value="BITCOIN">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Bitcoin
                      </div>
                    </SelectItem>
                    <SelectItem value="ETHEREUM">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        USDC (Ethereum)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[280px]">
                              <p className="text-xs">Receive USDC on the default Ethereum chain. NOT <span className="line-through text-red-400">Base</span>, <span className="line-through text-red-400">Optimism</span>, or <span className="line-through text-red-400">Polygon</span>. Please make sure your wallet address is correct.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* USDC Info Alert */}
              {payoutMethod === 'ETHEREUM' && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-blue-200">
                    <p className="font-medium">USDC on Ethereum Mainnet</p>
                    <p className="text-xs mt-1 text-blue-300/80">Receive USDC on the default Ethereum chain. NOT <span className="line-through text-red-400">Base</span>, <span className="line-through text-red-400">Optimism</span>, or <span className="line-through text-red-400">Polygon</span>. Please make sure your wallet address is correct.</p>
                  </div>
                </div>
              )}

              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Processing Time:</p>
                <p>• PayPal: 1-3 business days</p>
                <p>• Bitcoin: 3-4 hours</p>
                <p>• USDC (Ethereum): 1-2 hours</p>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !canRequestPayout}
                size="sm"
                className="w-full"
              >
                {isLoading ? "Processing..." : !canRequestPayout ? (
                  hasOnlyActiveEarnings ? "Campaign In Progress" : `Minimum $${minimumPayout} Required`
                ) : `Request Full Payout ($${payableBalance.toFixed(2)})`}
              </Button>
              {!canRequestPayout && hasOnlyActiveEarnings && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Payouts available when campaign ends
                </p>
              )}
              {canRequestPayout && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  One payout request per balance. Request your full earnings at once.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Payout Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Payout Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayoutSettingsSubmit} className="space-y-4">
              <div>
                <Label htmlFor="paypal">PayPal Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="paypal"
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={payoutData.paypalEmail}
                    onChange={(e) => setPayoutData(prev => ({ ...prev, paypalEmail: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bitcoin">Bitcoin Address</Label>
                <div className="relative mt-1">
                  <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bitcoin"
                    placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                    value={payoutData.bitcoinAddress}
                    onChange={(e) => setPayoutData(prev => ({ ...prev, bitcoinAddress: e.target.value }))}
                    className="pl-10 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="wallet" className="flex items-center gap-2">
                  USDC Wallet Address (Ethereum)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[280px]">
                        <p className="text-xs">Receive USDC on the default Ethereum chain. NOT <span className="line-through text-red-400">Base</span>, <span className="line-through text-red-400">Optimism</span>, or <span className="line-through text-red-400">Polygon</span>. Please make sure your wallet address is correct.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative mt-1">
                  <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="wallet"
                    placeholder="0x742d35Cc6635C0532925a3b8D951D9C9..."
                    value={payoutData.walletAddress}
                    onChange={(e) => setPayoutData(prev => ({ ...prev, walletAddress: e.target.value }))}
                    className="pl-10 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  USDC on Ethereum Mainnet only
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={payoutSaving} 
                size="sm"
                className={`w-full transition-all duration-300 ${payoutSuccess ? 'bg-green-600 hover:bg-green-600' : ''}`}
              >
                {payoutSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : payoutSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Settings Updated!
                  </>
                ) : (
                  "Update Settings"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Payout History */}
      <div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Payout Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : payoutHistory.length > 0 ? (
              <div className="space-y-4">
                {payoutHistory.map((payout) => (
                  <div key={payout.id} className="p-4 rounded-lg border bg-muted/30 border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-foreground text-lg">
                        ${(typeof payout.amount === 'number' ? payout.amount : parseFloat(payout.amount || 0)).toFixed(2)}
                      </div>
                      <Badge variant="outline" className={getStatusColor(payout.status?.toLowerCase())}>
                        <span className="flex items-center gap-1.5">
                          {payout.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                          {payout.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {(payout.status === 'APPROVED' || payout.status === 'PROCESSING') && <AlertCircle className="w-3 h-3" />}
                          {payout.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                          {payout.status}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="text-foreground">
                          {payout.paymentMethod === 'ETHEREUM' ? 'USDC (Ethereum)' : 
                           payout.paymentMethod === 'BITCOIN' ? 'Bitcoin' :
                           payout.paymentMethod === 'PAYPAL' ? 'PayPal' :
                           payout.paymentMethod || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requested:</span>
                        <span className="text-foreground">
                          {new Date(payout.requestedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {payout.processedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processed:</span>
                          <span className="text-foreground">
                            {new Date(payout.processedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {payout.notes && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <span className="text-muted-foreground text-xs">Note: </span>
                          <span className="text-foreground text-xs">{payout.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No payout requests yet</p>
                <p className="text-muted-foreground text-sm">
                  Complete approved campaigns to start earning and request payouts
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}