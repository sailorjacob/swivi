"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  FileText,
  Mail,
  FileSignature,
  Receipt,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const emailTemplates = [
  {
    id: "performance-cpm-email",
    title: "Performance CPM Email",
    subjectLine: "[Brand/Show Name] + Creator Network: 25M Views @ $2 CPM (vs. $5–$15 market rate)",
    body: `Hi [Name],

I saw you're promoting [Specific Campaign/Show/Product].

We just delivered 25M organic views for [Netflix Show] through a network of 70 verified creators—at $1.15 CPM. Market rate for social video is $5–$15 CPM. 

Here's what we can do for you:

📊 PERFORMANCE CPM MODEL:
• You set a view target (e.g., "We want 20M views")
• We charge you $2 CPM ($40K for 20M views)
• We deliver authentic creator content (not polished brand ads)
• You only pay for views actually delivered

Why $2 CPM when market is $5–$15?
• We have a pre-vetted network (no casting delays)
• Creator authenticity drives 3–5x better engagement
• We operate lean (lower overhead than traditional agencies)

Real economics for 20M views:
• Client charge: $40K (at $2 CPM)
• Traditional agency: $100K–$150K (at $5–$7.5 CPM)
• You save $60K–$110K vs. market rate

Want to explore this for [Specific Upcoming Launch]?

Best,
[Your Name]`
  },
  {
    id: "delivery-engine-email",
    title: "Delivery Engine Email",
    subjectLine: "Owning Manhattan Season 3 + Beyond: Dedicated Social Activation Partner",
    body: `Hi [Name],

Season 2 worked. 20M views, 600 videos, 3.2% engagement (vs. brand average 0.5%).

For Season 3 (and 4), what if we didn't renegotiate every season? 

DELIVERY ENGINE MODEL:
• You commit: $300K for 6 months
• We commit: 100M+ views, dedicated team, end-to-end management
• Term: 6 months (renewable annually)

What you get:
✓ Turnkey social activation (we manage everything)
✓ Predictable monthly performance reporting
✓ Creator network scaled to 100+ as needed
✓ Whitelisting access for paid amplification
✓ A dedicated account manager (same person, every season)

What we get:
✓ Stable revenue ($50K/month)
✓ Predictable workload
✓ You as our "house of record" partner

This is how traditional agencies work with major brands. 
Let's apply that model to creator activation.

Worth a conversation?

Best,
[Your Name]`
  },
  {
    id: "flat-rate-email",
    title: "Flat Rate / Commercial Email",
    subjectLine: "Social Media Campaign: $50K for 25M Views (Real Estate Edition)",
    body: `Hi [Developer Name],

You've got a $5B revenue company. Your marketing budget can absorb a $50K campaign to drive awareness for [Project Name].

FLAT RATE MODEL:
• You pay: $50K
• We deliver: 25M+ organic views across social media
• Timeline: 6 weeks
• Deliverables: 500+ posts from 70 verified creators

Translation: A 30-second TV commercial costs $15K–$50K production, plus $100K+ in airtime. You reach maybe 2–5M people.

Our social campaign: $50K, 25M people reached, authentic creator voices.
Better ROI. Simpler.

The breakdown is straightforward:
• Creator payouts: $25K
• Strategy & management: $15K
• Licensing & optimization: $10K
• Total: $50K

No hourly billing. No hidden fees. Just: "Here's what a comprehensive social media campaign costs."

Interested in an activation for [Specific Property/Brand]?

Best,
[Your Name]`
  },
  {
    id: "retainer-email",
    title: "Monthly Retainer Email",
    subjectLine: "Your Content, Our Network: $3K/Month for 2–3M Monthly Views",
    body: `Hi [Creator/Brand Name],

You've got the content. You've got the vision. You need reach.

MONTHLY RETAINER MODEL:
• You pay: $3K/month
• We deliver: 2–3M monthly views, 50–100 posts
• Timeline: Ongoing (12-month commitment)
• Includes: Monthly strategy call, performance reporting, optimization

Why retainer instead of project-based?
✓ Predictable costs (you know Month 2 costs the same as Month 12)
✓ Dedicated team (same people every month, they get to know your brand)
✓ Better optimization (we learn what works, we double down)
✓ Lock in rates (no surprises mid-year)

The math:
• Monthly fee: $3,000
• Creator payout needed: ~$1,500 (to reach 1.5M–2M views at $1 CPM)
• Your profit: $1,500/month ($18K annually per creator)
• Cost to you: $36K annually for consistent, managed growth

This is what streaming platforms do with agencies. 
We think smaller creators deserve the same structure.

Let's talk?

Best,
[Your Name]`
  }
]

const sowTemplate = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATEMENT OF WORK (SOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This SOW is entered into pursuant to the Master Services Agreement 
(MSA) dated [DATE] between [YOUR AGENCY NAME] ("Service Provider") 
and [CLIENT NAME] ("Client").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PROJECT INFORMATION

Project Name: [CAMPAIGN/SHOW NAME] — Social Media Activation
Project ID: [e.g., NF-2025-001]
Client: [CLIENT NAME]
Client Contact: [NAME, TITLE, EMAIL, PHONE]
Service Provider Contact: [YOUR NAME, TITLE, EMAIL, PHONE]
Effective Date: [START DATE]
Project End Date: [END DATE]
Total Duration: [X weeks/months]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. SCOPE OF SERVICES

Service Provider shall provide the following services:

A) CREATOR NETWORK ACTIVATION
   Description: Leverage proprietary network of [70] pre-vetted creators 
   across TikTok, Instagram, Reels, YouTube Shorts, and emerging platforms
   
   Deliverables:
   • [500–600] organic video posts across creator accounts
   • Content posting across [X platforms]
   • Creator network vetting & selection based on [specific criteria]
   • Brand safety & audience authenticity verification

B) CONTENT STRATEGY
   Description: Develop and refine content strategy based on audience insights
   
   Deliverables:
   • Audience analysis & persona development
   • Hook/format development (3–5 proven formats)
   • Creator briefing document (talking points, CTAs, tone)
   • Real-time performance monitoring & optimization
   • Weekly strategy review calls

C) CREATOR MANAGEMENT
   Description: Full-service creator management including recruitment, 
   contracts, payments, and compliance
   
   Deliverables:
   • Creator recruitment & vetting
   • Contract negotiation & execution
   • Creator onboarding & training
   • Payment processing & reconciliation
   • FTC compliance management (disclosure requirements)
   • Performance monitoring & replacement (if underperforming)

D) REPORTING & ANALYTICS
   Description: Real-time tracking, measurement, and post-campaign analysis
   
   Deliverables:
   • Real-time dashboard access (daily updates)
   • Weekly performance summary emails
   • Post-campaign comprehensive analytics report
   • ROI analysis & market benchmarking
   • Recommendations for future campaigns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. DELIVERABLES & TIMELINE

Week 1: Strategy & Setup
  □ Finalize campaign brief & creative direction
  □ Select [70] creators (audience fit + performance tier)
  □ Creator onboarding & contract execution
  □ Content approval templates & workflows

Weeks 2–[X]: Execution & Optimization
  □ Posts go live on coordinated schedule
  □ Daily performance monitoring & optimization
  □ Real-time hook adjustments (scale winners, replace underperformers)
  □ Weekly performance summaries

Week [X]: Wrap-Up & Analysis
  □ Final posts go live
  □ Post-campaign analytics report
  □ ROI analysis & recommendations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. SUCCESS METRICS & KEY PERFORMANCE INDICATORS (KPIs)

Target Metrics (6-week campaign):
  • Views: [20M] minimum ([25M] target)
  • Engagement Rate: [3%] minimum ([3.5%+] target)
  • Reach: [50M+] accounts
  • Posts: [500–600] posts live
  • Brand Safety: [0] brand safety incidents

Performance Thresholds:
  Exceeds Expectations: >[25M] views AND >[4%] engagement
  Meets Expectations: [20M–25M] views AND [3–4%] engagement
  Below Expectations: <[20M] views OR <[3%] engagement

Underperformance Remedies:
  • If views <[20M]: Service Provider credits [25%] of total fee
  • If engagement <[3%]: Service Provider re-optimizes at no cost
  • If brand safety incident: Service Provider covers any remediation costs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. INVESTMENT & PAYMENT TERMS

Total Project Fee: $[50,000]

Payment Schedule:
  Payment 1 (Upfront): $[25,000] — Due upon SOW execution
  Payment 2 (Completion): $[25,000] — Due upon delivery & final reporting

Payment Method: [ACH / Wire Transfer / Check]
Account Details: [PROVIDE SEPARATELY]

Due Date: Net [30] days from invoice
Late Payment: [1.5%] monthly interest on overdue balances

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. OUT-OF-SCOPE ITEMS

The following items are NOT included in this SOW:

  ✗ Paid media / whitelisting (separate service: $[10K–25K])
  ✗ Usage rights licensing for brand reposting (separate: $[5K–10K])
  ✗ Original video production (separate service: $[5K–15K])
  ✗ Celebrity/A-list creator premiums (premium fees apply)
  ✗ International expansion (per-region premium)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. APPROVAL & SIGNATURES

This SOW is effective upon signature by both parties below.

SERVICE PROVIDER:

_________________________________
Signature

_________________________________
Name & Title

_________________________________
Date


CLIENT:

_________________________________
Signature

_________________________________
Name & Title

_________________________________
Date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

const msaTemplate = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MASTER SERVICES AGREEMENT (MSA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This Master Services Agreement ("Agreement") is entered into on [DATE] 
by and between [YOUR AGENCY NAME] ("Agency") and [CLIENT] ("Client").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SERVICES

Agency provides creator-driven social media activations per individual 
Statements of Work (SOWs). Each SOW will detail specific scope, 
deliverables, timeline, and fees.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. PAYMENT TERMS

• Payment: Net 30 from invoice date
• Invoices for fees, pass-through costs (creators), and rights
• Late Payment: 1.5% monthly interest on overdue balances

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. CONFIDENTIALITY (NDA)

Both parties agree to mutual protection of confidential information 
shared during the engagement. Neither party shall disclose the other's 
proprietary information without written consent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. INTELLECTUAL PROPERTY RIGHTS

• Client receives usage rights as specified per SOW
• Agency retains ownership of platform technology and methodologies
• Agency may charge additional fees for perpetual rights (100% markup)
• Content created by individual creators remains their property 
  with licensed usage to Client

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. TERMINATION

• Either party: 30 days written notice to terminate
• Disputes resolved via arbitration
• Upon termination, Client pays for all work completed to date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. LIABILITY

• Agency liability limited to fees paid under this Agreement
• Force Majeure clause applies for delays beyond reasonable control
• Agency indemnifies Client against copyright claims for content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. GENERAL PROVISIONS

• This Agreement supersedes all prior agreements
• Amendments require written consent from both parties
• Notices shall be sent to addresses provided below

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SIGNATURES

AGENCY:

_________________________________
Signature

_________________________________
Name & Title

_________________________________
Date


CLIENT:

_________________________________
Signature

_________________________________
Name & Title

_________________________________
Date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

const invoiceTemplate = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FROM:
[YOUR AGENCY NAME]
[Address]
[City, State, ZIP]
[Email]
[Phone]

BILL TO:
[CLIENT NAME]
[Client Address]
[Client City, State, ZIP]
[Client Contact Email]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice #: [INV-2025-001]
Invoice Date: [DATE]
Due Date: [NET 30 DATE]
Project: [PROJECT NAME]
SOW ID: [SOW-2025-001]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESCRIPTION OF SERVICES

Project: [SHOW NAME] Creator Network Activation
Service Period: [START DATE] – [END DATE]
Pricing Model: [Performance CPM / Flat Rate / Retainer]
Campaign Duration: [X weeks]

DELIVERABLES COMPLETED:
✓ Creator network activation (70+ creators)
✓ Content strategy & optimization
✓ 500–600 organic video posts
✓ Views delivered: [25M] (target: 20M)
✓ Engagement rate: [3.4%] (target: 3%+)
✓ Real-time dashboard & reporting
✓ Post-campaign analytics report

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INVOICE DETAILS

Item Description                          Quantity    Unit Price      Amount
────────────────────────────────────────────────────────────────────────────

Creator Network Activation                25M views   $2.00 CPM       $50,000
  (Performance CPM Model)

SUBTOTAL                                                              $50,000

Taxes (if applicable)                                                      $0

TOTAL DUE                                                             $50,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT BREAKDOWN

This is invoice #2 of 2 (per SOW payment schedule):

Invoice #1 (Upfront, paid [DATE]): $25,000 ✓
Invoice #2 (This invoice): $25,000 ← DUE NOW
────────────────────────────────
Total Project Value: $50,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT INSTRUCTIONS

Amount Due: $25,000
Due Date: [NET 30 DATE]
Payment Method: [ACH / Wire Transfer / Check]

ACH Payment:
Bank: [BANK NAME]
Account Holder: [YOUR AGENCY NAME]
Account #: [ACCOUNT #]
Routing #: [ROUTING #]
Reference: Invoice [INV-2025-001]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THANK YOU FOR YOUR BUSINESS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

const proposalTemplate = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROPOSAL FOR CREATIVE SERVICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TO: [CLIENT NAME]
FROM: [YOUR AGENCY NAME]
DATE: [DATE]
PROJECT: [SHOW/CAMPAIGN NAME] — Creator Network Activation
PROPOSAL DURATION: 30 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY

We propose to execute a comprehensive social media activation for 
[SHOW/CAMPAIGN] using our proprietary network of 70+ verified creators 
across TikTok, Instagram, YouTube, and emerging platforms.

PRICING MODEL: Performance CPM
You pay only for views delivered.

Target Performance:
• Views: 20,000,000 (minimum)
• Engagement Rate: 3%+ (average)
• Reach: 50M+ accounts
• Timeline: 6 weeks
• Cost: $2 CPM = $40,000 total

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROPOSAL DETAILS

1. SCOPE OF SERVICES

A) Creator Network Activation
   • 70 verified creators across all major platforms
   • Pre-vetted for audience authenticity and brand safety
   • Ready to activate within 48 hours

B) Content Strategy
   • Audience analysis & hook development (3–5 proven formats)
   • Creator briefing & content guidance
   • Real-time optimization based on performance
   • Daily metrics tracking

C) Creator Management
   • Contract negotiation and execution
   • Payout processing
   • Performance monitoring
   • Creator replacement (if underperforming)
   • FTC compliance management

D) Reporting & Transparency
   • Real-time dashboard (daily updates)
   • Weekly performance summaries
   • Post-campaign analytics report
   • ROI analysis vs. market benchmarks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. PRICING STRUCTURE

Payment Model: Performance CPM

Cost Per Mille (CPM) Pricing:
  Views Delivered × Cost Per 1,000 Views = Total Fee

  Target: 20,000,000 views
  Rate: $2 per 1,000 views
  Calculation: (20,000,000 ÷ 1,000) × $2 = $40,000

Why $2 CPM?
Market rate for social video: $5–$15 CPM
Our rate: $2 CPM (60–75% discount vs. market)

Value Delivered (at market rates):
  20M views × $5–$15 CPM = $100,000–$300,000 (market value)
  You're paying: $40,000
  Savings: $60,000–$260,000 vs. traditional agencies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. TIMELINE & DELIVERABLES

Week 1: Strategy & Setup
  • Finalize campaign brief & creative direction
  • Select 70 creators (audience fit + performance tier)
  • Creator onboarding & contract execution
  • Content approval process

Weeks 2–5: Execution & Optimization
  • Posts go live on coordinated schedule
  • Daily performance monitoring & optimization
  • Real-time hook adjustments
  • Weekly performance report

Week 6: Wrap-Up & Analysis
  • Final posts go live
  • Post-campaign analytics report
  • ROI analysis & recommendations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. PAYMENT TERMS

Investment: $40,000

Payment Schedule:
  • Upfront (50%): $20,000 (upon contract signature)
  • Upon Delivery (50%): $20,000 (upon campaign completion)

Payment Method: [ACH / Wire Transfer / Check]
Due Date: Net 30 from invoice

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. NEXT STEPS

If you'd like to move forward:

1. Sign the attached SOW (Statement of Work)
2. Sign the MSA (Master Services Agreement)
3. Send 50% upfront payment ($20,000)
4. We begin Week 1 activities

Questions?
[Your Name]
[Email]
[Phone]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

const templateSections = [
  {
    id: "emails",
    title: "Email Pitch Templates",
    icon: Mail,
    description: "Ready-to-send emails for each deal type"
  },
  {
    id: "proposal",
    title: "Proposal Template",
    icon: FileText,
    description: "Full proposal letter for client presentations"
  },
  {
    id: "sow",
    title: "Statement of Work (SOW)",
    icon: FileSignature,
    description: "Campaign-specific contract template"
  },
  {
    id: "msa",
    title: "Master Services Agreement (MSA)",
    icon: FileSignature,
    description: "Overarching relationship contract"
  },
  {
    id: "invoice",
    title: "Invoice Template",
    icon: Receipt,
    description: "Professional invoice format"
  }
]

export default function DealTemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">Deal Templates</h1>
          <p className="text-muted-foreground mt-1">
            Ready-to-use emails, proposals, SOWs, MSAs, and invoices
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Template Sections */}
        <div className="space-y-4">
          {templateSections.map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className={cn(
                "transition-all",
                expandedSection === section.id && "border-foreground/20"
              )}>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <section.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <CardDescription className="mt-1">{section.description}</CardDescription>
                      </div>
                    </div>
                    <div className="p-2">
                      {expandedSection === section.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedSection === section.id && (
                  <CardContent className="pt-0 border-t border-border">
                    <div className="pt-6">
                      {section.id === "emails" && (
                        <div className="space-y-4">
                          {emailTemplates.map((email) => (
                            <div key={email.id} className="border border-border rounded-lg">
                              <div 
                                className="p-4 cursor-pointer flex items-center justify-between"
                                onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
                              >
                                <div>
                                  <p className="font-medium text-sm">{email.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1 font-mono">{email.subjectLine}</p>
                                </div>
                                {expandedEmail === email.id ? (
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              {expandedEmail === email.id && (
                                <div className="border-t border-border p-4 bg-muted/30">
                                  <div className="flex justify-end mb-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(email.body, email.id)}
                                      className="gap-2"
                                    >
                                      {copiedId === email.id ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          Copy
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground overflow-x-auto">
                                    {email.body}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {section.id === "proposal" && (
                        <div>
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(proposalTemplate, "proposal")}
                              className="gap-2"
                            >
                              {copiedId === "proposal" ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy Template
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                              {proposalTemplate}
                            </pre>
                          </div>
                        </div>
                      )}

                      {section.id === "sow" && (
                        <div>
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(sowTemplate, "sow")}
                              className="gap-2"
                            >
                              {copiedId === "sow" ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy Template
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                              {sowTemplate}
                            </pre>
                          </div>
                        </div>
                      )}

                      {section.id === "msa" && (
                        <div>
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(msaTemplate, "msa")}
                              className="gap-2"
                            >
                              {copiedId === "msa" ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy Template
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            <strong>Note:</strong> This is a framework template. Have a lawyer review and customize for your specific needs.
                          </p>
                          <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                              {msaTemplate}
                            </pre>
                          </div>
                        </div>
                      )}

                      {section.id === "invoice" && (
                        <div>
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(invoiceTemplate, "invoice")}
                              className="gap-2"
                            >
                              {copiedId === "invoice" ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy Template
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                              {invoiceTemplate}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Usage Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="border-foreground/10 bg-foreground/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Using These Templates</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Replace all [BRACKETED TEXT] with your specific information</li>
                <li>• Customize the SOW and MSA with a lawyer for your jurisdiction</li>
                <li>• Save customized versions for each client type</li>
                <li>• Update pricing and metrics based on current market rates</li>
                <li>• Add your branding (logo, colors) to final documents</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
