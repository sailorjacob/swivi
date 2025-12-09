"use client"

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Share2, 
  Copy, 
  Check,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Target,
  Eye,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
}

interface ProposalData {
  // Brand/Client Info
  brandName: string
  brandContactName: string
  brandEmail: string
  brandPhone: string
  brandAddress: string
  
  // Proposal Details
  proposalNumber: string
  proposalDate: string
  validUntil: string
  proposalType: 'proposal' | 'invoice' | 'quote'
  
  // Campaign Info
  campaignName: string
  campaignDescription: string
  targetPlatforms: string[]
  targetAudience: string
  expectedDeliverables: string
  timeline: string
  
  // Pricing
  lineItems: LineItem[]
  discount: number
  discountType: 'percentage' | 'fixed'
  taxRate: number
  
  // Terms
  paymentTerms: string
  additionalNotes: string
}

const defaultProposal: ProposalData = {
  brandName: '',
  brandContactName: '',
  brandEmail: '',
  brandPhone: '',
  brandAddress: '',
  
  proposalNumber: `SWIVI-${Date.now().toString(36).toUpperCase()}`,
  proposalDate: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  proposalType: 'proposal',
  
  campaignName: '',
  campaignDescription: '',
  targetPlatforms: [],
  targetAudience: '',
  expectedDeliverables: '',
  timeline: '',
  
  lineItems: [
    { id: '1', description: '', quantity: 1, rate: 0 }
  ],
  discount: 0,
  discountType: 'percentage',
  taxRate: 0,
  
  paymentTerms: '50% upfront, 50% upon campaign completion',
  additionalNotes: ''
}

const platformOptions = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
]

export default function ProposalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const proposalRef = useRef<HTMLDivElement>(null)
  const [proposal, setProposal] = useState<ProposalData>(defaultProposal)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    campaign: true,
    pricing: true,
    terms: true
  })

  // Demo mode for development
  const isDemoMode = process.env.NODE_ENV === "development"

  // Auth check with useEffect
  useEffect(() => {
    if (status === "loading") return
    
    if (!isDemoMode && !session) {
      router.push("/creators/login?error=AccessDenied")
      return
    }

    if (!isDemoMode && session?.user?.role !== "ADMIN") {
      router.push("/creators/dashboard?error=AdminAccessRequired")
      return
    }
  }, [session, status, router, isDemoMode])

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // In non-demo mode, wait for proper session
  if (!isDemoMode && (!session || session.user?.role !== "ADMIN")) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Redirecting...</div>
      </div>
    )
  }

  const updateProposal = (updates: Partial<ProposalData>) => {
    setProposal(prev => ({ ...prev, ...updates }))
  }

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0
    }
    updateProposal({ lineItems: [...proposal.lineItems, newItem] })
  }

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    const updated = proposal.lineItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
    updateProposal({ lineItems: updated })
  }

  const removeLineItem = (id: string) => {
    if (proposal.lineItems.length <= 1) return
    updateProposal({ lineItems: proposal.lineItems.filter(item => item.id !== id) })
  }

  const calculateSubtotal = () => {
    return proposal.lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  }

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal()
    if (proposal.discountType === 'percentage') {
      return subtotal * (proposal.discount / 100)
    }
    return proposal.discount
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    return (subtotal - discount) * (proposal.taxRate / 100)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    const tax = calculateTax()
    return subtotal - discount + tax
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    // Create shareable link (in real app, would save to DB and generate link)
    const shareData = {
      title: `${proposal.proposalType === 'invoice' ? 'Invoice' : 'Proposal'} - ${proposal.brandName || 'New Deal'}`,
      text: `View ${proposal.proposalType} #${proposal.proposalNumber} from Swivi`,
      url: window.location.href
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback - copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const togglePlatform = (platform: string) => {
    const current = proposal.targetPlatforms
    if (current.includes(platform)) {
      updateProposal({ targetPlatforms: current.filter(p => p !== platform) })
    } else {
      updateProposal({ targetPlatforms: [...current, platform] })
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section 
  }: { 
    title: string
    icon: React.ComponentType<{ className?: string }>
    section: keyof typeof expandedSections 
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-3 group"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="font-medium">{title}</span>
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      ) : (
        <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
    </button>
  )

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #proposal-preview, #proposal-preview * {
            visibility: visible;
          }
          #proposal-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 40px !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>

      <div className="min-h-screen">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 no-print">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Proposal Generator</h1>
                  <p className="text-xs text-muted-foreground">Create branded proposals & invoices</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  Share
                </Button>
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Editor Panel */}
            <div className={cn("space-y-4 no-print", showPreview ? "hidden" : "block")}>
              {/* Document Type */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    {(['proposal', 'invoice', 'quote'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => updateProposal({ proposalType: type })}
                        className={cn(
                          "flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all",
                          proposal.proposalType === type
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground/50"
                        )}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Document Number</Label>
                      <Input
                        value={proposal.proposalNumber}
                        onChange={(e) => updateProposal({ proposalNumber: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <Input
                        type="date"
                        value={proposal.proposalDate}
                        onChange={(e) => updateProposal({ proposalDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label className="text-xs text-muted-foreground">Valid Until</Label>
                    <Input
                      type="date"
                      value={proposal.validUntil}
                      onChange={(e) => updateProposal({ validUntil: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Brand/Client Info */}
              <Card>
                <CardContent className="pt-4">
                  <SectionHeader title="Brand / Client Information" icon={Building2} section="brand" />
                  
                  <AnimatePresence>
                    {expandedSections.brand && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 pt-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Brand / Company Name</Label>
                            <Input
                              value={proposal.brandName}
                              onChange={(e) => updateProposal({ brandName: e.target.value })}
                              placeholder="e.g., Awesome Brand Inc."
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Contact Name</Label>
                              <Input
                                value={proposal.brandContactName}
                                onChange={(e) => updateProposal({ brandContactName: e.target.value })}
                                placeholder="John Smith"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Email</Label>
                              <Input
                                type="email"
                                value={proposal.brandEmail}
                                onChange={(e) => updateProposal({ brandEmail: e.target.value })}
                                placeholder="john@brand.com"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Phone</Label>
                              <Input
                                value={proposal.brandPhone}
                                onChange={(e) => updateProposal({ brandPhone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Address</Label>
                              <Input
                                value={proposal.brandAddress}
                                onChange={(e) => updateProposal({ brandAddress: e.target.value })}
                                placeholder="123 Business St."
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Campaign Info */}
              <Card>
                <CardContent className="pt-4">
                  <SectionHeader title="Campaign Details" icon={Target} section="campaign" />
                  
                  <AnimatePresence>
                    {expandedSections.campaign && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 pt-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Campaign Name</Label>
                            <Input
                              value={proposal.campaignName}
                              onChange={(e) => updateProposal({ campaignName: e.target.value })}
                              placeholder="e.g., Summer Product Launch"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Campaign Description</Label>
                            <Textarea
                              value={proposal.campaignDescription}
                              onChange={(e) => updateProposal({ campaignDescription: e.target.value })}
                              placeholder="Describe the campaign objectives, goals, and key messaging..."
                              className="mt-1 min-h-[100px]"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Target Platforms</Label>
                            <div className="flex flex-wrap gap-2">
                              {platformOptions.map((platform) => (
                                <button
                                  key={platform.value}
                                  onClick={() => togglePlatform(platform.value)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                    proposal.targetPlatforms.includes(platform.value)
                                      ? "border-foreground bg-foreground text-background"
                                      : "border-border hover:border-foreground/50"
                                  )}
                                >
                                  {platform.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Target Audience</Label>
                            <Input
                              value={proposal.targetAudience}
                              onChange={(e) => updateProposal({ targetAudience: e.target.value })}
                              placeholder="e.g., 18-35 year olds interested in fitness"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Expected Deliverables</Label>
                            <Textarea
                              value={proposal.expectedDeliverables}
                              onChange={(e) => updateProposal({ expectedDeliverables: e.target.value })}
                              placeholder="e.g., 10 creator videos, 50K+ total views, comprehensive analytics report..."
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Timeline</Label>
                            <Input
                              value={proposal.timeline}
                              onChange={(e) => updateProposal({ timeline: e.target.value })}
                              placeholder="e.g., 4 weeks from campaign start"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardContent className="pt-4">
                  <SectionHeader title="Pricing & Budget" icon={DollarSign} section="pricing" />
                  
                  <AnimatePresence>
                    {expandedSections.pricing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 pt-2">
                          {/* Line Items */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium">
                              <div className="col-span-6">Description</div>
                              <div className="col-span-2">Qty</div>
                              <div className="col-span-3">Rate</div>
                              <div className="col-span-1"></div>
                            </div>
                            
                            {proposal.lineItems.map((item, index) => (
                              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                                  placeholder="Service description..."
                                  className="col-span-6"
                                />
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(item.id, { quantity: Number(e.target.value) })}
                                  min={1}
                                  className="col-span-2"
                                />
                                <Input
                                  type="number"
                                  value={item.rate}
                                  onChange={(e) => updateLineItem(item.id, { rate: Number(e.target.value) })}
                                  min={0}
                                  step={0.01}
                                  className="col-span-3"
                                />
                                <button
                                  onClick={() => removeLineItem(item.id)}
                                  disabled={proposal.lineItems.length <= 1}
                                  className="col-span-1 p-2 text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addLineItem}
                              className="w-full gap-2 mt-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Line Item
                            </Button>
                          </div>
                          
                          <Separator />
                          
                          {/* Discount & Tax */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Discount</Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  type="number"
                                  value={proposal.discount}
                                  onChange={(e) => updateProposal({ discount: Number(e.target.value) })}
                                  min={0}
                                  className="flex-1"
                                />
                                <Select
                                  value={proposal.discountType}
                                  onValueChange={(v) => updateProposal({ discountType: v as 'percentage' | 'fixed' })}
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percentage">%</SelectItem>
                                    <SelectItem value="fixed">$</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Tax Rate (%)</Label>
                              <Input
                                type="number"
                                value={proposal.taxRate}
                                onChange={(e) => updateProposal({ taxRate: Number(e.target.value) })}
                                min={0}
                                max={100}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          {/* Totals */}
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>{formatCurrency(calculateSubtotal())}</span>
                            </div>
                            {proposal.discount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Discount {proposal.discountType === 'percentage' && `(${proposal.discount}%)`}
                                </span>
                                <span className="text-green-600">-{formatCurrency(calculateDiscount())}</span>
                              </div>
                            )}
                            {proposal.taxRate > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax ({proposal.taxRate}%)</span>
                                <span>{formatCurrency(calculateTax())}</span>
                              </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg">
                              <span>Total</span>
                              <span>{formatCurrency(calculateTotal())}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Terms */}
              <Card>
                <CardContent className="pt-4">
                  <SectionHeader title="Terms & Notes" icon={FileText} section="terms" />
                  
                  <AnimatePresence>
                    {expandedSections.terms && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 pt-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Payment Terms</Label>
                            <Textarea
                              value={proposal.paymentTerms}
                              onChange={(e) => updateProposal({ paymentTerms: e.target.value })}
                              placeholder="e.g., 50% upfront, 50% upon completion"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Additional Notes</Label>
                            <Textarea
                              value={proposal.additionalNotes}
                              onChange={(e) => updateProposal({ additionalNotes: e.target.value })}
                              placeholder="Any additional terms, conditions, or notes..."
                              className="mt-1 min-h-[100px]"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className={cn(showPreview ? "block" : "hidden lg:block")}>
              <div className="sticky top-24">
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-border shadow-xl overflow-hidden">
                  <div id="proposal-preview" ref={proposalRef} className="p-8 bg-white text-black min-h-[800px]">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <img 
                            src="https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/invertedlogo.png"
                            alt="Swivi Logo"
                            className="w-10 h-10"
                          />
                          <span className="text-2xl font-bold tracking-tight text-black">SWIVI</span>
                        </div>
                        <p className="text-sm text-gray-500">Creator-Powered Marketing</p>
                        <p className="text-xs text-gray-400 mt-1">team@swivimedia.com</p>
                      </div>
                      
                      <div className="text-right">
                        <h2 className="text-3xl font-bold tracking-tight text-black uppercase">
                          {proposal.proposalType}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">#{proposal.proposalNumber}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Date: {formatDate(proposal.proposalDate)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Valid Until: {formatDate(proposal.validUntil)}
                        </p>
                      </div>
                    </div>

                    {/* Client Info */}
                    {proposal.brandName && (
                      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
                        <p className="font-semibold text-black">{proposal.brandName}</p>
                        {proposal.brandContactName && (
                          <p className="text-sm text-gray-600">{proposal.brandContactName}</p>
                        )}
                        {proposal.brandEmail && (
                          <p className="text-sm text-gray-500">{proposal.brandEmail}</p>
                        )}
                        {proposal.brandPhone && (
                          <p className="text-sm text-gray-500">{proposal.brandPhone}</p>
                        )}
                        {proposal.brandAddress && (
                          <p className="text-sm text-gray-500">{proposal.brandAddress}</p>
                        )}
                      </div>
                    )}

                    {/* Campaign Details */}
                    {(proposal.campaignName || proposal.campaignDescription) && (
                      <div className="mb-8">
                        <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Campaign Overview
                        </h3>
                        {proposal.campaignName && (
                          <p className="text-lg font-medium text-black mb-2">{proposal.campaignName}</p>
                        )}
                        {proposal.campaignDescription && (
                          <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{proposal.campaignDescription}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {proposal.targetPlatforms.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">Platforms</p>
                              <p className="text-black">
                                {proposal.targetPlatforms.map(p => 
                                  platformOptions.find(opt => opt.value === p)?.label
                                ).join(', ')}
                              </p>
                            </div>
                          )}
                          {proposal.targetAudience && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">Target Audience</p>
                              <p className="text-black">{proposal.targetAudience}</p>
                            </div>
                          )}
                          {proposal.timeline && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">Timeline</p>
                              <p className="text-black">{proposal.timeline}</p>
                            </div>
                          )}
                        </div>
                        
                        {proposal.expectedDeliverables && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-500 uppercase mb-1">Expected Deliverables</p>
                            <p className="text-sm text-black whitespace-pre-wrap">{proposal.expectedDeliverables}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Line Items Table */}
                    <div className="mb-8">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-black">
                            <th className="text-left py-3 font-semibold text-black">Description</th>
                            <th className="text-center py-3 font-semibold text-black w-20">Qty</th>
                            <th className="text-right py-3 font-semibold text-black w-28">Rate</th>
                            <th className="text-right py-3 font-semibold text-black w-28">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proposal.lineItems.filter(item => item.description).map((item) => (
                            <tr key={item.id} className="border-b border-gray-200">
                              <td className="py-3 text-black">{item.description}</td>
                              <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                              <td className="py-3 text-right text-gray-600">{formatCurrency(item.rate)}</td>
                              <td className="py-3 text-right font-medium text-black">
                                {formatCurrency(item.quantity * item.rate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Totals */}
                      <div className="mt-4 flex justify-end">
                        <div className="w-64 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-black">{formatCurrency(calculateSubtotal())}</span>
                          </div>
                          {proposal.discount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">
                                Discount {proposal.discountType === 'percentage' && `(${proposal.discount}%)`}
                              </span>
                              <span className="text-green-600">-{formatCurrency(calculateDiscount())}</span>
                            </div>
                          )}
                          {proposal.taxRate > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Tax ({proposal.taxRate}%)</span>
                              <span className="text-black">{formatCurrency(calculateTax())}</span>
                            </div>
                          )}
                          <div className="border-t-2 border-black pt-2 flex justify-between">
                            <span className="font-bold text-black">Total</span>
                            <span className="font-bold text-xl text-black">{formatCurrency(calculateTotal())}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Terms & Notes */}
                    {(proposal.paymentTerms || proposal.additionalNotes) && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        {proposal.paymentTerms && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Terms</p>
                            <p className="text-sm text-black whitespace-pre-wrap">{proposal.paymentTerms}</p>
                          </div>
                        )}
                        {proposal.additionalNotes && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Additional Notes</p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.additionalNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t border-gray-200 text-center">
                      <p className="text-xs text-gray-400">
                        Thank you for your business!
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Questions? Contact us at team@swivimedia.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

