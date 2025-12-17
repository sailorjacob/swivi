"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { motion } from "framer-motion"
import { Check, Users, BarChart3, Clock, Target, ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LightningHover } from "@/components/effects/lightning-hover"

const brandUseCases = [
  "Product launches",
  "Streaming and media releases",
  "Brand announcements",
  "Founder visibility pushes",
  "Entertainment and culture-driven drops",
]

const whatBrandsGet = [
  "Coordinated multi-platform distribution",
  "Performance-based creator payouts",
  "Sub-market cost efficiency",
  "Transparent reporting and budget control",
  "Zero creator management overhead",
]

const cpmData = [
  { medium: "Television", cpm: "~$25", note: "Higher during premium events and high-demand programming" },
  { medium: "Radio", cpm: "$4+", note: "Varies by market size and audience targeting" },
  { medium: "Newspapers", cpm: "$20–$30", note: "Based on circulation and placement" },
  { medium: "Magazines", cpm: "$20–$30", note: "Dependent on publication and audience specificity" },
  { medium: "Outdoor / Billboards", cpm: "$10–$30+", note: "Pricing driven by location and traffic volume" },
]

const whyChooseSwivi = [
  {
    icon: Users,
    title: "Distribution at Scale",
    description: "Access large creator networks without managing creators directly.",
  },
  {
    icon: BarChart3,
    title: "Performance-Based Economics",
    description: "Budgets are deployed based on real views, not fixed placements.",
  },
  {
    icon: Clock,
    title: "Speed & Timing",
    description: "Campaigns activate in days, not months — aligned to launch moments.",
  },
  {
    icon: Target,
    title: "Platform-Native Reach",
    description: "Content lives where attention already exists, not where ads interrupt.",
  },
]

const metrics = [
  { value: "12+", label: "Active Campaigns" },
  { value: "100M+", label: "Total Organic Views Delivered" },
  { value: "3.2×", label: "Average ROI for Brands" },
  { value: "300+", label: "Active Creators Deployed" },
]

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

export default function BrandsPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        
        {/* Hero Section - For Brands */}
        <section className="py-16 md:py-24">
          <div className="max-width-wrapper section-padding">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-4xl"
            >
              <motion.h1
                variants={itemVariants}
                className="text-3xl sm:text-4xl md:text-5xl font-light mb-4"
              >
                For Brands
              </motion.h1>
              <motion.h2
                variants={itemVariants}
                className="text-xl sm:text-2xl text-muted-foreground font-light mb-8"
              >
                Organic Distribution Built for Scale
              </motion.h2>
              
              <motion.div variants={itemVariants} className="space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
                <p>
                  Swivi helps brands amplify content across TikTok, Instagram Reels, and YouTube Shorts using large creator networks incentivized on performance.
                </p>
                
                <p>
                  Instead of buying attention through ads or negotiating individual influencer deals, brands work with Swivi to deploy creator distribution at scale — efficiently, transparently, and with measurable outcomes.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* When Brands Use Swivi */}
        <section className="py-16 md:py-20 bg-foreground/[0.02] border-y border-black/5">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-8">
                When Brands Use Swivi
              </h2>
              
              <p className="text-base sm:text-lg text-muted-foreground mb-8">
                Swivi campaigns are designed for moments where reach matters most:
              </p>
              
              <div className="space-y-3 mb-10">
                {brandUseCases.map((useCase, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-base sm:text-lg font-normal"
                  >
                    {useCase}
                  </motion.p>
                ))}
              </div>
              
              <p className="text-base sm:text-lg text-muted-foreground">
                If timing matters, Swivi works.
              </p>
            </motion.div>
          </div>
        </section>

        {/* What Brands Get */}
        <section className="py-16 md:py-20">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-10">
                What Brands Get
              </h2>
              
              <div className="space-y-4 mb-10">
                {whatBrandsGet.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                      <Check className="w-3.5 h-3.5 text-foreground" />
                    </div>
                    <p className="text-base sm:text-lg">{item}</p>
                  </motion.div>
                ))}
              </div>
              
              <div className="pt-8 border-t border-black/5">
                <p className="text-base sm:text-lg">
                  <span className="text-muted-foreground">Brands fund the media budget.</span>
                  <br />
                  <span className="font-normal">Swivi handles execution.</span>
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Traditional CPM Section */}
        <section className="py-16 md:py-20 bg-foreground/[0.02] border-y border-black/5">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6">
                How Traditional Paid Media Is Priced
              </h2>
              
              <p className="text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed">
                Traditional advertising channels price exposure using estimated reach, fixed inventory, and static placements — often with limited flexibility and high costs.
              </p>
              
              <h3 className="text-lg font-normal mb-6">Traditional Media Cost Benchmarks</h3>
              
              <div className="space-y-4 mb-10">
                {cpmData.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 pb-4 border-b border-black/5"
                  >
                    <div className="flex items-baseline gap-4 sm:w-48 flex-shrink-0">
                      <span className="text-base font-normal">{item.medium}</span>
                      <span className="text-base text-foreground">{item.cpm}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.note}</span>
                  </motion.div>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground">
                These channels rely on estimated exposure, limited optimization, and long lead times.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Why Brands Are Shifting Budget */}
        <section className="py-16 md:py-20">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-8">
                Why Brands Are Shifting Budget
              </h2>
              
              <div className="space-y-2 text-base sm:text-lg text-muted-foreground mb-8">
                <p>Paid social costs continue to rise.</p>
                <p>Traditional media lacks flexibility.</p>
                <p>Influencer marketing doesn't scale cleanly.</p>
              </div>
              
              <p className="text-base sm:text-lg mb-8">
                <span className="font-normal">Creator-powered organic distribution</span>
                <span className="text-muted-foreground"> sits between paid ads and earned media — offering:</span>
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {["Real views", "Lower cost", "Faster deployment", "Cultural relevance"].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-base sm:text-lg font-normal"
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
              
              <p className="text-base sm:text-lg text-muted-foreground">
                This is where Swivi operates.
              </p>
            </motion.div>
          </div>
        </section>

        {/* A New Distribution Layer */}
        <section className="py-16 md:py-20 bg-foreground/[0.02] border-y border-black/5">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-8">
                A New Distribution Layer
              </h2>
              
              <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
                Swivi campaigns generate organic views through native platform distribution, coordinated across hundreds of creators, during time-sensitive windows.
              </p>
              
              <p className="text-base sm:text-lg mb-6">The result:</p>
              
              <div className="grid grid-cols-2 gap-4 mb-10">
                {["Faster saturation", "Lower effective costs", "Higher engagement signals", "Broader algorithmic lift"].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-base sm:text-lg font-normal"
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
              
              <div className="pt-8 border-t border-black/5">
                <p className="text-base sm:text-lg text-muted-foreground">This isn't traditional advertising.</p>
                <p className="text-xl font-normal mt-2">It's organic media buying.</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Brands Choose Swivi */}
        <section className="py-16 md:py-20">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-5xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-12 text-center">
                Why Brands Choose Swivi
              </h2>
              
              <div className="grid md:grid-cols-2 gap-10">
                {whyChooseSwivi.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-normal mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Metrics Section */}
        <section className="py-16 md:py-20 bg-foreground/[0.02] border-y border-black/5">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-5xl"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <p className="text-3xl sm:text-4xl font-light mb-2">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Swivi Media is the organic distribution layer for brands that care about reach, efficiency, and scale.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LightningHover>
                  <Button size="lg" className="group font-normal bg-foreground text-background hover:bg-foreground/90 border border-foreground">
                    <Link href="https://calendly.com/bykevingeorge/30min?month=2025-05" target="_blank" rel="noopener noreferrer" className="flex items-center">
                      Launch a Campaign
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </LightningHover>
                <Button size="lg" variant="outline" className="font-normal bg-transparent text-foreground hover:bg-foreground hover:text-background border-foreground">
                  <Link href="/case-studies">
                    View Case Studies
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
