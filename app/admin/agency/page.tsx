"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  BookOpen, 
  FileText, 
  Target, 
  Lightbulb, 
  ArrowRight,
  Plus,
  Building2,
  TrendingUp,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const resourceCards = [
  {
    title: "How We Work",
    description: "Pricing models, deal structures, and the agency formula for $100k+ campaigns",
    href: "/admin/agency/guide",
    icon: BookOpen,
    highlights: ["Agency Model Formula", "Deal Structure", "Revenue Streams"]
  },
  {
    title: "Terms & Contracts",
    description: "MSA, SOW, usage rights, and the legal framework for enterprise clients",
    href: "/admin/agency/terms",
    icon: FileText,
    highlights: ["MSA & SOW", "Usage Rights", "Whitelisting"]
  },
  {
    title: "Landing Big Clients",
    description: "Strategy for pitching Netflix, Red Bull, and enterprise brands",
    href: "/admin/agency/pitching",
    icon: Target,
    highlights: ["Decision Makers", "Innovation Budget", "Case Studies"]
  },
  {
    title: "Best Practices",
    description: "Operational principles for scaling to $100k+ deals",
    href: "/admin/agency/best-practices",
    icon: Lightbulb,
    highlights: ["Value-Based Pricing", "Rights Management", "Client Communication"]
  }
]

export default function AgencyHubPage() {
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

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isDemoMode && (!session || session.user?.role !== "ADMIN")) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Agency Operations</h1>
              <p className="text-muted-foreground mt-1">
                From vendor to strategic partner
              </p>
            </div>
            <Link href="/admin/agency/deals/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Deal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Executive Summary Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-semibold mb-2">The Pricing Gap</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    You are currently leaving <span className="text-foreground font-medium">$70,000–$80,000 on the table per campaign</span> by 
                    pricing as a vendor (cost-plus) rather than a strategic agency (value-based).
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-background rounded-lg border border-border">
                      <p className="text-muted-foreground mb-1">What You Charged</p>
                      <p className="text-xl font-semibold">$23,000</p>
                      <p className="text-xs text-muted-foreground">$1.15 CPM</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg border border-border">
                      <p className="text-muted-foreground mb-1">Market Value</p>
                      <p className="text-xl font-semibold">$92k–$160k</p>
                      <p className="text-xs text-muted-foreground">$4.60–$8.00 CPM</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg border border-border">
                      <p className="text-muted-foreground mb-1">Value Left Behind</p>
                      <p className="text-xl font-semibold text-amber-500">~$100,000</p>
                      <p className="text-xs text-muted-foreground">Per campaign</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Core Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold mb-2">The Path to $100k+ Fees</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Stop charging for "posts." Start charging for <span className="text-foreground">Strategy</span>, <span className="text-foreground">Management</span>, and <span className="text-foreground">Rights</span>. 
                    Big brands don't pay for content—they pay for outcomes, risk mitigation, and operational convenience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resource Cards */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {resourceCards.map((card, i) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
              >
                <Link href={card.href}>
                  <Card className="h-full hover:border-foreground/30 transition-colors cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-muted">
                          <card.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardTitle className="text-base mt-3">{card.title}</CardTitle>
                      <CardDescription className="text-sm">{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {card.highlights.map((highlight) => (
                          <span 
                            key={highlight}
                            className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Deal Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Deal Management</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/admin/agency/deals/new">
              <Card className="hover:border-foreground/30 transition-colors cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-foreground text-background rounded-lg">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">Create New Deal</p>
                        <p className="text-sm text-muted-foreground">Proposal, invoice, or SOW</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/agency/deals">
              <Card className="hover:border-foreground/30 transition-colors cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">View All Deals</p>
                        <p className="text-sm text-muted-foreground">Manage and track status</p>
                      </div>
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
