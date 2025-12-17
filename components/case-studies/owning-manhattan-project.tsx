"use client"

import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, Play, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LightningHover } from "@/components/effects/lightning-hover"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
}

const whyItWorked = [
  {
    title: "Coordinated Distribution",
    description: "Hundreds of creators posting simultaneously created sustained algorithm momentum across platforms.",
  },
  {
    title: "Performance-Based Incentives",
    description: "Creators were paid based on real views, aligning incentives with results.",
  },
  {
    title: "Platform-Native Content",
    description: "Short-form formats matched native consumption behavior, increasing watch time and share velocity.",
  },
  {
    title: "Timing Discipline",
    description: "The campaign was tightly aligned with the release window, maximizing impact when attention mattered most.",
  },
]

const useThisModelIf = [
  "Tens of millions of views quickly",
  "Cost efficiency compared to paid ads",
  "Organic reach without managing creators",
  "Distribution aligned to a launch moment",
]

const campaignStructure = [
  { label: "Duration", value: "< 7 days" },
  { label: "Platforms", value: "TikTok, Instagram Reels, YouTube Shorts" },
  { label: "Creators Activated", value: "100+" },
  { label: "Posting Velocity", value: "Hundreds of posts per day" },
  { label: "Budget Model", value: "Performance-based" },
]

const swiviHandled = [
  "Creator sourcing and coordination",
  "Content guidelines and duplication control",
  "Approval workflows",
  "Performance tracking and budget allocation",
]

const results = [
  { value: "25M+", label: "organic views" },
  { value: "Sub-$1", label: "effective CPM" },
  { value: "< 7 days", label: "to saturation" },
  { value: "100+", label: "creators activated" },
]

export default function OwningManhattanProject() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-width-wrapper section-padding"
        >
          {/* Back Link */}
          <motion.div variants={itemVariants} className="mb-8">
            <Link 
              href="/case-studies" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Case Studies
            </Link>
          </motion.div>

          {/* Hero */}
          <motion.div variants={itemVariants} className="mb-16">
            <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
              Netflix Original Series
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light mb-6">
              Owning Manhattan
            </h1>
          </motion.div>

          {/* Overview */}
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl font-light mb-8 pb-4 border-b border-black/10">Overview</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-black/5">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-normal">Ryan Serhant / Owning Manhattan</span>
                </div>
                <div className="flex justify-between py-2 border-b border-black/5">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-normal">Netflix</span>
                </div>
                <div className="flex justify-between py-2 border-b border-black/5">
                  <span className="text-muted-foreground">Campaign Type</span>
                  <span className="font-normal">Organic Launch Amplification</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-black/5">
                  <span className="text-muted-foreground">Objective</span>
                  <span className="font-normal text-right">Drive large-scale organic reach during Season 2 release</span>
                </div>
                <div className="flex justify-between py-2 border-b border-black/5">
                  <span className="text-muted-foreground">Partner</span>
                  <span className="font-normal">Swivi Media</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* The Challenge */}
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl font-light mb-8 pb-4 border-b border-black/10">The Challenge</h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Streaming releases compete for attention in a saturated media environment.
            </p>
            <div className="space-y-3 mb-8">
              <p className="text-base">Paid ads are expensive.</p>
              <p className="text-base">Influencer campaigns are fragmented.</p>
              <p className="text-base">Organic reach is unpredictable at scale.</p>
            </div>
            <p className="text-lg leading-relaxed">
              The goal for Owning Manhattan Season 2 was to generate immediate, high-velocity organic visibility across short-form platforms during the launch window — <span className="font-normal">without relying on traditional paid media.</span>
            </p>
          </motion.section>

          {/* The Strategy */}
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl font-light mb-8 pb-4 border-b border-black/10">The Strategy</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Swivi deployed a creator-powered distribution campaign designed to compress weeks of organic reach into days.
            </p>
            <p className="text-base mb-6">
              Instead of individual influencer placements, the campaign leveraged coordinated creator distribution at scale, optimized for:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {["Volume", "Timing", "Platform-native formats", "Performance-based incentives"].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-4 bg-foreground/[0.02] rounded-lg border border-black/5"
                >
                  <span className="text-sm font-normal">{item}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-base text-muted-foreground">
              The strategy focused on saturation during the release window to maximize algorithmic lift and cultural visibility.
            </p>
          </motion.section>

          {/* Campaign Structure */}
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl font-light mb-8 pb-4 border-b border-black/10">Campaign Structure</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <div className="space-y-4">
                  {campaignStructure.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-black/5">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-normal">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-normal mb-4">Swivi handled:</h3>
                <div className="space-y-3">
                  {swiviHandled.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-base mt-6 text-muted-foreground">
                  The client remained hands-off.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Results */}
          <motion.section variants={itemVariants} className="mb-16 py-12 px-8 bg-foreground/[0.95] text-background rounded-2xl">
            <h2 className="text-2xl font-light mb-10 text-center text-background">Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-light mb-2 text-background">{result.value}</div>
                  <div className="text-sm text-background/70">{result.label}</div>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-background/90 max-w-2xl mx-auto">
              The campaign delivered reach comparable to large paid media buys — at a fraction of the cost and timeline.
            </p>
          </motion.section>

          {/* Why It Worked */}
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl font-light mb-10 pb-4 border-b border-black/10">Why It Worked</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {whyItWorked.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 bg-foreground/[0.02] rounded-xl border border-black/5"
                >
                  <h3 className="text-lg font-normal mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* The Takeaway */}
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl font-light mb-8 pb-4 border-b border-black/10">The Takeaway</h2>
            <p className="text-lg mb-8 leading-relaxed">
              This campaign demonstrates how creator-powered organic distribution can operate as a true media channel — delivering <span className="font-normal">predictable reach, cost efficiency, and speed at scale.</span>
            </p>
            <p className="text-base text-muted-foreground mb-4">The model is repeatable across:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Streaming releases", "Product launches", "Brand announcements", "Founder visibility campaigns"].map((item, index) => (
                <div key={index} className="text-sm font-normal">
                  {item}
                </div>
              ))}
            </div>
          </motion.section>

          {/* Use This Model */}
          <motion.section variants={itemVariants} className="mb-16 p-8 bg-foreground/[0.02] rounded-2xl border border-black/5">
            <h2 className="text-xl font-normal mb-6">Use This Model If You Need:</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {useThisModelIf.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-foreground" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section
            variants={itemVariants}
            className="text-center py-16 mb-16"
          >
            <p className="text-lg text-muted-foreground mb-2">Planning a launch or release?</p>
            <p className="text-xl font-normal mb-8">Deploy creator-powered distribution when timing matters most.</p>
            <LightningHover>
              <Button size="lg" className="font-normal bg-foreground text-background hover:bg-foreground/90">
                <Link href="https://calendly.com/bykevingeorge/30min?month=2025-05" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  Launch a Campaign
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </LightningHover>
          </motion.section>

          {/* Example Content Link */}
          <motion.section variants={itemVariants} className="mb-16">
            <div className="flex items-center justify-center gap-4">
              <Link
                href="https://www.instagram.com/reel/DOKGK_ciO-9/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Play className="w-4 h-4" />
                View Example Campaign Content
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </motion.section>

        </motion.div>
      </main>
      <Footer />
    </>
  )
}
