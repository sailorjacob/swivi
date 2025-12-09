"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  FileText,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Scale,
  Pencil,
  DollarSign,
  Calendar,
  Users
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const keyTerms = [
  {
    term: "MSA",
    full: "Master Services Agreement",
    description: "The governing contract between agency and client that covers overall terms including payment, intellectual property, liability, termination, and confidentiality. This is the umbrella agreement under which specific projects are executed.",
    icon: FileText,
    importance: "essential"
  },
  {
    term: "SOW",
    full: "Statement of Work",
    description: "A document that spells out the specific scope of work, deliverables, timeline, budget, and payment terms for a particular project. Each campaign or project gets its own SOW under the MSA.",
    icon: Pencil,
    importance: "essential"
  },
  {
    term: "Retainer",
    full: "Retainer Agreement",
    description: "A set rate for a defined scope of work each period, typically prepaid in advance and running for months or years. Provides predictable cash flow and deepens client relationships.",
    icon: Clock,
    importance: "essential"
  },
  {
    term: "RFP",
    full: "Request for Proposal",
    description: "A formal solicitation from a brand outlining their needs, objectives, and budget, inviting agencies to submit proposals. Winning an RFP often requires competing against other agencies.",
    icon: BookOpen,
    importance: "common"
  },
  {
    term: "KPIs",
    full: "Key Performance Indicators",
    description: "Specific metrics used to measure success of a campaign or partnership. Examples include views, engagement rate, conversions, CPM, ROAS, or CPA.",
    icon: CheckCircle,
    importance: "essential"
  },
  {
    term: "Net-30 / Net-60",
    full: "Payment Terms",
    description: "The number of days after invoice date that payment is due. Net-30 means payment within 30 days, Net-60 within 60 days. Large brands often negotiate longer terms.",
    icon: Calendar,
    importance: "common"
  },
  {
    term: "Scope Creep",
    full: "Unplanned Scope Expansion",
    description: "When project requirements grow beyond the original agreement without corresponding adjustments to budget or timeline. Contracts should include change order procedures to handle this.",
    icon: AlertCircle,
    importance: "watch"
  },
  {
    term: "IP Rights",
    full: "Intellectual Property Rights",
    description: "Clarifies who owns the content created during the engagement. Important to specify whether the brand gets full ownership, limited license, or if the agency retains certain rights.",
    icon: Shield,
    importance: "essential"
  },
  {
    term: "Indemnification",
    full: "Liability Protection",
    description: "A clause where one party agrees to compensate the other for certain damages or losses. Important for protecting against third-party claims related to content or campaigns.",
    icon: Scale,
    importance: "common"
  },
  {
    term: "AOR",
    full: "Agency of Record",
    description: "Designates an agency as the primary partner for all marketing needs in a particular category. Being an AOR typically means more stable, long-term work.",
    icon: Users,
    importance: "goal"
  },
  {
    term: "Markup",
    full: "Cost Markup / Handling Fee",
    description: "A percentage added on top of direct costs (like creator payouts or media buys) to cover agency overhead and profit. Typically 15-20% on total costs.",
    icon: DollarSign,
    importance: "common"
  },
  {
    term: "Force Majeure",
    full: "Unforeseen Circumstances",
    description: "A contract clause that frees both parties from liability when an extraordinary event beyond their control prevents fulfillment of obligations.",
    icon: AlertCircle,
    importance: "common"
  }
]

const contractSections = [
  {
    section: "Scope of Work",
    description: "Clearly define what services will be provided, what's included, and what's explicitly excluded.",
    example: "Agency will produce 100 TikTok videos and distribute them via influencer network"
  },
  {
    section: "Deliverables & Timeline",
    description: "Specific outputs with deadlines. Be precise to avoid scope creep.",
    example: "20 videos posted per week over 5 weeks"
  },
  {
    section: "Payment Terms",
    description: "How much, when, and how payment will be made. Include late payment terms.",
    example: "50% due upon signing, 50% upon completion. Net-30 terms."
  },
  {
    section: "Reporting & Metrics",
    description: "What data will be provided and how often. Establishes accountability.",
    example: "Weekly reports including views, engagement, and top-performing content"
  },
  {
    section: "IP & Usage Rights",
    description: "Who owns the content and how it can be used. Critical for both parties.",
    example: "Brand receives perpetual license to use content across owned channels"
  },
  {
    section: "Termination",
    description: "How either party can end the agreement and what happens to work in progress.",
    example: "Either party may terminate with 30 days written notice"
  },
  {
    section: "Change Orders",
    description: "Process for handling requests that fall outside the original scope.",
    example: "Additional work requires written approval and revised budget"
  },
  {
    section: "Confidentiality",
    description: "What information must be kept private and for how long.",
    example: "All campaign details confidential for 2 years after completion"
  }
]

const importanceColors: Record<string, string> = {
  essential: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  common: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  watch: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  goal: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
}

const importanceLabels: Record<string, string> = {
  essential: "Essential",
  common: "Common",
  watch: "Watch For",
  goal: "Goal"
}

export default function TermsPage() {
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
          <h1 className="text-2xl font-semibold tracking-tight">Terms & Contracts</h1>
          <p className="text-muted-foreground mt-1">
            Key terminology and contract structures for agency work
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Key Terms Glossary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Key Terminology</h2>
          <p className="text-muted-foreground mb-6">
            Essential terms to know when negotiating and structuring deals.
          </p>
          
          <div className="space-y-3">
            {keyTerms.map((item, i) => (
              <motion.div
                key={item.term}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
              >
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-semibold">{item.term}</span>
                          <span className="text-sm text-muted-foreground">({item.full})</span>
                          <Badge variant="outline" className={`text-xs ${importanceColors[item.importance]}`}>
                            {importanceLabels[item.importance]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* What to Include in Contracts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">What to Include in Contracts</h2>
          <p className="text-muted-foreground mb-6">
            Essential sections for any SOW or project agreement.
          </p>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {contractSections.map((item, i) => (
                  <div key={item.section} className={i !== contractSections.length - 1 ? "pb-6 border-b border-border" : ""}>
                    <h3 className="font-medium mb-1">{item.section}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Example</p>
                      <p className="text-sm italic">"{item.example}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Pro Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-foreground/5 to-foreground/10 border-foreground/10">
            <CardContent className="pt-6">
              <h3 className="font-medium text-lg mb-4">Pro Tips</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Always get it in writing.</strong> Even small projects benefit from a simple SOW that outlines scope and payment.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Be specific about exclusions.</strong> What you won't do is as important as what you will do.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Include revision limits.</strong> Unlimited revisions can quickly erode margins.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Set communication expectations.</strong> Response times, meeting frequency, and escalation procedures.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

