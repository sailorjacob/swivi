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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { DollarSign, Check, X, Clock, AlertCircle } from 'lucide-react'
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      PENDING: { variant: 'outline', icon: <Clock className="w-3 h-3" /> },
      APPROVED: { variant: 'secondary', icon: <AlertCircle className="w-3 h-3" /> },
      PROCESSING: { variant: 'default', icon: <Clock className="w-3 h-3" /> },
      COMPLETED: { variant: 'default', icon: <Check className="w-3 h-3" /> },
      REJECTED: { variant: 'destructive', icon: <X className="w-3 h-3" /> }
    }

    const config = variants[status] || variants.PENDING

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    )
  }

  const renderPayoutRequestsTable = (requests: PayoutRequest[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-left">User</TableHead>
          <TableHead className="text-left">Amount</TableHead>
          <TableHead className="text-left">Method</TableHead>
          <TableHead className="text-left">Status</TableHead>
          <TableHead className="text-left">Requested</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No payout requests found
            </TableCell>
          </TableRow>
        ) : (
          requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="py-4">
                <div>
                  <div className="font-medium">{request.user.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{request.user.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Balance: ${request.user.totalEarnings.toFixed(2)}
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-1 font-medium">
                  <DollarSign className="w-4 h-4" />
                  {request.amount.toFixed(2)}
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div>
                  <Badge variant="outline">{request.paymentMethod}</Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {request.paymentDetails}
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">{getStatusBadge(request.status)}</TableCell>
              <TableCell className="py-4">
                <div className="text-sm">
                  {new Date(request.requestedAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(request.requestedAt).toLocaleTimeString()}
                </div>
              </TableCell>
              <TableCell className="py-4 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openProcessDialog(request)}
                  disabled={request.status === 'COMPLETED' || request.status === 'REJECTED'}
                >
                  Process
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  const pendingRequests = payoutRequests.filter(r => r.status === 'PENDING')
  const processingRequests = payoutRequests.filter(r => ['APPROVED', 'PROCESSING'].includes(r.status))
  const completedRequests = payoutRequests.filter(r => r.status === 'COMPLETED')
  const rejectedRequests = payoutRequests.filter(r => r.status === 'REJECTED')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payout Management</h1>
          <p className="text-muted-foreground">
            Review and process clipper payout requests
          </p>
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              ${pendingRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              ${processingRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              ${completedRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} paid out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Not processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
          <CardDescription>
            Manage clipper payout requests and process payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" onValueChange={(value) => {
            if (value === 'all') {
              fetchPayoutRequests()
            } else {
              fetchPayoutRequests(value.toUpperCase())
            }
          }}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="processing">Processing ({processingRequests.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedRequests.length})</TabsTrigger>
              <TabsTrigger value="all">All ({payoutRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {renderPayoutRequestsTable(pendingRequests)}
            </TabsContent>

            <TabsContent value="processing">
              {renderPayoutRequestsTable(processingRequests)}
            </TabsContent>

            <TabsContent value="completed">
              {renderPayoutRequestsTable(completedRequests)}
            </TabsContent>

            <TabsContent value="rejected">
              {renderPayoutRequestsTable(rejectedRequests)}
            </TabsContent>

            <TabsContent value="all">
              {renderPayoutRequestsTable(payoutRequests)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Clipper</label>
                  <div className="text-sm text-muted-foreground">
                    {selectedRequest.user.name} ({selectedRequest.user.email})
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <div className="text-lg font-bold">${selectedRequest.amount.toFixed(2)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <div className="text-sm text-muted-foreground">{selectedRequest.paymentMethod}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Details</label>
                  <div className="text-sm text-muted-foreground">{selectedRequest.paymentDetails}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">User Balance</label>
                  <div className="text-sm text-muted-foreground">${selectedRequest.user.totalEarnings.toFixed(2)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {selectedRequest.status === 'PENDING' && (
                <>
                  <div>
                    <label className="text-sm font-medium">Notes (optional)</label>
                    <Textarea
                      placeholder="Add notes about this payout..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleProcess('reject')}
                      disabled={processing}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleProcess('approve')}
                      disabled={processing}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </DialogFooter>
                </>
              )}

              {(selectedRequest.status === 'APPROVED' || selectedRequest.status === 'PROCESSING') && (
                <>
                  <div>
                    <label className="text-sm font-medium">Transaction ID</label>
                    <Input
                      placeholder="Enter transaction ID from payment provider"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes (optional)</label>
                    <Textarea
                      placeholder="Add notes about this payout..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={() => handleProcess('complete')}
                      disabled={processing || !transactionId}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Mark as Paid
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

