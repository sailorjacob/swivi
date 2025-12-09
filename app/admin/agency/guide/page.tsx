"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  Calculator,
  FileText,
  DollarSign,
  Users,
  Shield,
  Percent
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const agencyFormula = [
  {
    component: "Media Budget",
    description: "Pass-through costs to creators",
    detail: "The money that goes directly into creators' pockets. Tell the client: \"We need a $50,000 media budget to secure 70 creators.\" You make $0 profit on this line item, but it anchors the deal size.",
    profit: false
  },
  {
    component: "Agency Service Fee",
    description: "20-30% of Media Budget",
    detail: "What it covers: Sourcing creators, briefing, quality control, payouts, reporting. Brands pay this because managing 70+ creators is a nightmare—they're paying you to handle the headache.",
    profit: true
  },
  {
    component: "Content Strategy",
    description: "Creative direction & briefs",
    detail: "Hook development, content angles, platform-specific optimization. This positions you as a strategic partner, not just a vendor.",
    profit: true
  },
  {
    component: "Usage Rights",
    description: "Licensing for reposts & extended use",
    detail: "If the brand wants to repost videos on their main account or keep content up for 12+ months, that's a Licensing Fee. Standard: 30% of creator's base rate per month.",
    profit: true
  },
  {
    component: "Whitelisting Access",
    description: "Spark Ads & paid amplification",
    detail: "If the brand wants to run paid ads using creators' posts (which outperforms brand ads), charge a Whitelisting Fee: $250-$5,000 per post, or a flat campaign fee.",
    profit: true
  }
]

const dealStructureExample = [
  { item: "Media Budget", description: "Payment to 70 Creators (Pass-through)", clientCost: 50000, profit: 0 },
  { item: "Agency Service Fee", description: "30% Management Fee on Media Spend", clientCost: 15000, profit: 15000 },
  { item: "Content Strategy", description: "Creative Direction (Hooks, Briefs)", clientCost: 10000, profit: 10000 },
  { item: "Usage Rights", description: "6-month licensing for top 50 videos", clientCost: 15000, profit: 15000 },
  { item: "Whitelisting Access", description: "Allowing brand to boost posts (Spark Ads)", clientCost: 10000, profit: 10000 }
]

const revenueStreams = [
  {
    stream: "Campaign Management Fees",
    description: "20-30% on media spend for sourcing, briefing, QC, and reporting",
    typical: "$15,000-$30,000 per campaign"
  },
  {
    stream: "Content Strategy",
    description: "Creative direction, hook development, platform optimization",
    typical: "$5,000-$15,000 per campaign"
  },
  {
    stream: "Usage Rights & Licensing",
    description: "Extended use, reposts, perpetuity rights (never give away free)",
    typical: "30% of creator rate/month"
  },
  {
    stream: "Whitelisting / Spark Ads",
    description: "Access to creator backends for paid amplification",
    typical: "$250-$5,000 per post"
  },
  {
    stream: "Monthly Retainers",
    description: "Ongoing access to creator network and priority placement",
    typical: "$5,000-$25,000/month"
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }

  const totalClientCost = dealStructureExample.reduce((sum, item) => sum + item.clientCost, 0)
  const totalProfit = dealStructureExample.reduce((sum, item) => sum + item.profit, 0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <Link href="/admin/agency" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Agency
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">How We Work</h1>
          <p className="text-muted-foreground mt-1">
            The agency model for $100k+ campaigns
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* The Agency Model Formula */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Calculator className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">The Agency Model Formula</h2>
          </div>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center p-4 bg-muted rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-2">Total Fee</p>
                <p className="text-lg font-mono">
                  Media Budget + Agency Service Fee + Production/Usage Fees
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                You are currently using a <span className="text-foreground">Cost-Plus model</span> (Labor + Small Markup). 
                You need to move to an <span className="text-foreground">Agency model</span> where you charge for strategy, 
                management, and rights—not just content delivery.
              </p>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            {agencyFormula.map((item, i) => (
              <motion.div
                key={item.component}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium">{item.component}</span>
                          {item.profit ? (
                            <span className="text-xs px-2 py-0.5 bg-foreground/10 text-foreground rounded">
                              Profit Center
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                              Pass-through
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        <p className="text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* $100k Deal Structure Example */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">$100k Deal Structure Example</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Here's how you pitch the next $100k deal (instead of $23k). Note: Creator network will scale—70 is current, goal is 1,000+.
          </p>
          
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 font-medium">Line Item</th>
                      <th className="text-left py-3 font-medium">Description</th>
                      <th className="text-right py-3 font-medium">Client Cost</th>
                      <th className="text-right py-3 font-medium">Your Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealStructureExample.map((row) => (
                      <tr key={row.item} className="border-b border-border/50">
                        <td className="py-3 font-medium">{row.item}</td>
                        <td className="py-3 text-muted-foreground">{row.description}</td>
                        <td className="py-3 text-right">{formatCurrency(row.clientCost)}</td>
                        <td className="py-3 text-right">
                          {row.profit > 0 ? (
                            <span className="font-medium">{formatCurrency(row.profit)}</span>
                          ) : (
                            <span className="text-muted-foreground">$0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border">
                      <td colSpan={2} className="py-3 font-semibold">Total</td>
                      <td className="py-3 text-right font-semibold">{formatCurrency(totalClientCost)}</td>
                      <td className="py-3 text-right font-semibold">
                        {formatCurrency(totalProfit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Result:</span> The client pays $100k (getting ~$1.50 CPM, still a great deal), 
                  and you profit <span className="font-medium">$50,000</span> instead of $3,000.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* Revenue Streams */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Percent className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Revenue Streams</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Multiple ways to generate income from agency services.
          </p>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {revenueStreams.map((item, i) => (
                  <div key={item.stream} className={i !== revenueStreams.length - 1 ? "pb-4 border-b border-border/50" : ""}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.stream}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium">{item.typical}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-foreground/10 bg-foreground/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Critical Rule: Never Give Away Perpetuity Rights</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                "Perpetuity" means owning video rights forever. <span className="text-foreground font-medium">Never give this away for free.</span> Charge 
                100%+ markup for perpetual licensing. If the brand loves the content enough to want it forever, 
                that's a signal of massive value—price accordingly.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
