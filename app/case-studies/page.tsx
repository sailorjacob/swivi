"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, TrendingUp, Users, Clock, DollarSign, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface CaseStudy {
  id: string
  clientName: string
  clientType: string
  tagline: string
  description: string
  budget: string
  timeline: string
  viewsGenerated: string
  postsSubmitted: string
  highlights: string[]
  exampleContent: string
  detailPage?: string
  clientLogo: string
}

const caseStudies: CaseStudy[] = [
  {
    id: "owning-manhattan",
    clientName: "Owning Manhattan",
    clientType: "Netflix Series",
    tagline: "25M views in under 7 days",
    description: "Creator-powered organic distribution for Netflix's hit real estate series. We deployed 100+ creators to generate massive awareness during the Season 2 launch window.",
    budget: "$20K",
    timeline: "< 7 days",
    viewsGenerated: "25M+",
    postsSubmitted: "600",
    highlights: [
      "Sub-$1 effective CPM",
      "100+ creators activated",
      "Cross-platform saturation"
    ],
    exampleContent: "https://www.instagram.com/reel/DOKGK_ciO-9/",
    detailPage: "/case-studies/owning-manhattan",
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif"
  },
  {
    id: "sportz-playz",
    clientName: "Sportz Playz",
    clientType: "Sports Platform",
    tagline: "9.5M views, 3717% ROI",
    description: "Sports betting platform targeting passionate sports fans. Our network delivered massive reach at an incredibly efficient cost per view.",
    budget: "$249",
    timeline: "2 weeks",
    viewsGenerated: "9.5M",
    postsSubmitted: "98",
    highlights: [
      "Highest ROI campaign",
      "Viral sports content",
      "Community engagement"
    ],
    exampleContent: "https://www.instagram.com/reel/DNVx_F0OKAx/",
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png"
  },
  {
    id: "shvfty",
    clientName: "Shvfty",
    clientType: "Twitch Streamer",
    tagline: "1.9M views from gaming clips",
    description: "Helping a rising Twitch streamer break through on short-form platforms. Our clippers transformed stream highlights into viral TikTok content.",
    budget: "$900",
    timeline: "5 days",
    viewsGenerated: "1.9M",
    postsSubmitted: "258",
    highlights: [
      "211% ROI",
      "Cross-platform growth",
      "Gaming community reach"
    ],
    exampleContent: "https://www.tiktok.com/@shvftysclips/video/7521097192539557151",
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/shvty.jpeg"
  },
  {
    id: "rod-khlief",
    clientName: "Rod Khleif",
    clientType: "Real Estate Educator",
    tagline: "840K views for real estate content",
    description: "Real estate education content reaching aspiring investors. We helped position Rod as a thought leader in the property investment space.",
    budget: "$864",
    timeline: "3 days",
    viewsGenerated: "840K",
    postsSubmitted: "720",
    highlights: [
      "720 posts distributed",
      "Targeted investors",
      "Educational content"
    ],
    exampleContent: "https://www.instagram.com/reel/example-rod-khlief/",
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/rodkhlief.avif"
  }
]

const stats = [
  { value: "100M+", label: "Total Views" },
  { value: "75M", label: "Network Reach" },
  { value: "3,000+", label: "Posts" },
]

export default function CaseStudiesPage() {
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
          {/* Hero */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
              Case Studies
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light mb-6">
              Real Results.{" "}
              <span className="font-normal">Real Brands.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how we've helped brands generate millions of views through creator-powered distribution.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-3 gap-8 mb-20 py-12 border-y border-black/5"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-light mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Case Studies Grid */}
          <div className="space-y-20 mb-20">
            {caseStudies.map((study, index) => (
              <motion.div
                key={study.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Image/Logo Side */}
                <div className={`${index % 2 === 1 ? 'md:order-2' : ''}`}>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-foreground/[0.02] border border-black/5 p-12 flex items-center justify-center">
                    <Image
                      src={study.clientLogo}
                      alt={study.clientName}
                      width={400}
                      height={400}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Content Side */}
                <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">
                    {study.clientType}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-light mb-3">
                    {study.clientName}
                  </h2>
                  <p className="text-xl text-muted-foreground mb-6">
                    {study.tagline}
                  </p>
                  <p className="text-base text-muted-foreground leading-relaxed mb-8">
                    {study.description}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-foreground/[0.02] rounded-lg border border-black/5">
                      <TrendingUp className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-lg font-light mb-1">{study.viewsGenerated}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Views</div>
                    </div>
                    <div className="text-center p-4 bg-foreground/[0.02] rounded-lg border border-black/5">
                      <Users className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-lg font-light mb-1">{study.postsSubmitted}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Posts</div>
                    </div>
                    <div className="text-center p-4 bg-foreground/[0.02] rounded-lg border border-black/5">
                      <Clock className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-lg font-light mb-1">{study.timeline}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Time</div>
                    </div>
                    <div className="text-center p-4 bg-foreground/[0.02] rounded-lg border border-black/5">
                      <DollarSign className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-lg font-light mb-1">{study.budget}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Budget</div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {study.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-full text-xs bg-foreground/[0.02] border border-black/5 text-muted-foreground"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex gap-4">
                    {study.detailPage ? (
                      <Link href={study.detailPage}>
                        <Button variant="outline" className="font-normal">
                          View Full Case Study
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={study.exampleContent} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="font-normal">
                          View Example Content
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Final CTA */}
          <motion.section
            variants={itemVariants}
            className="text-center py-16 px-8 bg-foreground/[0.02] rounded-2xl border border-black/5"
          >
            <h2 className="text-3xl sm:text-4xl font-light mb-4">
              Ready to Get <span className="font-normal">Millions of Views?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Let's talk about your next launch. Book a call and we'll show you exactly how we'd drive views for your brand.
            </p>
            <LightningHover>
              <Button size="lg" className="font-normal bg-foreground text-background hover:bg-foreground/90">
                <Link href="https://calendly.com/bykevingeorge/30min?month=2025-05" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  Launch a Campaign
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </LightningHover>
          </motion.section>

        </motion.div>
      </main>
      <Footer />
    </>
  )
}
