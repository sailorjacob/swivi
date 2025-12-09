"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  Plus,
  Search,
  FileText,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Filter,
  Building2,
  Calendar,
  DollarSign,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { cn } from "@/lib/utils"

interface Deal {
  id: string
  dealNumber: string
  type: string
  status: string
  brandName: string | null
  campaignName: string | null
  total: number
  dealDate: string
  validUntil: string | null
  createdAt: string
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-foreground/10 text-foreground",
  NEGOTIATING: "bg-foreground/10 text-foreground",
  WON: "bg-foreground text-background",
  LOST: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground"
}

const typeLabels: Record<string, string> = {
  PROPOSAL: "Proposal",
  INVOICE: "Invoice",
  QUOTE: "Quote"
}

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'archived', label: 'Archived' }
]

export default function DealsListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const isDemoMode = process.env.NODE_ENV === "development"

  useEffect(() => {
    if (status === "loading") return
    if (!isDemoMode && !session) {
      router.push("/creators/login?error=AccessDenied")
    }
    if (!isDemoMode && session?.user?.role !== "ADMIN") {
      router.push("/creators/dashboard?error=AdminAccessRequired")
    }
    
    fetchDeals()
  }, [session, status, router, isDemoMode, statusFilter])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      
      const response = await authenticatedFetch(`/api/admin/deals?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDeals(data.deals || [])
      }
    } catch (error) {
      console.error('Error fetching deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDeals()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return
    
    try {
      const response = await authenticatedFetch(`/api/admin/deals/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setDeals(deals.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Error deleting deal:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (status === "loading" || (!isDemoMode && (!session || session.user?.role !== "ADMIN"))) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Link href="/admin/agency" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Agency Hub
              </Link>
              <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
              <p className="text-muted-foreground mt-1">Manage your proposals, invoices, and quotes</p>
            </div>
            <Link href="/admin/agency/deals/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Deal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by brand, campaign, or deal number..."
                className="pl-10"
              />
            </div>
          </form>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  statusFilter === filter.value
                    ? "bg-foreground text-background"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deals List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No deals yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first proposal, invoice, or quote to get started.
              </p>
              <Link href="/admin/agency/deals/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Deal
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {deals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
              >
                <Card className="hover:border-foreground/20 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {deal.brandName || 'Untitled Deal'}
                          </span>
                          <Badge variant="outline" className={cn("text-xs", statusColors[deal.status])}>
                            {deal.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {typeLabels[deal.type]} #{deal.dealNumber}
                          </span>
                          {deal.campaignName && (
                            <span className="truncate max-w-[200px]">{deal.campaignName}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">{formatCurrency(Number(deal.total))}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(deal.dealDate)}</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={`/admin/agency/deals/${deal.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDelete(deal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

