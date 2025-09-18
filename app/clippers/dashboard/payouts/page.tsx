"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign,
  Wallet,
  Mail,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import toast from "react-hot-toast"

// Mock payout history
const payoutHistory = [
  {
    id: "1",
    amount: 500.00,
    method: "USDC Wallet",
    status: "completed",
    requestedAt: "2024-01-10",
    processedAt: "2024-01-11",
    transactionId: "0x1234...abcd"
  },
  {
    id: "2", 
    amount: 250.00,
    method: "PayPal",
    status: "processing",
    requestedAt: "2024-01-14",
    processedAt: null,
    transactionId: null
  },
  {
    id: "3",
    amount: 100.00,
    method: "PayPal", 
    status: "failed",
    requestedAt: "2024-01-08",
    processedAt: "2024-01-09",
    transactionId: null
  }
]

export default function PayoutsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutMethod, setPayoutMethod] = useState("")

  const availableBalance = 847.50 // Mock available balance
  const minimumPayout = 50.00

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(payoutAmount)
    
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

    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Payout request submitted successfully!")
      setPayoutAmount("")
      setPayoutMethod("")
    } catch (error) {
      toast.error("Failed to submit payout request")
    } finally {
      setIsLoading(false)
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
      <h1 className="text-3xl font-light text-foreground">Payouts</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance & Request Payout */}
        <div className="space-y-6">
          {/* Available Balance */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-500 mb-2">
                  ${availableBalance.toFixed(2)}
                </div>
                <p className="text-muted-foreground">
                  Minimum payout: ${minimumPayout.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

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
                      <SelectItem value="usdc">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          USDC Wallet
                        </div>
                      </SelectItem>
                      <SelectItem value="paypal">
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
                  <p>• PayPal: 1-3 business days</p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? "Processing..." : "Request Payout"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Payout History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payoutHistory.map((payout) => (
                <div key={payout.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-white text-lg">
                      ${payout.amount.toFixed(2)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}