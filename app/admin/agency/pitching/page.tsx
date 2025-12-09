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
  Users,
  Lightbulb,
  FileText,
  CheckCircle,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const whoToPitch = {
  media: {
    category: "Netflix / Media Companies",
    titles: [
      "Director of Title Marketing",
      "Publicity Manager",
      "Social Activation Lead",
      "VP of Marketing (for bigger asks)"
    ]
  },
  consumer: {
    category: "Red Bull / Consumer Goods",
    titles: [
      "Field Marketing Manager",
      "Brand Activation Manager",
      "Culture Marketing Manager",
      "Director of Digital Marketing"
    ]
  },
  note: "Don't email the CEO. Email the people whose job depends on \"Activations\" and \"Buzz.\""
}

const innovationBudgetPitch = {
  context: "Big brands use the 70-20-10 rule: 70% on proven standard ads, 20% on innovation, 10% on experimental.",
  yourFit: "You fit perfectly into the 10-20% Innovation Budget. Position yourself there.",
  pitch: "\"I know your core budget is allocated, but we fit perfectly into your Innovation Budget. We can flood the feed with 500+ authentic user videos for the price of one produced commercial.\""
}

const caseStudyStructure = [
  {
    section: "The Hook / Headline",
    description: "Lead with the impressive number",
    example: "\"How we generated 20M organic views for Owning Manhattan at $1.15 CPM\""
  },
  {
    section: "The Problem",
    description: "What the brand was trying to achieve",
    example: "Netflix needed authentic buzz for their new luxury real estate series, beyond traditional ads."
  },
  {
    section: "The Solution",
    description: "What you proposed and executed",
    example: "We activated 70 creators across TikTok and Instagram to create authentic reaction content over a 4-week flight."
  },
  {
    section: "The Results",
    description: "Hard numbers with context",
    example: "20M+ organic views, 500K+ engagements, $1.15 CPM (vs. industry standard $4.60+)"
  },
  {
    section: "The Capability Statement",
    description: "Why you can do it again",
    example: "\"We have a network of 70+ creators ready to activate in 48 hours. We don't just post; we create a 'surround sound' effect.\""
  }
]

const pitchStructure = [
  {
    step: "1",
    title: "Don't Quote a Flat Price",
    description: "Ask for their \"Media Budget\" first. This anchors the conversation around value, not your costs.",
    example: "\"What media budget are you working with for this activation?\""
  },
  {
    step: "2",
    title: "Separate Your Fees",
    description: "Show them \"Media Budget\" vs. \"Agency Management Fees\" vs. \"Usage Rights.\" Transparency builds trust.",
    example: "\"Our proposal breaks down into three components: creator payments, our management fee, and optional usage rights.\""
  },
  {
    step: "3",
    title: "Upsell Rights",
    description: "If they love the videos, that's your opening for additional revenue.",
    example: "\"For an extra $10k, we can whitelist the top 20 posts so you can put ad spend behind them.\""
  }
]

const objectionHandlers = [
  {
    objection: "\"That's more than we budgeted\"",
    response: "\"I understand. Let me show you the CPM breakdown—at $1.50 CPM, this is actually 3x more efficient than traditional media buying. What budget range would work for your team?\""
  },
  {
    objection: "\"We can do this in-house\"",
    response: "\"Absolutely you could. The question is whether managing 70 creator relationships, approvals, payouts, and QC is the best use of your team's time. We handle the headache so you can focus on strategy.\""
  },
  {
    objection: "\"We need to see results first\"",
    response: "\"Let's start with a pilot—10 creators, 2-week flight. You'll see the quality and velocity before committing to a full campaign.\""
  },
  {
    objection: "\"Why should we pay for usage rights?\"",
    response: "\"The content performs 3-5x better than brand content on paid. You're paying for the ability to amplify proven winners, not just the content itself.\""
  }
]

const proofPoints = [
  {
    metric: "20M+ Views",
    context: "Owning Manhattan Campaign",
    translation: "At market CPM ($4.60), that's $92,000 in media value"
  },
  {
    metric: "$1.15 CPM",
    context: "Your delivery cost",
    translation: "75% below industry standard—massive value for clients"
  },
  {
    metric: "70+ Creators",
    context: "Current network (scaling to 1,000+)",
    translation: "48-hour activation capability"
  },
  {
    metric: "500K+ Engagements",
    context: "Quality attention, not just views",
    translation: "$0.02 CPE vs. $0.15 industry standard"
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
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <Link href="/admin/agency" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Agency
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Landing Big Clients</h1>
          <p className="text-muted-foreground mt-1">
            Strategy for pitching enterprise brands
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Who to Pitch */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Who to Pitch</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">{whoToPitch.note}</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{whoToPitch.media.category}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {whoToPitch.media.titles.map((title) => (
                    <li key={title} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      {title}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{whoToPitch.consumer.category}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {whoToPitch.consumer.titles.map((title) => (
                    <li key={title} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      {title}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* The Innovation Budget Pitch */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">The Innovation Budget Pitch</h2>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">{innovationBudgetPitch.context}</p>
              <p className="text-sm mb-4"><span className="font-medium">Your fit:</span> {innovationBudgetPitch.yourFit}</p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">The Pitch</p>
                <p className="text-sm font-medium italic">{innovationBudgetPitch.pitch}</p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* Your Proof Points */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Your Proof Points</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Lead with these numbers. They translate directly to value.</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {proofPoints.map((point) => (
              <Card key={point.metric}>
                <CardContent className="pt-6">
                  <p className="text-2xl font-semibold mb-1">{point.metric}</p>
                  <p className="text-sm text-muted-foreground mb-2">{point.context}</p>
                  <p className="text-sm">{point.translation}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <Separator className="my-8" />

        {/* Case Study Structure */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Case Study Structure</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Don't just say "we did this." Send a case study PDF with this structure:
          </p>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {caseStudyStructure.map((item, i) => (
                  <div key={item.section} className={i !== caseStudyStructure.length - 1 ? "pb-6 border-b border-border/50" : ""}>
                    <h3 className="font-medium mb-1">{item.section}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm italic">"{item.example}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* The Pitch Flow */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">The Pitch Flow</h2>
          <p className="text-sm text-muted-foreground mb-6">
            For your next deal, follow this sequence:
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
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <div className="p-2 bg-muted rounded text-sm font-mono">
                        {item.example}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator className="my-8" />

        {/* Objection Handling */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold mb-2">Handling Objections</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Common pushback and how to respond:
          </p>
          
          <div className="space-y-3">
            {objectionHandlers.map((item) => (
              <Card key={item.objection}>
                <CardContent className="py-4">
                  <p className="text-sm font-medium mb-2">{item.objection}</p>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{item.response}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="border-foreground/10 bg-foreground/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">The Small Agency Advantage</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Social media democratizes advertising. Your agility, creator relationships, and platform expertise are competitive 
                advantages over larger, slower agencies. You can activate 70 creators in 48 hours—try getting that from a holding company.
                Lean into what makes you different: <span className="text-foreground">authenticity, speed, and creator-native content that performs.</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
