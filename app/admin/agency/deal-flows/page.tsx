"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  TrendingUp,
  Target,
  Handshake,
  DollarSign,
  RefreshCw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const dealTypes = [
  {
    id: "performance-cpm",
    title: "1. Performance CPM (Pay Per View)",
    subtitle: "Guaranteed Views at Double-CPM Model",
    icon: Target,
    pitch: "We charge $2 per 1,000 views. Market rate is $5–$15. You only pay for actual delivery.",
    idealClient: "Performance-driven brands (Netflix, HBO, Red Bull)",
    dealSize: "$25K–$100K",
    margin: "50% (example: $50K fee, $25K profit)",
    term: "4–6 weeks",
    whyItWorks: "Transparent, risk-on-agency, metrics-driven",
    economics: "25M views × $2 CPM = $50K client fee. Your cost: 25M × $1 CPM = $25K creator cost. Your profit: $25K (50% margin)",
    details: `These campaigns promise a set number of views at a fixed CPM. For example, we might offer 23 million views at $2 CPM ($46K total), where our creators are paid $1 per thousand and we keep the other $1 as our fee.

In a past campaign (e.g. for a Manhattan event), 23M views cost ~79¢ CPM to us, yet the value at standard digital CPM ($5–8) would be $115K–$184K. Charging $2 CPM (double what we pay creators) allows us to overdeliver on impressions while earning a 50% commission.

This fits industry norms: advertising agencies typically earn ~15%–50% of media spend. When pitching, emphasize that our network is essentially "paid traffic" of sorts, but via organic creator posts.

Compare our $2 CPM model to traditional media (TV can be $20–25 CPM); we achieve similar reach more efficiently. List out deliverables clearly (e.g. "23M views across TikTok/YouTube/IG") and tie them to business impact.

**Budget Example:** "$40K investment yields ~25M views, equivalent to $125K in paid media value" (5¢ on the dollar ROI).`
  },
  {
    id: "delivery-engine",
    title: "2. Delivery Engine (Partnership Budget)",
    subtitle: "Large-Scale Long-Term Partnership",
    icon: Handshake,
    pitch: "Lock in 6–12 months. You give us $300K; we commit 100M+ views and a dedicated team.",
    idealClient: "Major entertainment brands (Netflix shows, production companies)",
    dealSize: "$300K–$1M+ annually",
    margin: "45–50% (example: $300K budget, $135K–$150K profit)",
    term: "6–12 months (renewable)",
    whyItWorks: "Stable revenue, deep partnership, high utilization margin",
    economics: "$300K budget. Creator cost (~100M views @ $1 CPM): $100K. Your margin: $100K–$200K after team allocation. Your profit: $135K–$150K (45–50%)",
    details: `For big brands or long-term projects, we pitch a multi-month guarantee of impressions (e.g. 100M views in 6 months, or 1B in a year). This is akin to a retainer or dedicated campaign deal.

We position ourselves as the partner driving social reach—for example, collaborating with a streaming show's marketing team or a record label. In practice, the brand allocates a significant budget (e.g. $100K–$1M) and we commit to ongoing content delivery and optimization.

We highlight our proven track record of scaling campaigns quickly using creator networks. The contract can include periodic reviews and performance bonuses (e.g. extra payment if targets exceed).

This framework demonstrates our unique "engine" capabilities. Brands like Netflix or a major label get the benefit of a full-funnel social strategy under our management, rather than piecemeal ads.

**Key Elements:** Clarify deliverables (monthly impression goals, content themes) and revisit against key metrics regularly.`
  },
  {
    id: "flat-rate",
    title: "3. Premium Flat-Rate Campaign",
    subtitle: "Simple Fixed Fee Model",
    icon: DollarSign,
    pitch: "TV commercial costs $15K–$50K + airtime. Our social campaign: $50K flat, 25M people reached.",
    idealClient: "Non-ad-savvy clients (real estate, luxury, entrepreneurs)",
    dealSize: "$25K–$75K",
    margin: "50% (example: $50K fee, $25K profit)",
    term: "6–8 weeks",
    whyItWorks: "Simple, no CPM literacy needed, compared to TV budgets",
    economics: "$50K flat fee. Creator allocation: $25K (50%). Your profit: $25K (50% margin)",
    details: `This is a fixed-price, high-impact package for clients with big budgets (e.g. luxury brands, wealthy entrepreneurs, or commercial real estate developers). For instance, "$50K for 25M guaranteed views" across social channels.

In this model, we keep it simple: the client pays a flat fee, and we guarantee the corresponding reach. We estimate paying 20–25K of that to creators (their cut) and retaining the rest as our agency fee.

This is analogous to commissioning a TV spot; we use our creator network instead. When pitching, use concrete numbers ("$50K covers ~25M views via TikTok/YouTube influencers"), and compare to traditional options (a single 30s TV commercial can cost tens of thousands per airing).

**Value Proposition:** Explain that our fee covers the entire infrastructure—platform technology, campaign management, and the influencer network. Emphasize value: $50K yields global digital exposure that might cost >$100K on legacy channels.`
  },
  {
    id: "monthly-retainer",
    title: "4. Monthly Retainer (Recurring Revenue)",
    subtitle: "Ongoing Monthly Service",
    icon: RefreshCw,
    pitch: "Fixed monthly fee. You get dedicated team, ongoing optimization, 2–3M monthly views.",
    idealClient: "Small creators, emerging brands, niche influencers",
    dealSize: "$2K–$10K/month = $24K–$120K annually",
    margin: "50% (example: $5K/month, $2.5K profit)",
    term: "12 months (recurring)",
    whyItWorks: "Predictable revenue, long-term relationship, sticky customer",
    economics: "$5K/month fee. Creator allocation: ~$2.5K (50%). Your profit: $2.5K/month = $30K/year (50% margin)",
    details: `For smaller brands or individuals (startups, YouTubers, small businesses) we offer a subscription-like model (e.g. ~$2K/month). Clients may provide their own content or we repurpose existing content to sustain a steady stream of views.

This model suits clients who want a few million views per month and are happy to run recurring campaigns. Outline a scope (e.g. "10 videos/month, ~5M views/month"). We set a multi-month commitment, giving the client a consistent social presence.

Many agencies work on retainer for steady service. In the contract, we specify monthly deliverables and include performance check-ins. This provides predictable revenue and builds long-term client relationships.

**Pitch Focus:** Stress the convenience of "set-and-forget" marketing with guaranteed outputs, as opposed to one-off campaigns.`
  },
  {
    id: "creative-campaign",
    title: "5. Creative Campaign Proposals",
    subtitle: "Custom Ideas + Delivery",
    icon: Lightbulb,
    pitch: "We orchestrate AI-powered campaigns with 1,000+ posts—delivering millions of views and viral potential.",
    idealClient: "Creative brands (Red Bull, record labels, athletes)",
    dealSize: "$50K–$150K",
    margin: "50% after production",
    term: "Variable",
    whyItWorks: "Differentiates as 'bespoke'; high creativity premium",
    economics: "Includes creative strategy fee + media budget for distribution",
    details: `Occasionally, we pitch creative content strategies to engage brands (e.g. an "AI Stunt" series for an extreme-sports sponsor like Red Bull). In these proposals, we're selling ideas plus delivery.

For example, we might suggest producing a sequence of AI-generated extreme sports clips tagged with the brand, leveraging our network to amplify them. We present this like a mini "agency pitch deck"—concept, example visuals, and projected reach.

This shows thought leadership and differentiates us. We would promise something like "10 viral-style stunt videos, hitting 20M combined views" and map that to the brand's image.

**Example Positioning:** Cite Red Bull's own strategy of storytelling and user-generated content to justify our approach. The budget request would reflect the creative effort plus reach (likely in the higher-$10Ks). Emphasize we handle both creation strategy and distribution via influencers.`
  }
]

const decisionTree = [
  { question: "Do they have specific view targets?", yes: "Pitch Performance CPM", no: "Go to Q2" },
  { question: "Looking for 6+ month partnership?", yes: "Pitch Delivery Engine", no: "Go to Q3" },
  { question: "Do they understand CPM/advertising?", yes: "Go back to Q1", no: "Go to Q4" },
  { question: "Small client with monthly ongoing needs?", yes: "Pitch Monthly Retainer", no: "Pitch Flat Rate / Commercial" }
]

const commissionJustification = [
  { item: "Creator network management", percent: "15%", details: "Vetting, recruitment, contracts, payments" },
  { item: "Platform & technology", percent: "10%", details: "Dashboard, infrastructure, security, compliance" },
  { item: "Strategy & optimization", percent: "15%", details: "Content strategy, real-time monitoring, account management" },
  { item: "Team & operations", percent: "10%", details: "Account manager labor, overhead" }
]

const industryComparisons = [
  { industry: "Real estate agents", commission: "5–6%", note: "but on $1M+ transactions" },
  { industry: "Talent agencies", commission: "10–20%", note: "but for smaller deals" },
  { industry: "Influencer agencies", commission: "15–30%", note: "but no distributed network at scale" },
  { industry: "Your agency", commission: "50%", note: "justified by managing 70+ creators, proprietary tech, 24/7 management" }
]

export default function DealFlowsPage() {
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
          <h1 className="text-2xl font-semibold tracking-tight">Deal Flows & Pitch Guide</h1>
          <p className="text-muted-foreground mt-1">
            Four deal types to match any client, all targeting 50% margin
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Card className="border-foreground/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold mb-2">The Agency Value Proposition</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Our agency has developed a unique content distribution platform that leverages a network of content creators ("clippers") 
                    to deliver massive social media reach. We emphasize measurable value: our campaigns focus on <span className="text-foreground font-medium">guaranteed impressions/views</span> rather than just clicks.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-muted-foreground mb-1">Average Influencer CPM</p>
                      <p className="text-xl font-semibold">$4–5</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-muted-foreground mb-1">Traditional Digital Ads</p>
                      <p className="text-xl font-semibold">$7–8</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-muted-foreground mb-1">Our Network CPM</p>
                      <p className="text-xl font-semibold text-green-500">$1–2</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    By delivering content at scale through our network, we provide cost-effective brand exposure with <span className="text-foreground">ROI often exceeding 5x per dollar spent</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* The Four Deal Types */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-4">The Deal Types</h2>
          <p className="text-sm text-muted-foreground mb-6">
            All four deal types target <span className="text-foreground font-medium">50% margin</span>. Different positioning frameworks, same economics.
          </p>

          <div className="space-y-4">
            {dealTypes.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
              >
                <Card className={cn(
                  "transition-all cursor-pointer",
                  expandedDeal === deal.id && "border-foreground/20"
                )}>
                  <CardHeader 
                    onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <deal.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{deal.title}</CardTitle>
                          <CardDescription className="mt-1">{deal.subtitle}</CardDescription>
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
                        {/* Pitch */}
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">The Pitch</p>
                          <p className="text-sm font-medium italic">"{deal.pitch}"</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase">Ideal Client</p>
                              <p className="text-sm">{deal.idealClient}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase">Deal Size</p>
                              <p className="text-sm font-medium">{deal.dealSize}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase">Term</p>
                              <p className="text-sm">{deal.term}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase">Your Margin</p>
                              <p className="text-sm font-medium text-green-500">{deal.margin}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase">Why It Works</p>
                              <p className="text-sm">{deal.whyItWorks}</p>
                            </div>
                          </div>
                        </div>

                        {/* Economics */}
                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Economics Example</p>
                          <p className="text-sm text-muted-foreground">{deal.economics}</p>
                        </div>

                        {/* Details */}
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Details</p>
                          {deal.details.split('\n\n').map((para, j) => (
                            <p key={j} className="text-sm text-muted-foreground leading-relaxed"
                              dangerouslySetInnerHTML={{ 
                                __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') 
                              }}
                            />
                          ))}
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

        {/* Decision Tree */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Deal Type Selector</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Ask prospects in order:
          </p>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-0">
                {decisionTree.map((item, i) => (
                  <div key={i} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                        Q{i + 1}
                      </div>
                      {i !== decisionTree.length - 1 && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <h3 className="font-medium mb-3">{item.question}</h3>
                      <div className="grid md:grid-cols-2 gap-2">
                        <div className="p-2 bg-green-500/10 rounded text-sm border border-green-500/20">
                          <span className="font-medium text-green-500">YES →</span> {item.yes}
                        </div>
                        <div className="p-2 bg-muted rounded text-sm">
                          <span className="font-medium">NO →</span> {item.no}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* 50% Commission Justification */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">The 50% Commission Model</h2>
          <p className="text-sm text-muted-foreground mb-6">
            All four deal types target 50% margin. This is justified by real operational costs:
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {commissionJustification.map((item) => (
              <Card key={item.item}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{item.item}</p>
                    <span className="text-xs px-2 py-1 bg-muted rounded">{item.percent}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Industry Comparison</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium">Industry</th>
                      <th className="text-left py-2 font-medium">Commission</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {industryComparisons.map((row) => (
                      <tr key={row.industry} className="border-b border-border/50 last:border-0">
                        <td className="py-2">{row.industry}</td>
                        <td className="py-2 font-medium">{row.commission}</td>
                        <td className="py-2 text-muted-foreground text-xs">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* Pitching & Client Engagement */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Pitching & Client Engagement</h2>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When approaching a brand, start by researching their goals and audience. Lead with your value proposition: 
                  <span className="text-foreground"> authentic influencer content drives trust and engagement—on average, businesses earn ~$5.78 back for every $1 spent on influencer campaigns.</span>
                </p>
                
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Key Talking Points:</h3>
                  <ul className="space-y-2">
                    {[
                      "Show examples or case studies of past campaigns (views delivered, CPMs)",
                      "Explain each deal type, customizing to their size and objectives",
                      "Use clear, non-technical language: \"We will deliver X million views over Y weeks for Z dollars\"",
                      "Address objections by comparing to what they'd get spending the same on ads or TV (higher CPM, no guarantee)",
                      "Highlight network safety and compliance: all creators follow disclosure rules, real-time tracking"
                    ].map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* Contracts & Payment */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Contracts, Payment & Invoicing</h2>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each deal is formalized by a written agreement. The contract must clearly state the <span className="text-foreground">scope, deliverables, and payment terms</span>.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <h4 className="font-medium text-sm mb-2">Contract Must Include</h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Guaranteed impressions (e.g., "25M impressions across TikTok and YouTube within 3 months")</li>
                      <li>• Compensation and calculation method (e.g., $2 CPM × impressions)</li>
                      <li>• Invoice terms (50% upfront, remainder on completion)</li>
                      <li>• Net-30 or Net-15 payment schedules</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <h4 className="font-medium text-sm mb-2">Also Covers</h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Content usage rights</li>
                      <li>• FTC disclosure requirements</li>
                      <li>• Termination clauses</li>
                      <li>• Performance tracking via platform dashboard</li>
                    </ul>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our contracts mirror influencer marketing best practices: outlining payment, schedules, and deliverables explicitly. 
                  Throughout, we maintain transparency—clients see our platform's dashboard, and creators confirm content completion.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Related Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Related Resources</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/admin/agency/deal-templates">
              <Card className="hover:border-foreground/30 transition-colors cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Deal Templates</p>
                      <p className="text-sm text-muted-foreground">Full proposal, SOW, MSA, and invoice templates</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/agency/deal-quickref">
              <Card className="hover:border-foreground/30 transition-colors cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Quick Reference</p>
                      <p className="text-sm text-muted-foreground">One-page cheat sheets for each deal type</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
