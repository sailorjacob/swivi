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
import { DollarSign, Check, X, Clock, AlertCircle, User, Mail, CreditCard, Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react'
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
    totalEarnings: number
  }
}

export default function AdminPayoutsPage() {
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null)
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPayoutRequests()
  }, [])

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-slate-100 text-slate-700 border-slate-300',
      APPROVED: 'bg-blue-100 text-blue-700 border-blue-300',
      PROCESSING: 'bg-amber-100 text-amber-700 border-amber-300',
      COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      REJECTED: 'bg-red-100 text-red-700 border-red-300'
    }
    return colors[status] || colors.PENDING
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      PENDING: <Clock className="w-4 h-4" />,
      APPROVED: <AlertCircle className="w-4 h-4" />,
      PROCESSING: <Clock className="w-4 h-4" />,
      COMPLETED: <CheckCircle2 className="w-4 h-4" />,
      REJECTED: <XCircle className="w-4 h-4" />
    }
    return icons[status] || icons.PENDING
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
              className="hover:shadow-lg transition-all duration-200 border-slate-200 bg-gradient-to-br from-white to-slate-50/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-slate-500" />
                      <CardTitle className="text-base font-semibold text-slate-900">
                        {request.user.name || 'Unknown User'}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Mail className="w-3 h-3" />
                      {request.user.email}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Amount Section */}
                <div className="bg-slate-900 text-white rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">Payout Amount</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6" />
                    <span className="text-3xl font-bold">{request.amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500">Payment Method</div>
                      <div className="font-medium text-slate-900 truncate">{request.paymentMethod}</div>
                      <div className="text-xs text-slate-600 truncate">{request.paymentDetails}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-slate-500">Current Balance</div>
                      <div className="font-medium text-slate-900">${request.user.totalEarnings.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-slate-500">Requested</div>
                      <div className="font-medium text-slate-900">
                        {new Date(request.requestedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-slate-600">
                        {new Date(request.requestedAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>

                  {request.transactionId && (
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500">Transaction ID</div>
                        <div className="font-mono text-xs text-slate-900 truncate">{request.transactionId}</div>
                      </div>
                    </div>
                  )}

                  {request.notes && (
                    <div className="flex items-start gap-2 text-sm bg-slate-50 p-2.5 rounded-md">
                      <FileText className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500 mb-0.5">Notes</div>
                        <div className="text-xs text-slate-700 line-clamp-2">{request.notes}</div>
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
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
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
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
                  <div className="flex items-center justify-center gap-2 py-2 text-emerald-700 bg-emerald-50 rounded-md">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Payment Completed</span>
                  </div>
                )}

                {request.status === 'REJECTED' && (
                  <div className="flex items-center justify-center gap-2 py-2 text-red-700 bg-red-50 rounded-md">
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
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Payout Management</h1>
          <p className="text-slate-300">
            Review and process clipper payout requests
          </p>
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Pending</CardTitle>
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{pendingRequests.length}</div>
            <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {pendingRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Processing</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{processingRequests.length}</div>
            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {processingRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Completed</CardTitle>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{completedRequests.length}</div>
            <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {completedRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} paid out
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Rejected</CardTitle>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{rejectedRequests.length}</div>
            <p className="text-sm text-red-600 mt-1">
              Not processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Requests Cards */}
      <div className="space-y-4">
        <Tabs defaultValue="pending" className="w-full" onValueChange={(value) => {
          if (value === 'all') {
            fetchPayoutRequests()
          } else {
            fetchPayoutRequests(value.toUpperCase())
          }
        }}>
          <TabsList className="bg-slate-100 border border-slate-200">
            <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
              Pending <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200 text-xs font-medium">{pendingRequests.length}</span>
            </TabsTrigger>
            <TabsTrigger value="processing" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
              Processing <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200 text-xs font-medium">{processingRequests.length}</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
              Completed <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200 text-xs font-medium">{completedRequests.length}</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
              Rejected <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200 text-xs font-medium">{rejectedRequests.length}</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">
              All <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200 text-xs font-medium">{payoutRequests.length}</span>
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
            <DialogTitle className="text-xl font-bold text-slate-900">Process Payout Request</DialogTitle>
            <DialogDescription className="text-slate-600">
              Review and process this payout request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              {/* User and Amount Info Card */}
              <div className="bg-slate-900 text-white rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-slate-400" />
                      <div className="font-semibold">{selectedRequest.user.name}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Mail className="w-3 h-3" />
                      {selectedRequest.user.email}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                  <div>
                    <div className="text-xs text-slate-400">Payout Amount</div>
                    <div className="flex items-center gap-1 text-2xl font-bold">
                      <DollarSign className="w-5 h-5" />
                      {selectedRequest.amount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Current Balance</div>
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <DollarSign className="w-4 h-4" />
                      {selectedRequest.user.totalEarnings.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <label className="text-xs font-medium text-slate-600">Payment Method</label>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{selectedRequest.paymentMethod}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <label className="text-xs font-medium text-slate-600">Payment Details</label>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 truncate">{selectedRequest.paymentDetails}</div>
                </div>
              </div>

              {selectedRequest.status === 'PENDING' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Notes (optional)</label>
                    <Textarea
                      placeholder="Add notes about this payout..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="border-slate-300 focus:border-slate-500"
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={() => handleProcess('reject')}
                      disabled={processing}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Request
                    </Button>
                    <Button
                      className="bg-slate-900 hover:bg-slate-800 text-white"
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
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Transaction ID *</label>
                    <Input
                      placeholder="Enter transaction ID from payment provider (e.g., PayPal, Stripe)"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="border-slate-300 focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Notes (optional)</label>
                    <Textarea
                      placeholder="Add notes about this payout..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="border-slate-300 focus:border-slate-500"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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

