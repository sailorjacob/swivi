"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  RefreshCw,
  Briefcase,
  Percent,
  Award,
  Building2,
  Users,
  TrendingUp,
  Shield,
  DollarSign,
  FileText,
  Video,
  Lightbulb
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const partnershipModels = [
  {
    title: "Retainer",
    icon: RefreshCw,
    description: "Ongoing monthly fees for continuous support and access",
    details: [
      "Prepaid in advance, runs for months or years",
      "Guarantees predictable cash flow",
      "Deepens client relationships over time",
      "Client gets fixed budget and dependable partner"
    ],
    example: "Monthly creator network access and optimization"
  },
  {
    title: "Project-Based",
    icon: Briefcase,
    description: "One-time campaigns with defined deliverables and scope",
    details: [
      "Flat fee for specific campaign or activation",
      "Clear start and end dates",
      "Deliverables spelled out in SOW",
      "Higher margins possible on big deals"
    ],
    example: "End-to-end video campaign for product launch"
  },
  {
    title: "Commission / Hybrid",
    icon: Percent,
    description: "Percentage of budgets plus management fees",
    details: [
      "Typically 10-20% on creator payouts",
      "Often combined with base retainer",
      "Aligns agency success with campaign performance",
      "Scales with larger budgets"
    ],
    example: "Keep 20% on creator payouts plus monthly strategy fee"
  },
  {
    title: "Performance Bonus",
    icon: Award,
    description: "Incentives tied to hitting specific KPIs",
    details: [
      "Bonus on top of base compensation",
      "Tied to metrics like views, engagement, or conversions",
      "Rewards results and builds trust",
      "Shows confidence in your ability to deliver"
    ],
    example: "Base fee plus bonus for exceeding view targets"
  }
]

const revenueStreams = [
  {
    stream: "Campaign Management Fees",
    description: "Flat fee for planning and executing campaigns",
    icon: FileText
  },
  {
    stream: "Monthly Retainers",
    description: "Ongoing strategy, support, and creator network access",
    icon: RefreshCw
  },
  {
    stream: "Commissions",
    description: "Percentage of deals or creator payout budgets",
    icon: Percent
  },
  {
    stream: "Content Packages",
    description: "Bundled video production with distribution",
    icon: Video
  },
  {
    stream: "Consulting",
    description: "Strategy advice for brands on activations and campaigns",
    icon: Lightbulb
  }
]

const workingWithBrands = [
  {
    title: "How Brands Engage",
    icon: Building2,
    points: [
      "RFPs (Request for Proposal) outline needs and budget",
      "Agencies pitch tailored solutions",
      "Multiple stakeholders involved (marketing, procurement, legal)",
      "Formal selection process with competing agencies"
    ]
  },
  {
    title: "What Brands Expect",
    icon: Shield,
    points: [
      "Case studies showing measurable impact",
      "Professional contracts (MSA, SOW)",
      "Clear metrics and reporting",
      "Risk mitigation and liability clarity"
    ]
  },
  {
    title: "Strategic Partner vs Vendor",
    icon: Users,
    points: [
      "Partners get retainers and long-term work",
      "Vendors get one-off projects",
      "Partners are involved in strategy discussions",
      "Position yourself as essential to their success"
    ]
  },
  {
    title: "Value of Retainers",
    icon: TrendingUp,
    points: [
      "Stability and security through contracts",
      "Predictable monthly revenue",
      "Deeper client relationships",
      "Opportunity to upsell additional services"
    ]
  }
]

export default function GuidePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
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
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <Link href="/admin/agency" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Agency Hub
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">How We Work</h1>
          <p className="text-muted-foreground mt-1">
            Partnership models, revenue streams, and working with big brands
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Partnership Models */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Partnership Models</h2>
          <p className="text-muted-foreground mb-6">
            Different ways to structure agency-client relationships, each with its own advantages.
          </p>
          
          <div className="grid gap-4">
            {partnershipModels.map((model, i) => (
              <motion.div
                key={model.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-foreground/5 rounded-lg">
                        <model.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{model.title}</CardTitle>
                        <CardDescription>{model.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-4">
                      {model.details.map((detail, j) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Example</p>
                      <p className="text-sm">{model.example}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* Revenue Streams */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Revenue Streams</h2>
          <p className="text-muted-foreground mb-6">
            Multiple ways to generate income from agency services.
          </p>
          
          <Card>
            <CardContent className="pt-6">
              <div className="divide-y divide-border">
                {revenueStreams.map((item, i) => (
                  <div key={item.stream} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="p-2 bg-muted rounded-lg">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.stream}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* Working with Big Brands */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Working with Big Brands</h2>
          <p className="text-muted-foreground mb-6">
            Understanding how large companies engage agencies and what they expect.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {workingWithBrands.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <section.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {section.points.map((point, j) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-foreground/5 to-foreground/10 border-foreground/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-foreground/10 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">The Goal: Long-Term Partnerships</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Large accounts provide stability and security through contracts or retainer fees. 
                    By combining traditional agency structures (MSAs, SOWs, retainers) with clear 
                    performance metrics, you can negotiate larger budgets and longer-term engagements. 
                    Always back up your pricing with value delivered.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

