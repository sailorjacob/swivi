"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const articles = [
  {
    id: "agency-models",
    title: "Agency Models & Contract Structures",
    description: "How agencies work with big brands, retainer vs project deals, and essential paperwork",
    readTime: "8 min read",
    content: `## How Agencies Work with Big Brands

Agencies generally work with big brands under either **retainer** or **project-based** agreements. Retainers are fixed monthly/quarterly fees for ongoing services, providing predictable revenue and deeper strategic partnership. Project deals are one-off campaigns with fixed deliverables.

Often agencies also charge a **media-management fee** on top of any ad/creator spend (e.g. 12–15% of the budget).

---

## Common Compensation Models

### Retainer
A flat $X/month for a "bucket" of hours or services. This is like a subscription: the client pays monthly for ongoing access to the agency's expertise (planning, campaign execution, analytics). Retainers give agencies stable income and let teams build long-term knowledge of the brand.

### Project-Based
A one-time fee for a specific campaign or event. Good for defined-scope work (e.g. "500 TikTok posts for a product launch"). The deliverables, timeline and price are set upfront in a Statement of Work.

### Commission/Media Fee
A percentage of media or influencer spend. For example, if brands pay $100K to creators or ad platforms, the agency takes a **10–30% commission** to cover strategy, coordination, and reporting. Larger budgets often negotiate lower percentages.

### Performance-Based
Fees tied to KPIs (e.g. bonuses for hitting view or sales targets). Less common in influencer work but can be negotiated.

---

## Contracts & Paperwork

Large brands expect formal agreements. Typically you'll sign:

**Master Services Agreement (MSA)** — Governs the overall relationship (payment terms, liability, IP ownership, termination, etc.)

**Statements of Work (SOWs)** — Individual documents for each campaign detailing scope, timeline, deliverables, and budget

The MSA is signed once and refers to all SOWs; each SOW details the specifics for a particular project.

Big clients may also require:
- NDA
- Vendor onboarding forms
- Specific insurance or security provisions

**Getting on a brand's official vendor or "Approved Supplier" list can be critical for winning work.**

---

## Getting Large Budgets & Partnerships

Big brands have multi-million-dollar marketing budgets, but they allocate funds carefully. To win large deals:

### Demonstrate ROI
Use hard metrics from past work. For instance, if you generated 20M views for $23K (about $1.15 CPM), by industry benchmarks (TikTok ad CPMs averaged $2–$4), that reach is worth roughly $80–$90K in media value. Present it that way—the client got ~4–5× the value of what they paid.

### Package Your Fees
Break down your proposal into media spend plus fees:
- **Media Budget:** $50K (pass-through to 70 creators)
- **Agency Fee:** 20–30% of media ($10–15K) for management
- **Creative/Strategy Fee:** $X
- **Content Usage Fee:** $Y (6mo license)
- **Spark Ads/Boosting Fee:** $Z

This shows professionalism and lets clients see your agency's profit separately from creator payouts.

### Use Agency Terminology
Speak their language:
- Call creator payments "media budget (pass-through)"
- Call your markup "management or agency fee"
- Use terms like CPM/CPE, KPIs, AOR (Agency-of-Record), whitelisting/Spark Ads, lift, and flighting

**Example:** "We recommend a 4-week flight delivering X posts/week to hit Y impressions."

### Vendor Lists & RFPs
Research if target brands have "Vendor of Record" lists or RFP portals. Being on the list means you're eligible for projects without extra approvals.

---

## Team Structure & Key Roles

As you scale beyond solo founder and developers, build a small team covering these functions:

**Account/Client Manager** — Main liaison for each brand. Keeps communication flowing, ensures deliverables meet client needs, handles reporting, looks for upsell opportunities.

**Campaign Manager** — Coordinates day-to-day execution. Manages the creator roster, content schedules, quality control and troubleshooting.

**Strategist/Planner** — Aligns campaigns to business goals. Defines objectives, target audience, key messages, and KPIs.

**Creative/Content Lead** — Crafts the creative direction. Ensures content and captions match the brand's voice.

**Creator/Community Manager** — Manages your network of influencers. Onboards new creators, negotiates deliverables, tracks payments.

**Analytics/Data Specialist** — Tracks performance metrics and ROI. Builds reporting dashboards.

Initially, the founder might handle multiple hats. But to win and manage large accounts, prioritize hiring an account manager or sales lead, plus a project manager for logistics.`
  },
  {
    id: "scaling-guide",
    title: "Executive Summary: Scaling from Vendor to Strategic Partner",
    description: "The value gap, 2025 market rates, and the path to $100k+ campaigns",
    readTime: "10 min read",
    content: `## The Critical Value Gap

Your current model is delivering massive value—**20 million views for $23,000** equates to a CPM of about $1.15, while 2025 industry averages for TikTok and Instagram Reels range from **$4–$10 per thousand impressions**.

At market rates, that's **$80,000–$200,000 in equivalent value**, meaning you're leaving $57,000–$177,000 on the table per similar campaign.

---

## The Opportunity

By shifting to a value-based agency structure inspired by traditional models, you can target:
- **$100k+ fees per activation**
- **Retainers for ongoing work**
- **Long-term partnerships** that mimic full-time employee-level stability

**Key Strategy:** Leverage past work as proof-of-concept to pitch bigger brands. Position your creator network as a "surround-sound activation engine" for social blasts, charging separately for strategy, management, and rights.

**Realistic Goal:** Secure 3–5 retainers at $5,000–$15,000/month in Year 1, scaling to $500k+ annual revenue by bundling with performance bonuses.

---

## The Gap Explained

You're operating as a **cost-plus vendor** (pass-through payouts + slim markup). Traditional agencies use **hybrid models** (retainers + project fees) to capture 20–30% margins on total budgets.

With a large client, you could expand to multi-campaign deals worth $200k–$500k annually.

---

## How Agencies Collaborate in 2025

Agencies collaborate with brands like Netflix, Red Bull, or NBA through a mix of retainer and project-based models, focusing on **measurable ROI** amid shrinking budgets (down 5–10% due to economic uncertainty).

### Retainers (35–50% of agency revenue)
Agencies use them for ongoing services, charging $2,000–$20,000/month for strategy, content oversight, and activations. Retainers often start small ($3,000–$5,000) and scale with proven results.

### Securing Big Budgets
Agencies win large spends (7–12% of brand revenue allocated to marketing) by proving ROI. In uncertain times, brands favor **"innovation budgets"** (10–20% of total spend) for experimental tactics like creator activations.

**Pitch to roles like:**
- Brand Activation Manager
- Social Lead
- Culture Marketing Manager

---

## Budget Calculation Methods

### Short-Term (Project-Based)
\`Goal / Conversion Rate = Needed Reach\`

Then allocate (e.g., 40% digital, 30% content).

### Long-Term (Retainers)
\`Base Fee + Performance Bonus\`

Example: $10k/month + $ per 1M views

Agencies add **15–30% fees** on top of costs like creator payouts.

---

## Key Terminology

| Category | Terms | Why It Matters |
|----------|-------|----------------|
| Pricing & Metrics | CPM, CPE, ROI | Justify higher fees ("Our $1.15 CPM beats industry $6 avg") |
| Contracts | MSA, SOW, NDA | Build trust for long-term deals |
| Operations | Flighting, Scope Creep | Avoid over-delivery without pay |
| Rights & Ads | Whitelisting, Perpetuity | Monetize beyond posts (e.g., licensing fees) |

---

## Agency Pricing Models (2025)

| Model | Description | Typical Fees | Application |
|-------|-------------|--------------|-------------|
| Retainer | Fixed ongoing fee | $2k–$20k/month | Monthly creator blasts ($10k/month) |
| Project-Based | One-off campaign | $10k–$100k+ | $100k for major activation |
| Hybrid | Retainer + variable | $5k base + 20% commission | Stability + upside from big views |
| Performance-Based | Tied to KPIs | $10k base + $ per 1M views | Bonus for exceeding targets |

---

## Revenue Streams

| Stream | Examples | Implementation |
|--------|----------|----------------|
| Management Fees | 20–30% on media spend | $15k on $50k creator budget |
| Strategy/Consulting | Flat for briefs/hooks | $10k per campaign |
| Rights & Whitelisting | Licensing/boosting | $15k for 6-month usage |
| Retainers | Ongoing access | $5k/month for network optimization |`
  },
  {
    id: "comprehensive-guide",
    title: "Comprehensive Guide: $23K to $100K+ Deals",
    description: "Complete breakdown of the agency model, pricing structure, and deal terminology",
    readTime: "15 min read",
    content: `## The Critical Insight: Your Value Gap

You're currently leaving **$40,000–$577,000 on the table per campaign** because you're pricing as a vendor (cost-plus markup) rather than a strategic agency (value-based pricing on outcomes).

### Your Delivery vs. Your Compensation

| Metric | Value |
|--------|-------|
| Views Delivered | 20 million |
| Videos Delivered | 400–600 |
| You Charged | $23,000 |
| Your CPM | $1.15 |
| Industry Standard CPM | $3.21–$30 |
| Content Worth at Market | $64,000–$600,000 |

This massive gap exists because the client wasn't just paying for videos—they were paying for **strategy, reach, authenticity, creator management, and brand safety**. You've been capturing only 4–7% of the actual value delivered.

---

## Part 1: The Three Legal Documents Every Agency Needs

### 1. Master Services Agreement (MSA)

An MSA is a single contract signed once with a client that governs the entire relationship for **12–36 months**.

**What it covers:**
- General types of services you'll provide
- Payment terms (Net 30, Net 60, etc.)
- Intellectual property ownership
- Confidentiality and NDA requirements
- Liability protection and indemnification
- Termination notice periods (30–90 days)

**Why you need it:** Once an MSA is signed, subsequent campaigns don't require separate legal review. You simply send SOWs and they're automatically approved under the umbrella terms.

### 2. Statement of Work (SOW)

A SOW details the specific deliverables, timeline, and budget for an individual campaign under the MSA.

**What it covers:**
- Exact deliverables (e.g., "500–600 videos from 70 creators over 6 weeks")
- Payment schedule (e.g., 50% upfront, 50% upon delivery)
- Specific success metrics (views, engagement rate, reach targets)
- Creator compensation structure
- Usage rights terms (organic vs. paid, 6-month vs. perpetual)
- Exclusivity clauses (if any)
- Change order procedures for scope expansion

### 3. NDA (Non-Disclosure Agreement)

Most big clients have their own NDAs. Negotiate a carve-out that lets you publish anonymized case studies and aggregate metrics.

**Essential language to add:**

*"Service Provider retains the right to publish campaign results (aggregate views, CPM, engagement rates) without revealing Client's identity, for portfolio and case study purposes."*

---

## Part 2: The New Pricing Model

### Vendor Model (Current Approach)

| Line Item | Amount |
|-----------|--------|
| Creator Payouts | $20K |
| Your Markup | ~$3K (15%) |
| **Total Fee** | **$23K** |
| **Your Profit** | **$3K (13% margin)** |

### Agency Model (Recommended)

| Line Item | Amount | Your Profit |
|-----------|--------|-------------|
| Creator Payouts | $50K | $0 (pass-through) |
| Agency Management Fee | $12.5K | $12.5K |
| Content Strategy | $8K | $8K |
| Usage Rights Licensing | $6K | $6K |
| Whitelisting/Spark Ads | $20K | $20K |
| **Total Fee** | **$96.5K** | **$46.5K (48% margin)** |

The difference isn't in charging more—it's in **unbundling the value** you're already delivering but giving away for free.

---

## Line Item Breakdown

### Line Item 1: Creator Media Budget ($0 Profit)

This is the direct payment to creators. **You take zero markup here.**

**Why include it?** It anchors the deal size and demonstrates scale.

**Positioning:** *"To secure 70 verified creators with authentic audiences and consistent performance, we require a $50,000 creator media budget. This is a pass-through cost; 100% goes to creators."*

### Line Item 2: Agency Service Fee ($12.5K Profit)

**Standard rate:** 20–30% of the media budget

**What you're charging for:**
- Finding 70 creators in 48 hours
- Writing the campaign brief
- Managing creator onboarding
- Daily quality control
- Handling creator issues
- FTC disclosure compliance
- Metrics tracking and reporting
- Payment processing

**Positioning:** *"We don't just post videos. We handle the entire operational nightmare: finding creators, vetting them, managing contracts, ensuring FTC compliance, tracking payments, replacing underperformers, and reporting daily."*

### Line Item 3: Content Strategy ($8K Profit)

**What you're charging for:**
- Audience analysis
- Hook development (3–5 proven content formats)
- Content brief creation
- Iteration and optimization
- Cross-platform strategy
- Real-time optimization

### Line Item 4: Usage Rights Licensing ($6K Profit)

When the brand reposts a creator's video on their own channels, that creator (and you) should be compensated.

**Standard rate:** 20–30% of the creator's base rate per month of usage

**Positioning:** *"When your content gets reposted to massive brand channels, creators are entitled to additional compensation. We manage licensing agreements, track usage windows, ensure compliance, and handle renewals."*

### Line Item 5: Whitelisting / Spark Ads ($20K Profit)

**What it is:** The brand controls an ad that runs from a creator's account, not from the brand's account.

**Why it matters:** Ads from creator accounts perform **3–5x better** than brand ads because viewers trust the creator's voice.

| Structure | Fee | Terms |
|-----------|-----|-------|
| Bundle Whitelisting | $10K–$25K | 50 creator accounts, 30 days |
| Per-Post Whitelisting | $500–$2.5K | Per creator post boosted |
| % of Ad Spend | 15–20% | On total ad budget |

**Positioning:** *"Creator-account ads perform 3–5x better than brand ads. Viewers trust creators more than brands. We'll set up whitelisting for your top 50 posts, giving you access to run unlimited paid media from creator accounts."*

---

## Part 3: Essential Agency Terminology

### Deal Structure Terms

| Term | What It Means | How You Use It |
|------|---------------|----------------|
| AOR | Agency of Record | "We want to be your AOR for creator-led social activations" |
| MSA | Master Services Agreement | "Let's sign an 18-month MSA so we can move fast on each campaign" |
| SOW | Statement of Work | "Here's the SOW for Season 3: 600 videos, $96.5K, 6 weeks" |
| RFP | Request for Proposal | When brands ask for bids |
| Pass-Through | Costs paid directly to creators | "Creator payouts are pass-through; our margin is in management" |
| Scope Creep | Unplanned additions | "Additional 200 videos? That's out of scope" |
| Change Order | Formal request to expand scope | "Additional deliverables require a change order" |

### Performance & Pricing Terms

| Term | What It Means | How You Use It |
|------|---------------|----------------|
| CPM | Cost Per Mille (per 1,000 impressions) | "We deliver $1.15 CPM; market standard is $5–$15" |
| CPE | Cost Per Engagement | "Our CPE is $0.02; industry standard is $0.15" |
| Flighting | Campaign timeline/schedule | "We recommend 4-week flighting" |
| Perpetuity | Owning rights forever | "Perpetual rights cost 3x the base rate" |
| Whitelisting | Ads run from creator's account | "Whitelisting performs 3–5x better than brand ads" |

### Legal & Payment Terms

| Term | What It Means | How You Use It |
|------|---------------|----------------|
| Net 30/60 | Payment due in 30–60 days | "Our terms are Net 30" |
| Force Majeure | Unforeseen events excusing performance | "If TikTok shuts down, we're legally excused" |
| Indemnification | Protection against liability | "We indemnify you against copyright claims" |
| Performance Bonus | Extra fees for hitting KPIs | "Hit 20M views? Additional $5,000" |
| Retainer | Fixed monthly fee | "Let's move to $18K/month retainer" |
| Exclusivity | Only working with you | "60-day exclusivity on competing campaigns" |`
  }
]

export default function KnowledgePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  
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

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering
    return content
      .split('\n\n')
      .map((block, i) => {
        // Headers
        if (block.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-semibold mt-8 mb-4">{block.replace('## ', '')}</h2>
        }
        if (block.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-semibold mt-6 mb-3">{block.replace('### ', '')}</h3>
        }
        
        // Horizontal rule
        if (block.trim() === '---') {
          return <hr key={i} className="my-6 border-border" />
        }
        
        // Tables
        if (block.includes('|') && block.includes('---')) {
          const lines = block.split('\n').filter(l => l.trim())
          const headers = lines[0].split('|').filter(c => c.trim()).map(c => c.trim())
          const rows = lines.slice(2).map(line => 
            line.split('|').filter(c => c.trim()).map(c => c.trim())
          )
          return (
            <div key={i} className="overflow-x-auto my-4">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    {headers.map((h, j) => (
                      <th key={j} className="text-left p-3 font-medium border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, j) => (
                    <tr key={j} className="border-b border-border/50 last:border-0">
                      {row.map((cell, k) => (
                        <td key={k} className="p-3 text-muted-foreground">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        
        // Lists
        if (block.match(/^[-*] /m)) {
          const items = block.split('\n').filter(l => l.trim())
          return (
            <ul key={i} className="list-none space-y-2 my-4">
              {items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-foreground mt-2 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ 
                    __html: item.replace(/^[-*] /, '')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                  }} />
                </li>
              ))}
            </ul>
          )
        }
        
        // Paragraphs with bold text
        return (
          <p 
            key={i} 
            className="text-sm text-muted-foreground leading-relaxed my-3"
            dangerouslySetInnerHTML={{ 
              __html: block
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-xs font-mono">$1</code>')
            }}
          />
        )
      })
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
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            In-depth guides on agency operations, pricing, and partnerships
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-4">
          {articles.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className={cn(
                "transition-all",
                expandedArticle === article.id && "border-foreground/20"
              )}>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{article.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">{article.readTime}</p>
                      </div>
                    </div>
                    <div className="p-2">
                      {expandedArticle === article.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {expandedArticle === article.id && (
                  <CardContent className="pt-0 border-t border-border">
                    <div className="pt-6">
                      {renderMarkdown(article.content)}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

