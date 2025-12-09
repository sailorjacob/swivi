"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const criticalRules = [
  {
    rule: "Never quote a flat price first",
    why: "Ask for their media budget. This anchors the conversation around value, not your costs. Let them tell you their range before you propose numbers.",
    do: "\"What media budget are you working with for this activation?\"",
    dont: "\"We can do this for $15,000.\""
  },
  {
    rule: "Separate your fees visually",
    why: "Show Media Budget vs. Agency Fees vs. Usage Rights. Transparency builds trust and justifies your value.",
    do: "Line-item breakdown showing pass-through costs separately from your management fee",
    dont: "Single lump sum that hides your margins"
  },
  {
    rule: "Never give away perpetuity rights for free",
    why: "If they want content forever, that's a signal of massive value. Charge 100%+ markup for perpetual licensing.",
    do: "\"Perpetual rights require a 100% licensing premium on the base rate.\"",
    dont: "Including \"all rights in perpetuity\" in your base package"
  },
  {
    rule: "Always upsell usage rights after delivery",
    why: "If they love the content, they'll want to use it more. This is found money.",
    do: "\"For $10k, we can whitelist the top 20 posts so you can put ad spend behind them.\"",
    dont: "Assuming the deal is done when content is delivered"
  },
  {
    rule: "Get an MSA before sending SOWs",
    why: "Once the legal framework is in place, new campaigns don't need fresh legal review. This reduces friction for repeat business.",
    do: "\"Let's get the MSA signed first—then we can move quickly on specific campaigns.\"",
    dont: "Negotiating every single campaign from scratch"
  },
  {
    rule: "Position as strategic partner, not vendor",
    why: "Vendors get one-off projects. Partners get retainers and long-term work. Partners are involved in strategy discussions.",
    do: "\"Here's our recommendation for your Q1 activation strategy...\"",
    dont: "\"Just tell us what you need and we'll quote it.\""
  },
  {
    rule: "Never start work before contracts are signed",
    why: "Verbal approvals are not binding. Scope creep happens. Protect yourself.",
    do: "\"We'll begin creative briefing as soon as the SOW is executed.\"",
    dont: "\"Sure, we can get started while legal reviews the paperwork.\""
  },
  {
    rule: "Include revision limits in every SOW",
    why: "Unlimited revisions erode margins quickly. Define what's included and what costs extra.",
    do: "\"Two rounds of revisions included. Additional rounds at $X per round.\"",
    dont: "\"We'll keep revising until you're happy.\""
  }
]

const quickReference = [
  "Ask for their budget before quoting your price",
  "Break fees into Media, Management, and Rights",
  "Get the MSA signed first, then send SOWs",
  "Start with a pilot project to prove value",
  "Document everything in case study format",
  "Respond to client emails within 24 hours",
  "Include kill fees for cancelled projects",
  "Set clear approval windows (48 hours = approved)"
]

const pricingMindset = [
  {
    shift: "From \"What do I need to charge?\"",
    to: "\"What is this worth to them?\""
  },
  {
    shift: "From \"Cost-plus markup\"",
    to: "\"Value-based pricing with separate line items\""
  },
  {
    shift: "From \"One flat fee\"",
    to: "\"Base fee + Usage Rights + Whitelisting\""
  },
  {
    shift: "From \"Competing on price\"",
    to: "\"Competing on CPM efficiency and speed\""
  }
]

export default function BestPracticesPage() {
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
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <Link href="/admin/agency" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Agency
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Best Practices</h1>
          <p className="text-muted-foreground mt-1">
            Operational principles for scaling to $100k+ deals
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Quick Reference */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Card className="border-foreground/10 bg-foreground/5">
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-4">Quick Reference</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {quickReference.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Pricing Mindset Shifts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-xl font-semibold mb-4">Pricing Mindset Shifts</h2>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {pricingMindset.map((item, i) => (
                  <div key={i} className={i !== pricingMindset.length - 1 ? "pb-4 border-b border-border/50" : ""}>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground line-through">{item.shift}</p>
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.to}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* Critical Rules */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4">Critical Rules</h2>
          
          <div className="space-y-4">
            {criticalRules.map((item, i) => (
              <motion.div
                key={item.rule}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.03 }}
              >
                <Card>
                  <CardContent className="py-5">
                    <h3 className="font-medium mb-2">{item.rule}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{item.why}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Do</span>
                        </div>
                        <p className="text-sm">{item.do}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">Don't</span>
                        </div>
                        <p className="text-sm">{item.dont}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-10"
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Ready to structure your next deal?
              </p>
              <Link 
                href="/admin/agency/deals/new"
                className="inline-flex items-center justify-center rounded-lg bg-foreground text-background px-6 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Create a New Deal
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
