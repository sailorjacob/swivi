"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  DollarSign,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  Banknote,
  ArrowUpRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import toast from "react-hot-toast"

// Mock data
const payoutHistory = [
  {
    id: "PAY-001",
    amount: 320.00,
    method: "PayPal",
    status: "completed",
    date: "2024-09-15",
    description: "Campaign earnings - August 2024",
    transactionId: "PAY_ABC123456"
  },
  {
    id: "PAY-002",
    amount: 185.50,
    method: "PayPal",
    status: "completed",
    date: "2024-08-15",
    description: "Campaign earnings - July 2024",
    transactionId: "PAY_DEF789012"
  },
  {
    id: "PAY-003",
    amount: 275.75,
    method: "PayPal",
    status: "processing",
    date: "2024-09-01",
    description: "Campaign earnings - August 2024",
    transactionId: null
  },
  {
    id: "PAY-004",
    amount: 95.25,
    method: "PayPal",
    status: "pending",
    date: "2024-08-28",
    description: "Bonus earnings - Viral clip",
    transactionId: null
  }
]

const paymentMethods = [
  {
    id: "paypal",
    name: "PayPal",
    description: "Fast and secure payments worldwide",
    icon: CreditCard,
    connected: true,
    email: "clipper@example.com"
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    description: "USDC on Ethereum network",
    icon: Wallet,
    connected: false,
    address: ""
  }
]

const earningsBreakdown = {
  totalEarned: 2847.50,
  availableForPayout: 475.25,
  pendingApproval: 320.75,
  inProcessing: 275.75,
  minimumPayout: 50.00
}

function PayoutCard({ payout }: { payout: typeof payoutHistory[0] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-foreground bg-green-400/10'
      case 'processing': return 'text-yellow-400 bg-yellow-400/10'
      case 'pending': return 'text-white bg-white/10'
      case 'failed': return 'text-red-400 bg-red-400/10'
      default: return 'text-muted-foreground bg-muted/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'processing': return Clock
      case 'pending': return Clock
      case 'failed': return AlertCircle
      default: return Clock
    }
  }

  const StatusIcon = getStatusIcon(payout.status)

  return (
    <Card className="bg-card border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <StatusIcon className={`w-5 h-5 ${getStatusColor(payout.status).split(' ')[0]}`} />
            <Badge variant="outline" className={getStatusColor(payout.status)}>
              {payout.status}
            </Badge>
          </div>
          <span className="text-muted-foreground text-sm">{payout.date}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-medium">{payout.description}</p>
            <p className="text-muted-foreground text-sm">ID: {payout.id}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">${payout.amount}</p>
            <p className="text-muted-foreground text-sm">{payout.method}</p>
          </div>
        </div>

        {payout.transactionId && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <span className="text-muted-foreground text-sm">Transaction ID</span>
            <span className="text-muted-foreground text-sm font-mono">{payout.transactionId}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PaymentMethodCard({ method }: { method: typeof paymentMethods[0] }) {
  const Icon = method.icon

  return (
    <Card className="bg-card border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-muted rounded-lg">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium">{method.name}</h3>
              <p className="text-muted-foreground text-sm">{method.description}</p>
            </div>
          </div>
          <Badge variant={method.connected ? "default" : "outline"} className={method.connected ? "bg-foreground" : ""}>
            {method.connected ? "Connected" : "Not Connected"}
          </Badge>
        </div>

        {method.connected && method.email && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-muted-foreground text-sm">
              <span className="text-muted-foreground">Email:</span> {method.email}
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          {method.connected ? (
            <>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
                Update
              </Button>
              <Button variant="outline" size="sm" className="border-red-700 text-red-400 hover:bg-red-900">
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" className="bg-foreground hover:bg-foreground/90">
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function PayoutsPage() {
  const [requestAmount, setRequestAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("")

  const handlePayoutRequest = () => {
    const amount = parseFloat(requestAmount)
    if (!amount || amount < earningsBreakdown.minimumPayout) {
      toast.error(`Minimum payout amount is $${earningsBreakdown.minimumPayout}`)
      return
    }
    if (amount > earningsBreakdown.availableForPayout) {
      toast.error("Amount exceeds available balance")
      return
    }
    // TODO: Submit payout request to backend
    toast.success("Payout request submitted successfully!")
    setRequestAmount("")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Payouts</h1>
        <p className="text-muted-foreground">Manage your earnings and payment methods.</p>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Earned</p>
                <p className="text-2xl font-bold text-white">${earningsBreakdown.totalEarned}</p>
              </div>
              <DollarSign className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Available</p>
                <p className="text-2xl font-bold text-foreground">${earningsBreakdown.availableForPayout}</p>
              </div>
              <Banknote className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">In Processing</p>
                <p className="text-2xl font-bold text-yellow-400">${earningsBreakdown.inProcessing}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Min. Payout</p>
                <p className="text-2xl font-bold text-white">${earningsBreakdown.minimumPayout}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="history" className="text-muted-foreground data-[state=active]:text-white">
            Payment History
          </TabsTrigger>
          <TabsTrigger value="request" className="text-muted-foreground data-[state=active]:text-white">
            Request Payout
          </TabsTrigger>
          <TabsTrigger value="methods" className="text-muted-foreground data-[state=active]:text-white">
            Payment Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-card border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Payout History</CardTitle>
              <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutHistory.map((payout) => (
                  <PayoutCard key={payout.id} payout={payout} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Request New Payout</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Available balance: <span className="text-foreground font-medium">${earningsBreakdown.availableForPayout}</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="amount" className="text-white">Amount to Withdraw</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      className="pl-10 bg-muted border-border text-white"
                    />
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Minimum: ${earningsBreakdown.minimumPayout}
                  </p>
                </div>

                <div>
                  <Label htmlFor="method" className="text-white">Payment Method</Label>
                  <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                    <SelectTrigger className="bg-muted border-border text-white">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {paymentMethods.filter(m => m.connected).map((method) => (
                        <SelectItem key={method.id} value={method.id} className="text-white">
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handlePayoutRequest}
                  className="w-full bg-foreground hover:bg-foreground/90"
                  disabled={!requestAmount || !selectedMethod}
                >
                  Request Payout
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Payout Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="processing" className="border-border">
                    <AccordionTrigger className="text-white hover:text-muted-foreground">
                      Processing Time
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Payout requests are typically processed within 1-3 business days.
                      You'll receive an email confirmation once your payout has been sent.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fees" className="border-border">
                    <AccordionTrigger className="text-white hover:text-muted-foreground">
                      Fees & Charges
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      PayPal payouts may incur fees depending on your location and account type.
                      Cryptocurrency transfers have network fees that are deducted from your payout.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="minimum" className="border-border">
                    <AccordionTrigger className="text-white hover:text-muted-foreground">
                      Minimum Payout
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      The minimum payout amount is ${earningsBreakdown.minimumPayout} to ensure
                      cost-effective processing for all parties involved.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="methods" className="space-y-6">
          <Card className="bg-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Payment Methods</CardTitle>
              <p className="text-muted-foreground text-sm">
                Manage your payout destinations and preferences.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <PaymentMethodCard key={method.id} method={method} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
