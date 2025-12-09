"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  Target,
  TrendingUp,
  FileText,
  Users,
  CheckCircle,
  Star,
  Lightbulb,
  BarChart3,
  Zap,
  Award,
  MessageSquare
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const buildingCredibility = [
  {
    title: "Lead with Results",
    description: "Open with specific, impressive metrics from past campaigns",
    details: [
      "Highlight views, engagement rates, conversions",
      "Compare to industry benchmarks (show you outperform)",
      "Use real campaign names when possible (with permission)",
      "Quantify ROI—translate views to business value"
    ],
    icon: BarChart3
  },
  {
    title: "Case Studies",
    description: "Document your wins in a format brands can easily review",
    details: [
      "Challenge: What was the brand trying to achieve?",
      "Solution: What did you propose and execute?",
      "Results: Hard numbers and outcomes",
      "Testimonial: Client quote if available"
    ],
    icon: FileText
  },
  {
    title: "Niche Expertise",
    description: "Emphasize what makes you different from traditional agencies",
    details: [
      "Creator network scale and quality",
      "Platform-specific knowledge (TikTok, Instagram, etc.)",
      "Speed and agility vs. big agencies",
      "Authenticity of creator-driven content"
    ],
    icon: Star
  }
]

const pitchStructure = [
  {
    step: "1",
    title: "Hook",
    description: "Start with something that gets their attention—a surprising stat, a relevant success, or insight into their market."
  },
  {
    step: "2",
    title: "Problem / Opportunity",
    description: "Show you understand their challenges or goals. This proves you've done your homework."
  },
  {
    step: "3",
    title: "Solution",
    description: "Present your approach. How does your creator network solve their problem better than alternatives?"
  },
  {
    step: "4",
    title: "Proof",
    description: "Back it up with case studies, metrics, and examples of similar work."
  },
  {
    step: "5",
    title: "Investment",
    description: "Present the budget breakdown clearly. Show what they get at each level if offering options."
  },
  {
    step: "6",
    title: "Next Steps",
    description: "Make it easy to say yes. Propose a clear path forward—meeting, pilot project, or contract."
  }
]

const landingClients = [
  {
    approach: "Pilot Projects",
    description: "Propose a smaller initial project to build trust",
    why: "Lowers risk for the brand, lets you prove value before asking for bigger commitments",
    icon: Zap
  },
  {
    approach: "Personalized Outreach",
    description: "Research the brand and tailor your pitch specifically to them",
    why: "Generic pitches get ignored. Show you understand their brand, audience, and goals",
    icon: MessageSquare
  },
  {
    approach: "Network & Referrals",
    description: "Leverage existing relationships and ask for introductions",
    why: "Warm introductions convert at much higher rates than cold outreach",
    icon: Users
  },
  {
    approach: "Demonstrate Value First",
    description: "Consider creating spec content or analysis to show what you can do",
    why: "Shows initiative and lets them see the quality before committing",
    icon: Award
  }
]

const valueTranslation = [
  {
    metric: "Views",
    business: "Brand Awareness / Reach",
    tip: "Compare to paid media CPMs to show value"
  },
  {
    metric: "Engagement",
    business: "Audience Connection",
    tip: "Higher engagement = more qualified attention"
  },
  {
    metric: "Click-throughs",
    business: "Traffic & Consideration",
    tip: "Track with UTMs to prove website impact"
  },
  {
    metric: "Conversions",
    business: "Revenue / ROI",
    tip: "The ultimate proof of value—tie to sales when possible"
  }
]

export default function PitchingPage() {
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
          <h1 className="text-2xl font-semibold tracking-tight">Pitching & Landing Clients</h1>
          <p className="text-muted-foreground mt-1">
            How to win big brands and structure winning proposals
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Building Credibility */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Building Credibility</h2>
          <p className="text-muted-foreground mb-6">
            Establish trust and expertise before asking for big commitments.
          </p>
          
          <div className="grid gap-4">
            {buildingCredibility.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-foreground/5 rounded-lg">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pl-16">
                    <ul className="space-y-2">
                      {item.details.map((detail, j) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* Pitch Structure */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Pitch Structure</h2>
          <p className="text-muted-foreground mb-6">
            A proven framework for structuring persuasive proposals.
          </p>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-0">
                {pitchStructure.map((item, i) => (
                  <div key={item.step} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                        {item.step}
                      </div>
                      {i !== pitchStructure.length - 1 && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <h3 className="font-medium mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* Landing Clients */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Landing Big Clients</h2>
          <p className="text-muted-foreground mb-6">
            Strategies for winning major brand partnerships.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {landingClients.map((item, i) => (
              <motion.div
                key={item.approach}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.05 }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-base">{item.approach}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Why it works</p>
                      <p className="text-sm">{item.why}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* Translating Value */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Translating Metrics to Business Value</h2>
          <p className="text-muted-foreground mb-6">
            Brands care about outcomes. Here's how to connect your metrics to their goals.
          </p>
          
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium mb-3 text-muted-foreground">
                <div>Your Metric</div>
                <div>Business Impact</div>
                <div>Pro Tip</div>
              </div>
              <div className="divide-y divide-border">
                {valueTranslation.map((item) => (
                  <div key={item.metric} className="grid grid-cols-3 gap-4 py-4 text-sm">
                    <div className="font-medium">{item.metric}</div>
                    <div className="text-muted-foreground">{item.business}</div>
                    <div className="text-muted-foreground">{item.tip}</div>
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
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <Card className="bg-gradient-to-br from-foreground/5 to-foreground/10 border-foreground/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-foreground/10 rounded-xl">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">The Small Agency Advantage</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Social media democratizes advertising, giving nimble teams direct access to target audiences. 
                    Your agility, creator relationships, and platform expertise are competitive advantages over 
                    larger, slower agencies. Lean into what makes you different—authenticity, speed, and 
                    creator-native content that performs.
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

