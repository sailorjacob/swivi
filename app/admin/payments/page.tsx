"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Wallet,
  CreditCard,
  Building,
  ExternalLink,
  Loader2
} from "lucide-react"
import { authenticatedFetch } from "@/lib/supabase-browser"
import toast from "react-hot-toast"

interface PendingPayment {
  userId: string
  userName?: string
  userEmail?: string
  paymentMethod: 'wallet' | 'paypal' | 'bank'
  paymentAddress: string
  totalEarnings: number
  clipsCount: number
  clips: Array<{
    clipId: string
    campaignTitle: string
    viewsGained: number
    earnings: number
  }>
}

interface PaymentStats {
  totalPendingAmount: number
  totalUsers: number
  totalClips: number
  byPaymentMethod: {
    wallet: number
    paypal: number
    bank: number
  }
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalPendingAmount: 0,
    totalUsers: 0,
    totalClips: 0,
    byPaymentMethod: {
      wallet: 0,
      paypal: 0,
      bank: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set())
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'paypal' | 'bank'>('wallet')
  const [notes, setNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending')
  const [processedPayments, setProcessedPayments] = useState<any[]>([])

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)

      // Fetch pending payments
      const pendingResponse = await authenticatedFetch("/api/admin/payments?status=pending")
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPayments(pendingData.payments || [])
        setStats({
          totalPendingAmount: pendingData.totalPendingAmount || 0,
          totalUsers: pendingData.payments?.length || 0,
          totalClips: pendingData.payments?.reduce((sum: number, payment: PendingPayment) => sum + payment.clipsCount, 0) || 0,
          byPaymentMethod: {
            wallet: pendingData.payments?.filter((p: PendingPayment) => p.paymentMethod === 'wallet').length || 0,
            paypal: pendingData.payments?.filter((p: PendingPayment) => p.paymentMethod === 'paypal').length || 0,
            bank: pendingData.payments?.filter((p: PendingPayment) => p.paymentMethod === 'bank').length || 0
          }
        })
      }

      // Fetch processed payments
      const processedResponse = await authenticatedFetch("/api/admin/payments?status=processed")
      if (processedResponse.ok) {
        const processedData = await processedResponse.json()
        setProcessedPayments(processedData.payments || [])
      }

    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPayment = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedPayments)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedPayments(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayments(new Set(payments.map(p => p.userId)))
    } else {
      setSelectedPayments(new Set())
    }
  }

  const handleProcessPayments = async () => {
    if (selectedPayments.size === 0) {
      toast.error("Please select at least one payment to process")
      return
    }

    if (!notes.trim()) {
      toast.error("Please add notes about this payment batch")
      return
    }

    setProcessing(true)
    try {
      const response = await authenticatedFetch("/api/admin/payments", {
        method: "POST",
        body: JSON.stringify({
          userIds: Array.from(selectedPayments),
          paymentMethod,
          notes: notes.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully processed ${data.paidCount} payments`)

        // Show payout details if available
        if (data.payouts && data.payouts.length > 0) {
          console.log("Payouts processed:", data.payouts)
        }

        setSelectedPayments(new Set())
        setNotes("")
        fetchPayments()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to process payments")
      }
    } catch (error) {
      console.error("Error processing payments:", error)
      toast.error("Failed to process payments")
    } finally {
      setProcessing(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'wallet':
        return <Wallet className="w-4 h-4" />
      case 'paypal':
        return <CreditCard className="w-4 h-4" />
      case 'bank':
        return <Building className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'wallet':
        return 'bg-purple-100 text-purple-800'
      case 'paypal':
        return 'bg-blue-100 text-blue-800'
      case 'bank':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">Review and process pending payments to clippers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalPendingAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clips</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClips}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wallet Payments</p>
                <p className="text-2xl font-bold text-purple-600">{stats.byPaymentMethod.wallet}</p>
              </div>
              <Wallet className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Processing Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Process Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: 'wallet' | 'paypal' | 'bank') => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Crypto Wallet
                    </div>
                  </SelectItem>
                  <SelectItem value="paypal">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      PayPal
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Payment Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this payment batch..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedPayments.size > 0 ? (
                <span>{selectedPayments.size} payments selected for {paymentMethod} processing</span>
              ) : (
                <span>Select payments to process</span>
              )}
            </div>
            <Button
              onClick={handleProcessPayments}
              disabled={selectedPayments.size === 0 || processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Process {selectedPayments.size} Payments
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Tabs */}
      <div className="flex space-x-1 mb-6">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
          className={activeTab === 'pending' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          Pending Payments ({payments.length})
        </Button>
        <Button
          variant={activeTab === 'processed' ? 'default' : 'outline'}
          onClick={() => setActiveTab('processed')}
          className={activeTab === 'processed' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          Processed Payments ({processedPayments.length})
        </Button>
      </div>

      {/* Pending Payments */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Payments</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedPayments.size === payments.length && payments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">No Pending Payments</h3>
              <p className="text-gray-600">All payments have been processed!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.userId}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedPayments.has(payment.userId)}
                        onCheckedChange={(checked) => handleSelectPayment(payment.userId, !!checked)}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getPaymentMethodColor(payment.paymentMethod)}>
                            <div className="flex items-center gap-1">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                              {payment.paymentMethod}
                            </div>
                          </Badge>
                          <span className="font-medium">
                            {payment.userName || payment.userEmail}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{payment.paymentAddress}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${payment.totalEarnings.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {payment.clipsCount} clips
                      </div>
                    </div>
                  </div>

                  {/* Clip Details */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-medium text-gray-700 mb-2">Clips:</div>
                    <div className="space-y-2">
                      {payment.clips.map((clip) => (
                        <div key={clip.clipId} className="flex items-center justify-between text-sm">
                          <div className="flex-1">
                            <span className="font-medium">{clip.campaignTitle}</span>
                            <span className="text-gray-600 ml-2">
                              +{clip.viewsGained.toLocaleString()} views
                            </span>
                          </div>
                          <div className="font-medium">
                            ${clip.earnings.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Processed Payments */}
      {activeTab === 'processed' && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {processedPayments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Processed Payments</h3>
                <p className="text-gray-600">Payments will appear here after processing.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {processedPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="border rounded-lg p-4 bg-green-50 border-green-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-green-100 text-green-800">
                              <div className="flex items-center gap-1">
                                {getPaymentMethodIcon(payment.method?.toLowerCase())}
                                {payment.method?.toLowerCase()}
                              </div>
                            </Badge>
                            <span className="font-medium">
                              {payment.user?.name || payment.user?.email || 'Unknown User'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{payment.user?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${payment.amount?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(payment.processedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {payment.notes && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {payment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
