'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { DollarSign, Check, X, Clock, AlertCircle, User, Mail, CreditCard, Calendar, FileText, CheckCircle2, XCircle, Wallet, Copy, Users, Target, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface PayoutRequest {
  id: string
  amount: number
  status: string
  paymentMethod: string
  paymentDetails: string
  requestedAt: string
  processedAt?: string
  transactionId?: string
  notes?: string
  user: {
    id: string
    name: string
    email: string
    paypalEmail?: string
    walletAddress?: string
    bitcoinAddress?: string
    totalEarnings: number
  }
}

interface UserWithBalance {
  id: string
  name: string | null
  email: string | null
  paypalEmail: string | null
  walletAddress: string | null
  bitcoinAddress: string | null
  totalEarnings: number
  approvedClips: number
  hasPendingRequest: boolean
  pendingRequest: {
    id: string
    amount: number
    status: string
    requestedAt: string
  } | null
}

interface PayoutSummary {
  totalUserBalances: number
  pendingRequestsCount: number
  pendingRequestsTotal: number
  usersWithBalancesCount: number
  completedCampaignsCount: number
}

export default function AdminPayoutsPage() {
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null)
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [summary, setSummary] = useState<PayoutSummary | null>(null)
  const [usersWithBalances, setUsersWithBalances] = useState<UserWithBalance[]>([])
  const [summaryLoading, setSummaryLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPayoutRequests()
    fetchPayoutSummary()
  }, [])

  const fetchPayoutSummary = async () => {
    try {
      setSummaryLoading(true)
      const response = await fetch('/api/admin/payout-summary')
      const data = await response.json()

      if (response.ok) {
        setSummary(data.summary)
        setUsersWithBalances(data.usersWithBalances || [])
      }
    } catch (error) {
      console.error('Error fetching payout summary:', error)
    } finally {
      setSummaryLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`
    })
  }

  const fetchPayoutRequests = async (status?: string) => {
    try {
      setLoading(true)
      const url = status 
        ? `/api/admin/payout-requests?status=${status}`
        : '/api/admin/payout-requests'
      
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setPayoutRequests(data.payoutRequests)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch payout requests',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch payout requests',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (action: 'approve' | 'reject' | 'complete') => {
    if (!selectedRequest) return

    try {
      setProcessing(true)
      
      const response = await fetch(`/api/admin/payout-requests/${selectedRequest.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          transactionId: action === 'complete' ? transactionId : undefined,
          notes
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message
        })
        
        setProcessDialogOpen(false)
        setTransactionId('')
        setNotes('')
        fetchPayoutRequests()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to process payout request',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process payout request',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const openProcessDialog = (request: PayoutRequest) => {
    setSelectedRequest(request)
    setNotes(request.notes || '')
    setProcessDialogOpen(true)
  }

  const renderPayoutCards = (requests: PayoutRequest[]) => (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No payout requests found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <Card 
              key={request.id} 
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-base font-semibold">
                        {request.user.name || 'Unknown User'}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {request.user.email}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Amount Section */}
                <div className="border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-1">Payout Amount</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-muted-foreground" />
                    <span className="text-3xl font-bold">{request.amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">Payment Method</div>
                      <div className="font-medium truncate">
                        {request.paymentMethod === 'PAYPAL' ? 'PayPal' :
                         request.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' :
                         request.paymentMethod === 'STRIPE' ? 'USDC (Stripe)' :
                         request.paymentMethod === 'BITCOIN' ? 'Bitcoin' :
                         request.paymentMethod}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{request.paymentDetails}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">Current Balance</div>
                      <div className="font-medium">${request.user.totalEarnings.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">Requested</div>
                      <div className="font-medium">
                        {new Date(request.requestedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.requestedAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>

                  {request.transactionId && (
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground">Transaction ID</div>
                        <div className="font-mono text-xs truncate">{request.transactionId}</div>
                      </div>
                    </div>
                  )}

                  {request.notes && (
                    <div className="flex items-start gap-2 text-sm bg-muted/50 p-2.5 rounded-md">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-0.5">Notes</div>
                        <div className="text-xs line-clamp-2">{request.notes}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {request.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRequest(request)
                        setNotes(request.notes || '')
                        setProcessDialogOpen(true)
                      }}
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRequest(request)
                        setNotes(request.notes || '')
                        handleProcess('approve')
                      }}
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Approve
                    </Button>
                  </div>
                )}

                {(request.status === 'APPROVED' || request.status === 'PROCESSING') && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedRequest(request)
                      setNotes(request.notes || '')
                      setProcessDialogOpen(true)
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Mark as Paid
                  </Button>
                )}

                {request.status === 'COMPLETED' && (
                  <div className="flex items-center justify-center gap-2 py-2 bg-muted rounded-md">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Payment Completed</span>
                  </div>
                )}

                {request.status === 'REJECTED' && (
                  <div className="flex items-center justify-center gap-2 py-2 bg-muted rounded-md">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Request Rejected</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const pendingRequests = payoutRequests.filter(r => r.status === 'PENDING')
  const processingRequests = payoutRequests.filter(r => ['APPROVED', 'PROCESSING'].includes(r.status))
  const completedRequests = payoutRequests.filter(r => r.status === 'COMPLETED')
  const rejectedRequests = payoutRequests.filter(r => r.status === 'REJECTED')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payout Management</h1>
          <p className="text-muted-foreground">Manage payout requests and user balances</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            fetchPayoutRequests()
            fetchPayoutSummary()
          }}
          disabled={loading || summaryLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(loading || summaryLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User Balances</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary?.totalUserBalances?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {summary?.usersWithBalancesCount || 0} users
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pendingRequestsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${summary?.pendingRequestsTotal?.toFixed(2) || '0.00'} total requested
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users with Balance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.usersWithBalancesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to request payout
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.completedCampaignsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With finalized earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users with Balances Section */}
      {usersWithBalances.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Users with Available Balance
            </CardTitle>
            <CardDescription>
              Users who have earned money and can request payouts. Click to copy payment details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usersWithBalances.slice(0, 10).map((user) => (
                <div 
                  key={user.id} 
                  className="p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{user.name || user.email || 'Unknown'}</span>
                        {user.hasPendingRequest && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Request Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      
                      {/* Payment Methods */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.paypalEmail && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => copyToClipboard(user.paypalEmail!, 'PayPal email')}
                          >
                            <span className="font-medium mr-1">PayPal:</span>
                            {user.paypalEmail}
                            <Copy className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        {user.walletAddress && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => copyToClipboard(user.walletAddress!, 'USDC wallet')}
                          >
                            <span className="font-medium mr-1">USDC:</span>
                            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                            <Copy className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        {user.bitcoinAddress && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => copyToClipboard(user.bitcoinAddress!, 'Bitcoin address')}
                          >
                            <span className="font-medium mr-1">Bitcoin:</span>
                            {user.bitcoinAddress.slice(0, 6)}...{user.bitcoinAddress.slice(-4)}
                            <Copy className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        {!user.paypalEmail && !user.walletAddress && !user.bitcoinAddress && (
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            No payment method set
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        ${user.totalEarnings.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {user.approvedClips} clips
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {usersWithBalances.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  And {usersWithBalances.length - 10} more users with balances...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Requests Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${pendingRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${processingRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${completedRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} paid out
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Not processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Requests Cards */}
      <div className="space-y-4">
        <Tabs defaultValue="pending" className="w-full" onValueChange={(value) => {
          // Always fetch all and filter locally to avoid API mismatch
          // The "processing" tab shows both APPROVED and PROCESSING statuses
          fetchPayoutRequests()
        }}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="processing">
              Processing ({processingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({payoutRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {renderPayoutCards(pendingRequests)}
          </TabsContent>

          <TabsContent value="processing" className="mt-6">
            {renderPayoutCards(processingRequests)}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {renderPayoutCards(completedRequests)}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {renderPayoutCards(rejectedRequests)}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {renderPayoutCards(payoutRequests)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Payout Request</DialogTitle>
            <DialogDescription>
              Review and process this payout request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              {/* User and Amount Info Card */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div className="font-semibold">{selectedRequest.user.name}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {selectedRequest.user.email}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">Payout Amount</div>
                    <div className="flex items-center gap-1 text-2xl font-bold">
                      <DollarSign className="w-5 h-5" />
                      {selectedRequest.amount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Current Balance</div>
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <DollarSign className="w-4 h-4" />
                      {selectedRequest.user.totalEarnings.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                  </div>
                  <div className="text-sm font-semibold">
                    {selectedRequest.paymentMethod === 'PAYPAL' ? 'PayPal' :
                     selectedRequest.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' :
                     selectedRequest.paymentMethod === 'STRIPE' ? 'USDC (Stripe)' :
                     selectedRequest.paymentMethod === 'BITCOIN' ? 'Bitcoin' :
                     selectedRequest.paymentMethod}
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <label className="text-xs font-medium text-muted-foreground">Payment Details</label>
                  </div>
                  <div className="text-sm font-semibold truncate">{selectedRequest.paymentDetails}</div>
                </div>
              </div>

              {selectedRequest.status === 'PENDING' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                    <Textarea
                      placeholder="Add notes about this payout..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleProcess('reject')}
                      disabled={processing}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Request
                    </Button>
                    <Button
                      onClick={() => handleProcess('approve')}
                      disabled={processing}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve Payout
                    </Button>
                  </DialogFooter>
                </>
              )}

              {(selectedRequest.status === 'APPROVED' || selectedRequest.status === 'PROCESSING') && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Transaction ID *</label>
                    <Input
                      placeholder="Enter transaction ID from payment provider (e.g., PayPal, Stripe)"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                    <Textarea
                      placeholder="Add notes about this payout..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleProcess('complete')}
                      disabled={processing || !transactionId}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Paid & Complete
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

