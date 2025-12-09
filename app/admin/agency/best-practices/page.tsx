"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  Shield,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const bestPractices = [
  {
    title: "Use Clear Terminology",
    icon: MessageSquare,
    description: "Speak the language of professional agencies",
    dos: [
      "Use terms like retainer, MSA, SOW, KPIs correctly",
      "Define metrics clearly in all communications",
      "Be precise about scope and deliverables",
      "Document everything in writing"
    ],
    donts: [
      "Use vague language about what's included",
      "Promise things not explicitly in the agreement",
      "Assume the client understands industry terms"
    ]
  },
  {
    title: "Structure Deals Thoughtfully",
    icon: FileText,
    description: "Create agreements that protect both parties",
    dos: [
      "Consider hybrid models (base + performance bonuses)",
      "Include change order procedures for scope changes",
      "Set clear payment milestones and terms",
      "Define what's included AND excluded"
    ],
    donts: [
      "Leave scope open-ended",
      "Agree to unlimited revisions",
      "Start work before contracts are signed"
    ]
  },
  {
    title: "Leverage Results",
    icon: TrendingUp,
    description: "Use your track record to win bigger deals",
    dos: [
      "Document all campaign metrics systematically",
      "Create case studies from successful projects",
      "Tie results to business outcomes (ROI, not just views)",
      "Use past performance to justify pricing"
    ],
    donts: [
      "Undersell your achievements",
      "Forget to collect testimonials",
      "Compare to irrelevant benchmarks"
    ]
  },
  {
    title: "Educate Your Clients",
    icon: Users,
    description: "Help brands understand your value",
    dos: [
      "Explain how creator-driven content works",
      "Share industry context and benchmarks",
      "Be transparent about process and timeline",
      "Set realistic expectations upfront"
    ],
    donts: [
      "Assume they know how influencer marketing works",
      "Overpromise to close a deal",
      "Hide challenges or limitations"
    ]
  },
  {
    title: "Focus on Partnership",
    icon: Shield,
    description: "Build relationships, not just transactions",
    dos: [
      "Treat each project as part of a growing relationship",
      "Proactively share insights and recommendations",
      "Be responsive and communicative",
      "Look for ways to add value beyond the contract"
    ],
    donts: [
      "Disappear between deliverables",
      "Only reach out when you want something",
      "Treat clients as one-time transactions"
    ]
  },
  {
    title: "Manage Time Wisely",
    icon: Clock,
    description: "Protect your capacity and set boundaries",
    dos: [
      "Set clear response time expectations",
      "Schedule regular check-ins vs. ad-hoc requests",
      "Build buffer time into project timelines",
      "Track time spent vs. estimated"
    ],
    donts: [
      "Promise immediate responses 24/7",
      "Let scope creep go unchecked",
      "Underestimate how long things take"
    ]
  },
  {
    title: "Deliver Consistently",
    icon: Target,
    description: "Build a reputation for reliability",
    dos: [
      "Meet deadlines or communicate early if at risk",
      "Maintain quality standards across all work",
      "Provide regular progress updates",
      "Own mistakes and fix them quickly"
    ],
    donts: [
      "Miss deadlines without warning",
      "Let quality slip on smaller projects",
      "Make excuses instead of solutions"
    ]
  },
  {
    title: "Protect Yourself",
    icon: Shield,
    description: "Mitigate risks with proper documentation",
    dos: [
      "Use contracts for all work, even small projects",
      "Get sign-off on key deliverables",
      "Document all communications and decisions",
      "Have clear IP and usage terms"
    ],
    donts: [
      "Work on a handshake agreement",
      "Assume verbal approvals are binding",
      "Forget to define ownership of content"
    ]
  }
]

const quickReminders = [
  "Always get scope in writing before starting work",
  "A smaller retainer beats a bigger one-off project",
  "Your case studies are your most valuable sales tool",
  "Respond to client emails within 24 hours",
  "Underpromise, overdeliver",
  "When in doubt, schedule a call instead of a long email chain",
  "Track everything—you'll need the data later",
  "The best clients come from referrals"
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
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <Link href="/admin/agency" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Agency Hub
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Best Practices</h1>
          <p className="text-muted-foreground mt-1">
            Quick reference principles for operating professionally
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Quick Reminders */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Card className="bg-gradient-to-br from-foreground/5 to-foreground/10 border-foreground/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-foreground/10 rounded-lg">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h2 className="font-semibold">Quick Reminders</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {quickReminders.map((reminder, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{reminder}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Best Practices Grid */}
        <div className="space-y-6">
          {bestPractices.map((practice, i) => (
            <motion.div
              key={practice.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.03 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-foreground/5 rounded-lg">
                      <practice.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{practice.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{practice.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-2 gap-6 pl-14">
                    {/* Do's */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Do</span>
                      </div>
                      <ul className="space-y-2">
                        {practice.dos.map((item, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Don'ts */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Don't</span>
                      </div>
                      <ul className="space-y-2">
                        {practice.donts.map((item, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

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
                Ready to put these practices into action?
              </p>
              <Link 
                href="/admin/agency/deals/new"
                className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-6 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
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

