'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
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
import toast from 'react-hot-toast'

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
  campaigns?: {
    id: string
    title: string
    status: string
    earnings: number
  }[]
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
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  
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

  useEffect(() => {
    fetchPayoutRequests()
    fetchPayoutSummary()
  }, [])

  // Scroll to highlighted payout when data loads
  useEffect(() => {
    if (highlightId && !loading && payoutRequests.length > 0 && !hasScrolled) {
      setTimeout(() => {
        if (highlightedRef.current) {
          highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHasScrolled(true)
        }
      }, 100)
    }
  }, [highlightId, loading, payoutRequests, hasScrolled])

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
    toast.success(`${label} copied!`, { duration: 2000 })
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
        toast.error(data.error || 'Failed to fetch payout requests')
      }
    } catch (error) {
      toast.error('Failed to fetch payout requests')
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
        toast.success(data.message)
        
        setProcessDialogOpen(false)
        setTransactionId('')
        setNotes('')
        fetchPayoutRequests()
      } else {
        toast.error(data.error || 'Failed to process payout request')
      }
    } catch (error) {
      toast.error('Failed to process payout request')
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
          {requests.map((request) => {
            const isHighlighted = highlightId === request.id
            return (
            <Card 
              key={request.id}
              ref={isHighlighted ? highlightedRef : undefined}
              className={`hover:shadow-md transition-all duration-500 ${
                isHighlighted ? 'bg-muted/80 border-foreground/20' : ''
              }`}
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
                      <div className="font-medium">
                        {request.paymentMethod === 'PAYPAL' ? 'PayPal' :
                         request.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' :
                         request.paymentMethod === 'ETHEREUM' ? 'USDC (Ethereum)' :
                         request.paymentMethod === 'BITCOIN' ? 'Bitcoin' :
                         request.paymentMethod}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(request.paymentDetails, 'Payment details')}
                        className="text-xs text-muted-foreground hover:text-foreground break-all text-left flex items-start gap-1 group"
                      >
                        <span className="break-all">{request.paymentDetails}</span>
                        <Copy className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                      </button>
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

                  {/* Campaign Breakdown */}
                  {request.campaigns && request.campaigns.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Target className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">Campaign(s)</div>
                        <div className="flex flex-wrap gap-1">
                          {request.campaigns.map(c => (
                            <Badge 
                              key={c.id} 
                              variant="outline" 
                              className="text-xs font-normal"
                            >
                              {c.title}
                              <span className="ml-1 text-muted-foreground">${c.earnings.toFixed(0)}</span>
                            </Badge>
                          ))}
                        </div>
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
                        setProcessDialogOpen(true)
                      }}
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Approve
                    </Button>
                  </div>
                )}

                {(request.status === 'APPROVED' || request.status === 'PROCESSING') && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRequest(request)
                        handleProcess('revert')
                      }}
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      Back to Pending
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRequest(request)
                        setNotes(request.notes || '')
                        setProcessDialogOpen(true)
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Mark as Paid
                    </Button>
                  </div>
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
          )})}
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
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owed</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${completedRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedRequests.length} payouts completed
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${pendingRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} requested
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
              ${processingRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfillment</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalUserBalances && summary.totalUserBalances > 0 
                ? Math.round((completedRequests.reduce((sum, r) => sum + r.amount, 0) / 
                    (summary.totalUserBalances + completedRequests.reduce((sum, r) => sum + r.amount, 0))) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Of total earnings paid
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
              All Users with Balance ({usersWithBalances.length})
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>Users who have earned money and can request payouts. Click to copy payment details.</span>
              <span className="font-medium text-foreground">
                Total: ${usersWithBalances.reduce((sum, u) => sum + u.totalEarnings, 0).toFixed(2)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 rounded-t-lg text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-3">User</div>
              <div className="col-span-4">Payment Methods</div>
              <div className="col-span-2 text-center">Clips</div>
              <div className="col-span-2 text-right">Balance</div>
              <div className="col-span-1 text-center">Status</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {usersWithBalances.map((user) => (
                <div 
                  key={user.id} 
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
                >
                  {/* User Info */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm truncate">{user.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="col-span-4 flex flex-wrap gap-1">
                    {user.paypalEmail && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs px-2"
                        onClick={() => copyToClipboard(user.paypalEmail!, 'PayPal')}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        PayPal
                        <Copy className="w-2.5 h-2.5 ml-1 opacity-50" />
                      </Button>
                    )}
                    {user.bitcoinAddress && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs px-2"
                        onClick={() => copyToClipboard(user.bitcoinAddress!, 'Bitcoin')}
                      >
                        <Wallet className="w-3 h-3 mr-1" />
                        BTC
                        <Copy className="w-2.5 h-2.5 ml-1 opacity-50" />
                      </Button>
                    )}
                    {user.walletAddress && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs px-2"
                        onClick={() => copyToClipboard(user.walletAddress!, 'USDC wallet')}
                      >
                        <Wallet className="w-3 h-3 mr-1" />
                        USDC
                        <Copy className="w-2.5 h-2.5 ml-1 opacity-50" />
                      </Button>
                    )}
                    {!user.paypalEmail && !user.walletAddress && !user.bitcoinAddress && (
                      <span className="text-xs text-muted-foreground">No payment set</span>
                    )}
                  </div>
                  
                  {/* Clips */}
                  <div className="col-span-2 text-center text-sm">
                    {user.approvedClips}
                  </div>
                  
                  {/* Balance */}
                  <div className="col-span-2 text-right font-bold text-sm">
                    ${user.totalEarnings.toFixed(2)}
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-1 text-center">
                    {user.hasPendingRequest ? (
                      <Badge variant="outline" className="text-xs px-1.5">
                        <Clock className="w-3 h-3" />
                      </Badge>
                    ) : user.totalEarnings >= 20 ? (
                      <Badge variant="outline" className="text-xs px-1.5 text-green-600 border-green-600/30">
                        <Check className="w-3 h-3" />
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{'<$20'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1.5"><Clock className="w-3 h-3" /></Badge>
                Request pending
              </span>
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1.5 text-green-600 border-green-600/30"><Check className="w-3 h-3" /></Badge>
                Can request payout
              </span>
              <span>{'<$20'} = Below minimum</span>
            </div>
          </CardContent>
        </Card>
      )}

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
                
                {/* Platform Fee Calculation - Admin View */}
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-dashed">
                  <div className="text-xs text-muted-foreground mb-2">💡 Admin: Payout Breakdown</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Requested amount:</span>
                      <span className="text-muted-foreground">${selectedRequest.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Platform fee (10%):</span>
                      <span className="text-muted-foreground">−${(selectedRequest.amount * 0.10).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-dashed my-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Amount to send:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-foreground">${(selectedRequest.amount * 0.90).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => copyToClipboard((selectedRequest.amount * 0.90).toFixed(2), 'Amount to send')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                  </div>
                  <div className="text-sm font-semibold">
                    {selectedRequest.paymentMethod === 'PAYPAL' ? 'PayPal' :
                     selectedRequest.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' :
                     selectedRequest.paymentMethod === 'ETHEREUM' ? 'USDC (Ethereum)' :
                     selectedRequest.paymentMethod === 'BITCOIN' ? 'Bitcoin' :
                     selectedRequest.paymentMethod}
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <label className="text-xs font-medium text-muted-foreground">Payment Address / Details</label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => copyToClipboard(selectedRequest.paymentDetails, 'Payment details')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="text-sm font-mono bg-muted/50 p-2 rounded break-all select-all">
                    {selectedRequest.paymentDetails}
                  </div>
                </div>

                {/* Campaign Breakdown in Dialog */}
                {selectedRequest.campaigns && selectedRequest.campaigns.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <label className="text-xs font-medium text-muted-foreground">Earnings by Campaign</label>
                    </div>
                    <div className="space-y-1">
                      {selectedRequest.campaigns.map(c => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{c.title}</span>
                          <span className="font-medium ml-2">${c.earnings.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                      placeholder="Enter transaction ID from payment provider (e.g., PayPal, blockchain tx hash)"
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

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleProcess('revert')}
                      disabled={processing}
                      className="sm:flex-1"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Move Back to Pending
                    </Button>
                    <Button
                      onClick={() => handleProcess('complete')}
                      disabled={processing || !transactionId}
                      className="sm:flex-1"
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

