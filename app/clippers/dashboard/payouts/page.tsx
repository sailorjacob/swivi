"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
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
  Loader2
} from "lucide-react"
import toast from "react-hot-toast"

// Payout history will be loaded from user's actual data
const payoutHistory: any[] = []

export default function PayoutsPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutMethod, setPayoutMethod] = useState<'PAYPAL' | 'BANK_TRANSFER' | 'STRIPE' | 'USDC' | 'BITCOIN'>('PAYPAL')
  const [payoutSaving, setPayoutSaving] = useState(false)
  const [payoutSuccess, setPayoutSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)

  // Payout settings
  const [payoutData, setPayoutData] = useState({
    walletAddress: "",
    paypalEmail: "",
    bitcoinAddress: ""
  })

  const availableBalance = dashboardData?.availableBalance || 0.00
  const totalEarned = dashboardData?.totalEarnings || 0.00
  const activeCampaignEarnings = dashboardData?.activeCampaignEarnings || 0.00
  const minimumPayout = 20.00

  // Load dashboard data (earnings)
  useEffect(() => {
    const loadDashboard = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await authenticatedFetch("/api/clippers/dashboard")
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      }
    }

    loadDashboard()
  }, [session])

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
    
    const amount = parseFloat(payoutAmount)
    
    if (isNaN(amount)) {
      toast.error("Please enter a valid amount")
      return
    }
    
    if (amount < minimumPayout) {
      toast.error(`Minimum payout is $${minimumPayout}`)
      return
    }
    
    if (amount > availableBalance) {
      toast.error("Insufficient balance")
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
    } else if (payoutMethod === 'USDC') {
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
      const response = await authenticatedFetch("/api/clippers/payout-request", {
        method: "POST",
        body: JSON.stringify({
          amount,
          paymentMethod,
          paymentDetails
        })
      })

      if (response.ok) {
        toast.success("Payout request submitted successfully!")
        setPayoutAmount("")
        setPayoutMethod("PAYPAL")
        // Refresh dashboard data to update available balance
        loadDashboard()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to submit payout request")
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
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'processing': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'failed': return 'text-red-500 bg-red-500/10 border-red-500/20'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  return (
    <div className="space-y-8">
      
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${availableBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From completed campaigns</p>
            {availableBalance < minimumPayout && (
              <p className="text-xs text-muted-foreground/70 mt-2">
                Need ${(minimumPayout - availableBalance).toFixed(2)} more to request payout
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
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground mb-4 p-4 bg-muted/30 rounded-lg">
        <p><strong>Minimum payout:</strong> ${minimumPayout.toFixed(2)}</p>
        <p className="mt-1 text-xs">Active campaign earnings will be available for payout once campaigns are completed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Payout */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Request Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayoutRequest} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    min={minimumPayout}
                    max={availableBalance}
                    step="0.01"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="method">Payout Method</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        USDC Wallet
                      </div>
                    </SelectItem>
                    <SelectItem value="BITCOIN">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Bitcoin
                      </div>
                    </SelectItem>
                    <SelectItem value="PAYPAL">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        PayPal
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Processing Times:</p>
                <p>• USDC: 1-2 hours</p>
                <p>• Bitcoin: 1-2 hours</p>
                <p>• PayPal: 1-3 business days</p>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                size="sm"
                className="w-full"
              >
                {isLoading ? "Processing..." : "Request Payout"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payout Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Payout Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayoutSettingsSubmit} className="space-y-4">
              <div>
                <Label htmlFor="wallet">Ethereum Address for USDC</Label>
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
                  Enter your Ethereum address for USDC payments
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your Bitcoin address for Bitcoin payments
                </p>
              </div>

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
        {/* Payout History */}

        {/* Payout History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            {payoutHistory.length > 0 ? (
              <div className="space-y-4">
                {payoutHistory.map((payout) => (
                  <div key={payout.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-white text-lg">
                        ${(typeof payout.amount === 'number' ? payout.amount : parseFloat(payout.amount || 0)).toFixed(2)}
                      </div>
                      <Badge variant="outline" className={getStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="text-white">{payout.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requested:</span>
                        <span className="text-white">{payout.requestedAt}</span>
                      </div>
                      {payout.processedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processed:</span>
                          <span className="text-white">{payout.processedAt}</span>
                        </div>
                      )}
                      {payout.transactionId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">TX ID:</span>
                          <span className="text-white font-mono text-xs">
                            {payout.transactionId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No payout history yet</p>
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