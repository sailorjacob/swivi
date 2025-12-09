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
  CheckCircle,
  ArrowRight,
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  Briefcase,
  Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const resourceCards = [
  {
    title: "How We Work",
    description: "Partnership models, revenue streams, and working with big brands",
    href: "/admin/agency/guide",
    icon: BookOpen,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    highlights: ["Retainers & Projects", "Commission Models", "Brand Partnerships"]
  },
  {
    title: "Terms & Contracts",
    description: "Key terminology, contract structures, and what to include in deals",
    href: "/admin/agency/terms",
    icon: FileText,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    highlights: ["MSA & SOW", "Payment Terms", "Scope & Deliverables"]
  },
  {
    title: "Pitching Clients",
    description: "How to land big brands and structure winning proposals",
    href: "/admin/agency/pitching",
    icon: Target,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    highlights: ["Case Studies", "Value Positioning", "Pilot Projects"]
  },
  {
    title: "Best Practices",
    description: "Quick reference principles for operating professionally",
    href: "/admin/agency/best-practices",
    icon: Lightbulb,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    highlights: ["Communication", "Documentation", "Partnerships"]
  }
]

const statsOverview = [
  { label: "Partnership Models", value: "4", icon: Briefcase },
  { label: "Revenue Streams", value: "5", icon: DollarSign },
  { label: "Key Terms", value: "12+", icon: FileText },
  { label: "Best Practices", value: "8", icon: CheckCircle }
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
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Agency Playbook</h1>
              <p className="text-muted-foreground mt-1">
                Your guide to operating as a professional agency
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

      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {statsOverview.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <stat.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-foreground/5 to-foreground/10 border-foreground/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-foreground/10 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-medium text-lg mb-2">From Projects to Partnerships</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Transitioning to traditional agency flows involves professionalizing with contracts, 
                    focusing on ROI, and building long-term relationships. Position yourself as a strategic 
                    partner—not just a vendor—to secure retainer-style contracts that match a full-time 
                    team's commitment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resource Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {resourceCards.map((card, i) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
              >
                <Link href={card.href}>
                  <Card className="h-full hover:border-foreground/30 transition-colors cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-lg ${card.color}`}>
                          <card.icon className="w-5 h-5" />
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
                            className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground"
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

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h2 className="text-lg font-medium mb-4">Deal Management</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/admin/agency/deals/new">
              <Card className="hover:border-foreground/30 transition-colors cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-foreground text-background rounded-lg">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Create New Deal</p>
                        <p className="text-sm text-muted-foreground">Generate a proposal, invoice, or quote</p>
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
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">View All Deals</p>
                        <p className="text-sm text-muted-foreground">Manage saved proposals and track status</p>
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

