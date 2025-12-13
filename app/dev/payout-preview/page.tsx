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
  XCircle
} from "lucide-react"

// Mock payout data
const mockPayouts = [
  {
    id: '1',
    amount: 500.00,
    status: 'COMPLETED',
    paymentMethod: 'PAYPAL',
    requestedAt: '2024-12-10T10:00:00Z',
    processedAt: '2024-12-12T14:30:00Z',
    transactionId: 'PAYPAL-TXN-ABC123XYZ',
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
    transactionId: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
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
    transactionId: '0x1234567890abcdef1234567890abcdef12345678',
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
  const mockPayableBalance = 847.50

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <h1 className="text-lg font-bold text-yellow-400">⚠️ DEV PREVIEW PAGE</h1>
        <p className="text-sm text-muted-foreground">This page shows mock payout designs. Delete this file after review.</p>
        <p className="text-xs text-muted-foreground mt-1">Path: /app/dev/payout-preview/page.tsx</p>
      </div>

      <h2 className="text-xl font-bold mb-4">Payout Request Form Preview</h2>
      
      {/* Request Form Preview */}
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
                  <span className="text-2xl font-bold text-foreground">{mockPayableBalance.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Full balance from completed campaigns
                </p>
                
                {/* Fee preview */}
                <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Earnings:</span>
                    <span>${mockPayableBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Transaction fee (10%):</span>
                    <span>−${(mockPayableBalance * 0.10).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border font-medium text-foreground">
                    <span>You'll receive:</span>
                    <span>${(mockPayableBalance * 0.90).toFixed(2)}</span>
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

      <h2 className="text-xl font-bold mb-4">Payout History Preview</h2>

      {/* Payout History Preview */}
      <Card className="bg-card border-border">
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
                      <div className="text-xs text-muted-foreground">Amount sent to you</div>
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

                  {/* Transaction ID for completed payouts */}
                  {payout.status === 'COMPLETED' && payout.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmation:</span>
                      <span className="text-foreground font-mono text-xs truncate max-w-[200px]">{payout.transactionId}</span>
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

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>View this page at: <code className="bg-muted px-2 py-1 rounded">/dev/payout-preview</code></p>
      </div>
    </div>
  )
}

