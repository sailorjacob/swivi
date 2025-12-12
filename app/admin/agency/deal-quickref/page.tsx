"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  Target,
  Handshake,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const dealCheatSheets = [
  {
    id: "performance-cpm",
    title: "Performance CPM",
    subtitle: "Pay Per View",
    icon: Target,
    pitch: "We charge per view delivered. You set a target (e.g., 20M views). We deliver it. You only pay for what we deliver.",
    positioning: ["Transparent, performance-based", "Risk on us, not you", "You only pay for real delivery"],
    pricingFormula: `Views Delivered × $2 CPM = Client Invoice
25M views × $2 = $50,000

vs. Your Cost:
25M views × $1 CPM = $25,000

Your Profit = $25,000 (50% margin)`,
    idealClient: ["Marketing-savvy (understands CPM)", "Has clear view targets", "Mid-market to large brands", "Performance-driven (want to measure ROI)"],
    examples: "Netflix, HBO, Red Bull, DTC brands",
    emailSubject: "[Show/Campaign Name] + [XM] Views @ $2 CPM (vs. $5–$15 market rate)",
    talkingPoints: [
      "Market rate is $5–$15 CPM; we charge $2 CPM",
      "You only pay for views actually delivered",
      "Authentic creator content = 3–5x better engagement than brand ads",
      "This is how performance-based partnerships work"
    ],
    redFlags: [
      "Client wants CPM < $1.50 (your margin disappears)",
      "Client demands perpetual rights (separate fee needed)",
      "Client asks for daily final approval (high overhead)",
      "Client won't commit upfront (payment risk)"
    ],
    dealSizes: [
      { label: "Small", value: "10M views × $2 CPM = $20,000" },
      { label: "Medium", value: "25M views × $2 CPM = $50,000" },
      { label: "Large", value: "50M+ views × $2 CPM = $100,000+" }
    ],
    marginGuidelines: [
      { label: "Minimum", value: "40%", example: "$50K deal = $20K+ profit" },
      { label: "Target", value: "50%", example: "$50K deal = $25K profit" },
      { label: "Stretch", value: "60%+", example: "$50K deal = $30K+ profit" }
    ],
    nextSteps: [
      "Sign SOW (Performance CPM template)",
      "Client sends 50% upfront ($25K)",
      "Activate creators",
      "Upon delivery, invoice final 50%",
      "Pitch Delivery Engine for next season"
    ]
  },
  {
    id: "delivery-engine",
    title: "Delivery Engine",
    subtitle: "Partnership Budget",
    icon: Handshake,
    pitch: "Instead of renegotiating every season, let's lock in a 6–12 month partnership. You give us a fixed budget; we commit to guaranteed views and a dedicated team.",
    positioning: ["Long-term partnership (not one-off project)", "Dedicated team (stability for you, predictability for us)", "Large guaranteed budgets", "Best for brands with sustained marketing needs"],
    pricingFormula: `Quarterly/Annual Budget = Guaranteed Views + Margin Retention

Example:
6-Month Budget: $300,000
Creator Cost (100M views × $1 CPM): $100,000
Agency Margin: $100,000–$200,000
= 33–67% margin

Typical: 45–50% margin ($135K–$150K profit on $300K)`,
    idealClient: ["Major entertainment brand (Netflix, HBO, Paramount)", "Record label with sustained marketing", "Sports franchise with seasonal campaigns", "Large consumer brand with recurring needs"],
    examples: "Netflix shows, HBO, music labels, sports teams",
    emailSubject: "[Show Name] + Beyond: Dedicated Social Activation Partner (6–12 months)",
    talkingPoints: [
      "Season 1 worked (20M views, 3.2% engagement). Let's lock in a partnership for Seasons 2–4.",
      "Instead of renegotiating every season, we commit to 100M+ views / quarter for a fixed budget.",
      "You get a dedicated team (same account manager, same strategy each quarter).",
      "This is how traditional agencies partner with studios."
    ],
    redFlags: [
      "Budget < $100K/quarter (not worth dedicated team)",
      "Won't commit minimum 6 months",
      "Demands A-list creators exclusively",
      "Changes strategy/creative approval constantly"
    ],
    dealSizes: [
      { label: "Small Partnership", value: "$300K / 6 months ($50K/month)" },
      { label: "Medium Partnership", value: "$600K / 12 months ($50K/month)" },
      { label: "Large Partnership", value: "$1M+ / 12 months ($80K+/month)" }
    ],
    marginGuidelines: [
      { label: "Minimum", value: "35%", example: "utilization margin" },
      { label: "Target", value: "45–50%", example: "standard" },
      { label: "Stretch", value: "60%+", example: "efficient creators" }
    ],
    nextSteps: [
      "Sign MSA (covers entire partnership)",
      "Quarterly SOWs (tied to MSA, auto-approved)",
      "Client sends Q1 payment upfront",
      "Kickoff meeting with client team",
      "Deliver flawlessly, pitch expansion (whitelisting, licensing)"
    ]
  },
  {
    id: "flat-rate",
    title: "Flat Rate / Commercial",
    subtitle: "Simple Pricing",
    icon: DollarSign,
    pitch: "A TV commercial costs $15K–$50K production + $100K+ airtime. Our social campaign: $50K flat fee for 25M people reached via authentic creators. Simpler. Better ROI.",
    positioning: ["Fixed cost (no surprises)", "Simple to understand (non-ad-savvy clients)", "Compared to TV commercial budgets", "One-time project (not recurring)"],
    pricingFormula: `Flat Fee = Creator Payout (50%) + Agency Margin (50%)

Example:
Flat Fee: $50,000
Creator Payout: $25,000 (50%)
Agency Profit: $25,000 (50%)

Expected Delivery: 25M+ views`,
    idealClient: ["Non-advertising-savvy (wealthy individuals, business owners)", "Think in \"campaign cost\" terms, not CPM", "High revenue, lower ad sophistication", "One-off projects (not recurring)"],
    examples: "Real estate developers, luxury brands, wealthy entrepreneurs, sports athletes",
    emailSubject: "Social Media Campaign: $50K for 25M+ Views (Real Estate Edition)",
    talkingPoints: [
      "How much does a TV commercial cost? $15K–$50K production, plus $100K+ airtime, maybe reaches 2–5M people.",
      "Our social campaign: $50K, reaches 25M people, authentic creator voices.",
      "Better reach, better ROI, simpler than traditional advertising.",
      "This is comprehensive; nothing extra to buy."
    ],
    redFlags: [
      "Client asks to lower price significantly",
      "Wants unlimited revisions / approvals",
      "Expects original video production included",
      "Demands celebrity creators (premium fees apply)"
    ],
    dealSizes: [
      { label: "Small", value: "$25K (12–15M views)" },
      { label: "Medium", value: "$50K (25M views)" },
      { label: "Large", value: "$75K–$100K (50M+ views)" }
    ],
    marginGuidelines: [
      { label: "Minimum", value: "45%", example: "" },
      { label: "Target", value: "50%", example: "standard" },
      { label: "Stretch", value: "60%+", example: "efficient network" }
    ],
    nextSteps: [
      "Sign SOW (Flat Rate template)",
      "Client sends 50% upfront ($25K)",
      "Activate creators",
      "Invoice final 50% upon delivery",
      "Post-campaign debrief; pitch retainer if appropriate"
    ]
  },
  {
    id: "monthly-retainer",
    title: "Monthly Retainer",
    subtitle: "Recurring Revenue",
    icon: RefreshCw,
    pitch: "Instead of paying per campaign, pay us a fixed monthly fee. You get consistent reach, optimized strategy, and a dedicated team.",
    positioning: ["Predictable recurring revenue (for you and them)", "Ongoing relationship (not one-off)", "Small-to-mid-tier clients", "Long-term commitment (typically 12 months)"],
    pricingFormula: `Monthly Fee = Creator Budget (40–50%) + Agency Profit (50–60%)

Example:
Monthly Retainer: $5,000
Creator Payout: ~$2,000–$2,500 (40–50%)
Agency Profit: $2,500–$3,000 (50–60%)

Annual Revenue: $5,000 × 12 = $60,000 per client`,
    idealClient: ["Smaller creators / emerging influencers", "Small-to-mid brands with monthly content needs", "YouTubers, streamers wanting social amplification", "Personal brands (athletes, entertainers)", "Niche brands with consistent messaging"],
    examples: "Mid-size creators (10K–100K followers), emerging artists, small brands",
    emailSubject: "Your Content, Our Network: $3K–5K/Month for 2–3M Monthly Views",
    talkingPoints: [
      "You've got the content; we've got the reach.",
      "Lock in a predictable monthly cost (same every month).",
      "Dedicated team that gets to know your brand (better optimization over time).",
      "Better than project-based because we learn what works, then double down."
    ],
    redFlags: [
      "Won't commit 6+ months (too short to invest in)",
      "Wants \"unlimited posts\" at $2K/month",
      "Expects guaranteed sales/conversions (no direct control)",
      "Needs daily account manager attention (you'll lose money)"
    ],
    dealSizes: [
      { label: "Bronze", value: "$2K/mo: 1.5M views/month, 30–50 posts" },
      { label: "Silver", value: "$5K/mo: 2.5M views/month, 50–100 posts" },
      { label: "Gold", value: "$10K/mo: 5M+ views/month, 100+ posts" }
    ],
    marginGuidelines: [
      { label: "Minimum", value: "40%", example: "" },
      { label: "Target", value: "50%", example: "" },
      { label: "Stretch", value: "60%+", example: "efficient operations" }
    ],
    nextSteps: [
      "Sign MSA (covers full 12-month term)",
      "Sign SOW for Month 1",
      "Client pays Month 1 upfront",
      "Kickoff call; set strategy baseline",
      "Recurring monthly invoices (auto-renewal unless 30-day notice)"
    ]
  }
]

const comparisonMatrix = [
  { dimension: "Pricing", performance: "$2 CPM", delivery: "Fixed quarterly", flat: "Fixed fee", retainer: "Fixed monthly" },
  { dimension: "Term", performance: "4–6 weeks", delivery: "6–12 months", flat: "6–8 weeks", retainer: "12 months (recurring)" },
  { dimension: "Ideal Client Size", performance: "Mid-to-large", delivery: "Large (Netflix+)", flat: "Mid-to-small", retainer: "Small-to-mid" },
  { dimension: "Client Sophistication", performance: "High", delivery: "High", flat: "Low", retainer: "Low-to-mid" },
  { dimension: "Typical Deal Size", performance: "$25K–$100K", delivery: "$300K–$1M", flat: "$25K–$75K", retainer: "$2K–$10K/month" },
  { dimension: "Your Margin", performance: "50%", delivery: "45–50%", flat: "50%", retainer: "50%" },
  { dimension: "Predictability", performance: "Medium", delivery: "High", flat: "Low", retainer: "High" },
  { dimension: "Follow-Up Pitch", performance: "Delivery Engine", delivery: "Whitelisting/licensing", flat: "Monthly retainer", retainer: "Retainer upgrade" }
]

const objectionResponses = [
  {
    objection: "\"Your price is too high\"",
    response: "\"Higher than what? Traditional agencies charge 15–30% on top of creator costs, plus additional fees for strategy. We're 50% on creator spend, which is actually aligned with industry (talent agencies, brokers, etc.). Would you like to see ROI comparison vs. traditional TV/traditional digital?\""
  },
  {
    objection: "\"Can you go lower?\"",
    response: "\"Below 45% margin, we can't invest in your account with a dedicated team. We could do performance CPM at $1.50 instead of $2 (which cuts our margin), but then we're less motivated to optimize. What matters most: lowest price, or best results?\""
  },
  {
    objection: "\"We want exclusive creators\"",
    response: "\"Exclusivity costs. Our standard network operates non-exclusive. For exclusive arrangements, we charge premium: +20–50% on top of creator fees. Would you like us to price that scenario?\""
  },
  {
    objection: "\"Can we do this on spec?\"",
    response: "\"We don't spec. But here's what we can do: 50% upfront, 50% on delivery. You only pay full amount if we hit our metrics. If we miss, you get credited. We're that confident.\""
  },
  {
    objection: "\"What if we don't like the results?\"",
    response: "\"We have performance guarantees in the SOW: Hit targets, or you get credited. We also have change order terms: if you want to pivot strategy mid-campaign, we do it, but it's a change order (may cost more). Does that work?\""
  }
]

const greenYellowRed = {
  green: [
    "50% or higher margin",
    "Client has budget (can pay)",
    "Deal size > $20K",
    "Timeline is realistic",
    "Client is responsive",
    "Margin supports team growth"
  ],
  yellow: [
    "40–50% margin (negotiate for higher)",
    "Client slightly unresponsive (add management buffer)",
    "Deal size $15K–$20K (small but acceptable)",
    "Tight timeline (add rush fees)"
  ],
  red: [
    "< 35% margin",
    "Client won't pay upfront",
    "Deal < $15K and unproductive timeline",
    "Client is constantly renegotiating scope",
    "No clear decision-maker",
    "Margin doesn't support team"
  ]
}

export default function DealQuickRefPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null)
  const isDemoMode = process.env.NODE_ENV === "development"

  useEffect(() => {
    if (status === "loading") return
    if (!isDemoMode && !session) {
      router.push("/creators/login?error=AccessDenied")
    }
    if (!isDemoMode && session?.user?.role !== "ADMIN") {
      router.push("/creators/dashboard?error=AdminAccessRequired")
    }
  }, [session, status, router, isDemoMode])

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
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <Link href="/admin/agency" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Agency
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Quick Reference Guide</h1>
          <p className="text-muted-foreground mt-1">
            One-page cheat sheets for each deal type
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Deal Type Cheat Sheets */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-4">Deal Type Cheat Sheets</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Click to expand full details for each deal type
          </p>

          <div className="space-y-4">
            {dealCheatSheets.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className={cn(
                  "transition-all",
                  expandedDeal === deal.id && "border-foreground/20"
                )}>
                  <CardHeader 
                    className="cursor-pointer"
                    onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <deal.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{deal.title}</CardTitle>
                          <CardDescription className="mt-1">"{deal.subtitle}"</CardDescription>
                        </div>
                      </div>
                      <div className="p-2">
                        {expandedDeal === deal.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {expandedDeal === deal.id && (
                    <CardContent className="pt-0 border-t border-border">
                      <div className="pt-6 space-y-6">
                        {/* The Pitch */}
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">The Pitch</p>
                          <p className="text-sm italic">"{deal.pitch}"</p>
                        </div>

                        {/* Positioning */}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Positioning</p>
                          <ul className="space-y-1">
                            {deal.positioning.map((point, j) => (
                              <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-foreground" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Pricing Formula */}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Pricing Formula</p>
                          <pre className="p-3 bg-muted/50 rounded-lg text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                            {deal.pricingFormula}
                          </pre>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Ideal Client */}
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Ideal Client Profile</p>
                            <ul className="space-y-1">
                              {deal.idealClient.map((point, j) => (
                                <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-muted-foreground mt-2">
                              <span className="font-medium">Examples:</span> {deal.examples}
                            </p>
                          </div>

                          {/* Red Flags */}
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Red Flags (Walk Away)</p>
                            <ul className="space-y-1">
                              {deal.redFlags.map((point, j) => (
                                <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <AlertTriangle className="w-3 h-3 mt-0.5 text-red-500 flex-shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Email Subject */}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Pitch Email Subject Line</p>
                          <div className="p-2 bg-muted rounded font-mono text-sm">
                            {deal.emailSubject}
                          </div>
                        </div>

                        {/* Talking Points */}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Key Talking Points</p>
                          <ul className="space-y-1">
                            {deal.talkingPoints.map((point, j) => (
                              <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                "{point}"
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Deal Sizes */}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Sample Deal Sizes</p>
                          <div className="grid grid-cols-3 gap-2">
                            {deal.dealSizes.map((size) => (
                              <div key={size.label} className="p-2 bg-muted/50 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground">{size.label}</p>
                                <p className="text-xs font-medium">{size.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Margin Guidelines */}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Margin Guidelines</p>
                          <div className="grid grid-cols-3 gap-2">
                            {deal.marginGuidelines.map((margin) => (
                              <div key={margin.label} className="p-2 bg-muted/50 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground">{margin.label}</p>
                                <p className="text-lg font-semibold text-green-500">{margin.value}</p>
                                {margin.example && <p className="text-xs text-muted-foreground">{margin.example}</p>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Next Steps */}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Next Steps After Sale</p>
                          <ol className="space-y-1">
                            {deal.nextSteps.map((step, j) => (
                              <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center flex-shrink-0">
                                  {j + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* Comparison Matrix */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-4">Deal Type Comparison Matrix</h2>
          
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium">Dimension</th>
                      <th className="text-left py-2 font-medium">Performance CPM</th>
                      <th className="text-left py-2 font-medium">Delivery Engine</th>
                      <th className="text-left py-2 font-medium">Flat Rate</th>
                      <th className="text-left py-2 font-medium">Retainer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonMatrix.map((row) => (
                      <tr key={row.dimension} className="border-b border-border/50 last:border-0">
                        <td className="py-2 font-medium">{row.dimension}</td>
                        <td className="py-2 text-muted-foreground">{row.performance}</td>
                        <td className="py-2 text-muted-foreground">{row.delivery}</td>
                        <td className="py-2 text-muted-foreground">{row.flat}</td>
                        <td className="py-2 text-muted-foreground">{row.retainer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* Green/Yellow/Red Light Deals */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-4">Deal Approval Guidelines</h2>
          <p className="text-sm text-muted-foreground mb-6">
            For account managers: When to approve, negotiate, or decline
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-green-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <CardTitle className="text-base text-green-500">Green Light (Approve)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {greenYellowRed.green.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-green-500 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <CardTitle className="text-base text-yellow-500">Yellow Light (Negotiate)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {greenYellowRed.yellow.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-yellow-500 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <CardTitle className="text-base text-red-500">Red Light (Decline)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {greenYellowRed.red.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-500 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* Common Objections */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Common Objections & Responses</h2>
          
          <div className="space-y-3">
            {objectionResponses.map((item, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <p className="text-sm font-medium mb-2">{item.objection}</p>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{item.response}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Final Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="border-foreground/10 bg-foreground/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">The Bottom Line</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                You have <span className="text-foreground font-medium">four deal types</span>. Each serves a different client profile:
              </p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium text-foreground">1. Performance CPM</span> → Performance-driven, mid-market brands</li>
                <li><span className="font-medium text-foreground">2. Delivery Engine</span> → Large, long-term partners (Netflix, HBO)</li>
                <li><span className="font-medium text-foreground">3. Flat Rate</span> → Non-ad-savvy, wealthy individuals/businesses</li>
                <li><span className="font-medium text-foreground">4. Monthly Retainer</span> → Smaller, recurring needs</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                <span className="text-foreground font-medium">Each deal should target 50% margin minimum.</span> Your competitive advantage: 
                You have a pre-vetted, managed, 70+ creator network. Nobody else operates at this scale with this transparency. Price accordingly.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
