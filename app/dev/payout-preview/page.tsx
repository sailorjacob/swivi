"use client"

// DEV ONLY - Delete this file after reviewing designs
// This page shows example payout designs with mock data

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  DollarSign,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp
} from "lucide-react"

// Mock payout data with realistic transaction IDs
const mockPayouts = [
  {
    id: '1',
    amount: 500.00,
    status: 'COMPLETED',
    paymentMethod: 'PAYPAL',
    requestedAt: '2024-12-10T10:00:00Z',
    processedAt: '2024-12-12T14:30:00Z',
    transactionId: '5TY76543WE987654321',
    platformFeeRate: 0.10,
    platformFeeAmount: 50.00,
    netAmount: 450.00
  },
  {
    id: '2',
    amount: 1250.75,
    status: 'COMPLETED',
    paymentMethod: 'BITCOIN',
    requestedAt: '2024-12-08T09:00:00Z',
    processedAt: '2024-12-09T11:00:00Z',
    transactionId: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16',
    platformFeeRate: 0.10,
    platformFeeAmount: 125.08,
    netAmount: 1125.67
  },
  {
    id: '3',
    amount: 320.50,
    status: 'COMPLETED',
    paymentMethod: 'ETHEREUM',
    requestedAt: '2024-12-05T15:00:00Z',
    processedAt: '2024-12-06T10:00:00Z',
    transactionId: '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b',
    platformFeeRate: 0.10,
    platformFeeAmount: 32.05,
    netAmount: 288.45
  },
  {
    id: '4',
    amount: 150.00,
    status: 'APPROVED',
    paymentMethod: 'PAYPAL',
    requestedAt: '2024-12-13T08:00:00Z',
    processedAt: null,
    transactionId: null,
    platformFeeRate: null,
    platformFeeAmount: null,
    netAmount: null
  },
  {
    id: '5',
    amount: 85.00,
    status: 'PENDING',
    paymentMethod: 'BITCOIN',
    requestedAt: '2024-12-13T12:00:00Z',
    processedAt: null,
    transactionId: null,
    platformFeeRate: null,
    platformFeeAmount: null,
    netAmount: null
  },
  {
    id: '6',
    amount: 200.00,
    status: 'REJECTED',
    paymentMethod: 'PAYPAL',
    requestedAt: '2024-12-01T10:00:00Z',
    processedAt: '2024-12-02T09:00:00Z',
    notes: 'Invalid PayPal email provided',
    transactionId: null,
    platformFeeRate: null,
    platformFeeAmount: null,
    netAmount: null
  }
]

// Mock earnings data
const mockEarnings = {
  totalEarned: 3847.50,  // All time earnings (gross)
  payableBalance: 847.50,  // What they can request now (from completed campaigns)
  activeCampaignEarnings: 1200.00,  // Earnings from active campaigns (not payable yet)
  completedCampaignEarnings: 2647.50,  // Earnings from completed campaigns
  totalPaidOut: 1800.00,  // Already paid out
  minimumPayout: 20.00
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'border-green-500/30 text-green-400 bg-green-500/10'
    case 'pending':
      return 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
    case 'approved':
    case 'processing':
      return 'border-blue-500/30 text-blue-400 bg-blue-500/10'
    case 'rejected':
      return 'border-red-500/30 text-red-400 bg-red-500/10'
    default:
      return 'border-border text-foreground'
  }
}

export default function PayoutPreviewPage() {
  const { totalEarned, payableBalance, activeCampaignEarnings, totalPaidOut, minimumPayout } = mockEarnings

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <h1 className="text-lg font-bold text-yellow-400">⚠️ DEV PREVIEW PAGE</h1>
        <p className="text-sm text-muted-foreground">This page shows mock payout designs exactly as creators see them.</p>
        <p className="text-xs text-muted-foreground mt-1">Path: /app/dev/payout-preview/page.tsx - Delete after review</p>
      </div>

      {/* SECTION 1: Earnings Overview Cards */}
      <h2 className="text-xl font-bold mb-4">📊 Earnings Overview (as shown to creators)</h2>
      <p className="text-sm text-muted-foreground mb-4">These cards show at the top of the payouts page</p>
      
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
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${activeCampaignEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available when campaigns end</p>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Box */}
      <div className="mb-8 p-4 bg-muted/30 border border-border rounded-lg">
        <h3 className="font-bold text-foreground mb-2">📝 Assessment: Earnings Display</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li><strong>Total Earned:</strong> Shows gross earnings (before any fees). This is accurate - it's what they earned from approved clips.</li>
          <li><strong>Payable Balance:</strong> Shows what they can request NOW (from completed campaigns only). Also gross amount.</li>
          <li><strong>Important:</strong> These are GROSS amounts. The 10% transaction fee is only deducted when they actually request and receive a payout.</li>
          <li><strong>Example:</strong> If Total Earned is $1000, they earned $1000. When they request payout, they receive $900 after the 10% fee.</li>
        </ul>
      </div>

      {/* SECTION 2: Payout Request Form */}
      <h2 className="text-xl font-bold mb-4">💳 Payout Request Form</h2>
      <p className="text-sm text-muted-foreground mb-4">This is shown when they're about to request a payout</p>
      
      <Card className="bg-card border-border mb-8">
        <CardHeader>
          <CardTitle className="text-foreground">Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                
                {/* Fee preview - THIS IS KEY */}
                <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Earnings:</span>
                    <span>${payableBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Transaction fee (10%):</span>
                    <span>−${(payableBalance * 0.10).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border font-medium text-foreground">
                    <span>You'll receive:</span>
                    <span>${(payableBalance * 0.90).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button disabled className="w-full">
              <Wallet className="w-4 h-4 mr-2" />
              Request Payout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Box */}
      <div className="mb-8 p-4 bg-muted/30 border border-border rounded-lg">
        <h3 className="font-bold text-foreground mb-2">📝 Assessment: Request Form</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li><strong>Clear fee disclosure:</strong> Shows the fee BEFORE they submit so there are no surprises.</li>
          <li><strong>Shows final amount:</strong> "You'll receive" clearly states what they'll actually get.</li>
        </ul>
      </div>

      {/* SECTION 3: Payout History */}
      <h2 className="text-xl font-bold mb-4">📜 Payout History</h2>
      <p className="text-sm text-muted-foreground mb-4">This is how completed and pending payouts appear</p>

      <Card className="bg-card border-border mb-8">
        <CardHeader>
          <CardTitle className="text-foreground">Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPayouts.map((payout) => (
              <div key={payout.id} className="p-4 rounded-lg border bg-muted/30 border-border">
                <div className="flex items-center justify-between mb-3">
                  {/* For completed payouts, show net amount (what was sent) prominently */}
                  {payout.status === 'COMPLETED' && payout.netAmount ? (
                    <div>
                      <div className="font-bold text-foreground text-xl">
                        ${payout.netAmount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Final amount</div>
                    </div>
                  ) : (
                    <div className="font-bold text-foreground text-lg">
                      ${payout.amount.toFixed(2)}
                    </div>
                  )}
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
                  {/* For completed payouts, show fee breakdown */}
                  {payout.status === 'COMPLETED' && payout.platformFeeAmount != null && (
                    <div className="mb-3 p-2 bg-muted/50 rounded text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Earnings:</span>
                        <span className="text-foreground">${payout.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction fee ({((payout.platformFeeRate || 0.10) * 100).toFixed(0)}%):</span>
                        <span className="text-muted-foreground">−${payout.platformFeeAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border">
                        <span className="font-medium text-foreground">You received:</span>
                        <span className="font-medium text-foreground">${(payout.netAmount || payout.amount).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Transaction ID for completed payouts - FULL ADDRESS */}
                  {payout.status === 'COMPLETED' && payout.transactionId && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Confirmation:</span>
                      <span className="text-foreground font-mono text-xs break-all bg-muted/30 p-2 rounded">{payout.transactionId}</span>
                    </div>
                  )}

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
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="text-foreground">
                        {new Date(payout.processedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {payout.notes && payout.status !== 'COMPLETED' && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <span className="text-muted-foreground text-xs">Note: </span>
                      <span className="text-foreground text-xs">{payout.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assessment Box */}
      <div className="mb-8 p-4 bg-muted/30 border border-border rounded-lg">
        <h3 className="font-bold text-foreground mb-2">📝 Assessment: Payout History</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li><strong>Completed payouts:</strong> Show the FINAL amount prominently (after fee), with "Final amount" label.</li>
          <li><strong>Fee breakdown:</strong> Clear breakdown showing Earnings → Fee → You received.</li>
          <li><strong>Transaction IDs:</strong> Now showing FULL addresses with break-all for long crypto hashes.</li>
          <li><strong>Pending/Processing:</strong> Show the requested (gross) amount since fee hasn't been applied yet.</li>
        </ul>
      </div>

      {/* Summary */}
      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <h3 className="font-bold text-green-400 mb-2">✅ Summary: How Earnings Flow</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
          <li><strong>Clip approved:</strong> Earnings added to "Total Earned" (gross amount, e.g., $100)</li>
          <li><strong>Campaign completes:</strong> Earnings move to "Payable Balance" (still gross)</li>
          <li><strong>Request payout:</strong> Form shows fee preview - "$100 earnings, -$10 fee, you'll receive $90"</li>
          <li><strong>Payout completed:</strong> History shows "$90" as the Final amount with full breakdown</li>
        </ol>
        <p className="text-sm text-muted-foreground mt-3">
          <strong>Key insight:</strong> "Total Earned" is always gross. The fee is only visible/deducted at payout time.
        </p>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>View this page at: <code className="bg-muted px-2 py-1 rounded">/dev/payout-preview</code></p>
      </div>
    </div>
  )
}
