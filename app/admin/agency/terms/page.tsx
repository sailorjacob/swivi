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
  CheckCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const legalFramework = [
  {
    term: "MSA",
    full: "Master Services Agreement",
    nickname: "\"The Marriage\"",
    description: "The high-level contract that governs the entire relationship. You sign this once with a big brand (e.g., Netflix), and it covers you for 1-3 years.",
    covers: ["Payment terms (Net 30/60)", "Confidentiality (NDA)", "Liability limits", "Dispute resolution"],
    why: "Once signed, you become a \"preferred vendor.\" New campaigns don't need fresh legal review, making budget approval much faster.",
    importance: "essential"
  },
  {
    term: "SOW",
    full: "Statement of Work",
    nickname: "\"The Date\"",
    description: "The specific contract for each campaign (e.g., \"Owning Manhattan Season 1 Launch\"). Falls under the MSA umbrella.",
    covers: ["Specific deliverables (400 videos)", "Timelines and milestones", "Project-specific budget", "Success metrics"],
    why: "Your goal is to get an MSA signed so you can send multiple SOWs throughout the year without friction.",
    importance: "essential"
  }
]

const terminologyCheatsheet = [
  {
    term: "Pass-Through Costs",
    definition: "Costs you pay to creators directly with no markup. Shows transparency and anchors deal size.",
    usage: "\"Our $50k media budget is pass-through—it goes directly to the 70 creators.\""
  },
  {
    term: "AOR",
    definition: "Agency of Record. Being the exclusive partner for a brand in your category. The goal for long-term stability.",
    usage: "\"We'd like to discuss becoming your AOR for creator-driven campaigns.\""
  },
  {
    term: "CPM",
    definition: "Cost Per Mille (thousand views). Standard metric for media value. Market rate for TikTok/Reels: $4.60-$8.00.",
    usage: "\"We delivered a $1.15 CPM—industry standard is $4.60+.\""
  },
  {
    term: "CPE",
    definition: "Cost Per Engagement. Often more meaningful than views. Shows quality of attention.",
    usage: "\"We achieved a $0.02 CPE—industry standard is $0.15.\""
  },
  {
    term: "Flighting",
    definition: "The timeline of when posts go live. Strategic timing for maximum impact.",
    usage: "\"We recommend a 4-week flight with heavier posting in weeks 1 and 3.\""
  },
  {
    term: "Whitelisting / Spark Ads",
    definition: "Gaining access to the creator's backend to run their post as a paid ad. Outperforms brand ads.",
    usage: "\"For an extra $10k, we can whitelist the top 20 posts so you can put ad spend behind them.\""
  },
  {
    term: "Perpetuity",
    definition: "Owning video rights forever. NEVER give this away for free. Charge 100%+ markup.",
    usage: "\"Perpetual rights require a 100% licensing premium.\""
  },
  {
    term: "Usage Rights",
    definition: "Permission to repost content on brand channels or keep it up beyond the campaign period.",
    usage: "\"Base fee includes 30-day usage. Extended use is 30% per additional month.\""
  },
  {
    term: "Net 30/60/90",
    definition: "Payment due 30/60/90 days after invoice. Big brands often negotiate longer terms.",
    usage: "\"Our standard terms are Net 30, but we can accommodate Net 45 for annual contracts.\""
  },
  {
    term: "Scope Creep",
    definition: "When project requirements grow beyond the original agreement. Contracts must address this.",
    usage: "\"Additional deliverables outside the SOW will require a change order.\""
  },
  {
    term: "Change Order",
    definition: "Formal amendment to add work or budget to an existing SOW.",
    usage: "\"We'll draft a change order for the additional 20 videos.\""
  },
  {
    term: "Kill Fee",
    definition: "Payment due if a project is cancelled after work has begun. Protects your investment.",
    usage: "\"Cancellation after creative briefing incurs a 25% kill fee.\""
  }
]

const contractSections = [
  {
    section: "Scope of Work",
    description: "Define what's included AND excluded. Be specific.",
    example: "Agency will source, brief, and manage 70 creators. Brand approval on final creator list required within 5 business days."
  },
  {
    section: "Deliverables & Timeline",
    description: "Specific outputs with deadlines. Include approval windows.",
    example: "400 videos delivered over 4-week flight. Weekly reporting every Friday."
  },
  {
    section: "Payment Structure",
    description: "Break down all components. Show pass-through vs. fees.",
    example: "50% deposit on signing, 50% on campaign completion. Net 30 from invoice date."
  },
  {
    section: "Usage Rights",
    description: "Define what the brand can do with the content and for how long.",
    example: "Brand receives 90-day license for organic reposting. Paid amplification requires separate whitelisting agreement."
  },
  {
    section: "IP & Ownership",
    description: "Who owns what. Creators retain underlying IP; brand gets limited license.",
    example: "Creators retain ownership. Brand receives exclusive license for campaign duration plus 90 days."
  },
  {
    section: "Approval Process",
    description: "How content gets approved. Include response windows.",
    example: "Brand has 48 hours to approve or request revisions. No response = approved."
  },
  {
    section: "Termination",
    description: "How to exit and what happens to work in progress.",
    example: "Either party may terminate with 14 days written notice. Work completed to date is paid in full."
  },
  {
    section: "Confidentiality",
    description: "What stays private. Usually survives contract termination.",
    example: "Campaign details, pricing, and performance data remain confidential for 2 years post-completion."
  }
]

const importanceColors: Record<string, string> = {
  essential: "border-foreground/20"
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
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <Link href="/admin/agency" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Agency
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Terms & Contracts</h1>
          <p className="text-muted-foreground mt-1">
            The legal framework for enterprise clients
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Legal Framework */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">The Commercial Structure</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Big brands like Netflix or Red Bull don't work on invoices alone. They work on legal frameworks. 
            You need two specific documents to look professional and lock in long-term deals.
          </p>
          
          <div className="space-y-4">
            {legalFramework.map((item, i) => (
              <motion.div
                key={item.term}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className={importanceColors[item.importance]}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{item.term}</CardTitle>
                      <span className="text-sm text-muted-foreground">({item.full})</span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{item.nickname}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">What it covers</p>
                      <div className="flex flex-wrap gap-2">
                        {item.covers.map((cover) => (
                          <span key={cover} className="text-xs px-2 py-1 bg-muted rounded">
                            {cover}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Why you need it</p>
                      <p className="text-sm">{item.why}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-foreground/5 border border-foreground/10 rounded-lg">
            <p className="text-sm font-medium mb-1">Strategy</p>
            <p className="text-sm text-muted-foreground">
              Your goal is to get an MSA signed first, then send multiple SOWs throughout the year without needing fresh legal review each time.
            </p>
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* Terminology Cheatsheet */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Terminology Cheat Sheet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Use these terms in emails and calls to sound like a partner, not a gig worker.
          </p>
          
          <div className="space-y-3">
            {terminologyCheatsheet.map((item, i) => (
              <motion.div
                key={item.term}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.02 }}
              >
                <Card>
                  <CardContent className="py-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-medium">{item.term}</span>
                      <p className="text-sm text-muted-foreground">{item.definition}</p>
                      <div className="p-2 bg-muted rounded text-sm font-mono">
                        {item.usage}
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
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">What to Include in Contracts</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Essential sections for any SOW or project agreement.
          </p>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {contractSections.map((item, i) => (
                  <div key={item.section} className={i !== contractSections.length - 1 ? "pb-6 border-b border-border/50" : ""}>
                    <h3 className="font-medium mb-1">{item.section}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Example Language</p>
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
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-foreground/10 bg-foreground/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Critical Reminders</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm">
                  <span className="w-1 h-1 rounded-full bg-foreground mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">Always get it in writing.</span> Even small projects need a simple SOW.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="w-1 h-1 rounded-full bg-foreground mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">Never start work before contracts are signed.</span> Verbal approvals are not binding.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="w-1 h-1 rounded-full bg-foreground mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">Separate your fees.</span> Show "Media Budget" vs. "Agency Fees" vs. "Usage Rights."
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="w-1 h-1 rounded-full bg-foreground mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">Include revision limits.</span> Unlimited revisions erode margins quickly.
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
