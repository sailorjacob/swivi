"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Play, TrendingUp, Clock, Users } from "lucide-react"

interface CaseStudy {
  id: string
  clientName: string
  clientType: string
  tagline: string
  description: string
  budget: number
  timeline: string
  viewsGenerated: number
  postsSubmitted: number
  highlights: string[]
  exampleContent: string
  clientLogo: string
}

const caseStudies: CaseStudy[] = [
  {
    id: "owning-manhattan",
    clientName: "Owning Manhattan",
    clientType: "Netflix Series",
    tagline: "22M views in 4 days",
    description: "Viral campaign for Netflix's hit real estate series. We mobilized our creator network to generate massive awareness ahead of the show's premiere.",
    budget: 20000,
    timeline: "4 days",
    viewsGenerated: 22000000,
    postsSubmitted: 600,
    highlights: [
      "Exceeded view targets by 300%",
      "600 creators activated",
      "Instagram & TikTok reach"
    ],
    exampleContent: "https://www.instagram.com/reel/DOKGK_ciO-9/",
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif"
  },
  {
    id: "shvfty",
    clientName: "Shvfty",
    clientType: "Twitch Streamer",
    tagline: "1.9M views from gaming clips",
    description: "Helping a rising Twitch streamer break through on short-form platforms. Our clippers transformed stream highlights into viral TikTok content.",
    budget: 900,
    timeline: "5 days",
    viewsGenerated: 1900000,
    postsSubmitted: 258,
    highlights: [
      "211% ROI",
      "Cross-platform growth",
      "Gaming community reach"
    ],
    exampleContent: "https://www.tiktok.com/@shvftysclips/video/7521097192539557151",
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/shvty.jpeg"
  },
  {
    id: "sportz-playz",
    clientName: "Sportz Playz",
    clientType: "Sports Platform",
    tagline: "9.5M views, 3717% ROI",
    description: "Sports betting platform targeting passionate sports fans. Our network delivered massive reach at an incredibly efficient cost per view.",
    budget: 249,
    timeline: "2 weeks",
    viewsGenerated: 9500000,
    postsSubmitted: 98,
    highlights: [
      "Highest ROI campaign",
      "Viral sports content",
      "Community engagement"
    ],
    exampleContent: "https://www.instagram.com/reel/DNVx_F0OKAx/",
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png"
  },
  {
    id: "rod-khlief",
    clientName: "Rod Khleif",
    clientType: "Real Estate Educator",
    tagline: "840K views for real estate content",
    description: "Real estate education content reaching aspiring investors. We helped position Rod as a thought leader in the property investment space.",
    budget: 864,
    timeline: "3 days",
    viewsGenerated: 840000,
    postsSubmitted: 720,
    highlights: [
      "720 posts distributed",
      "Targeted investors",
      "Educational content"
    ],
    exampleContent: "https://www.instagram.com/reel/example-rod-khlief/",
    clientLogo: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/rodkhlief.avif"
  }
]

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`
  }
  return num.toString()
}

function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <div className="w-screen h-full flex-shrink-0 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-xl lg:max-w-3xl bg-card border border-border rounded-2xl p-5 sm:p-8 lg:p-12">
        {/* Header */}
        <div className="flex items-start gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Image
            src={study.clientLogo}
            alt={study.clientName}
            width={120}
            height={120}
            className="w-14 h-14 sm:w-20 sm:h-20 lg:w-28 lg:h-28 rounded-xl object-cover ring-1 ring-border flex-shrink-0"
            unoptimized
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.15em] text-muted-foreground">
              {study.clientType}
            </span>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-light text-foreground mt-0.5 sm:mt-1">
              {study.clientName}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-0.5 sm:mt-1">
              {study.tagline}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-6 lg:mb-8">
          {study.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="text-center p-2 sm:p-3 lg:p-4 bg-muted/30 rounded-lg lg:rounded-xl border border-border">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mx-auto mb-1 sm:mb-2 text-muted-foreground" />
            <div className="text-sm sm:text-lg lg:text-2xl font-light text-foreground">
              {formatNumber(study.viewsGenerated)}
            </div>
            <div className="text-[8px] sm:text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">
              Views
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 lg:p-4 bg-muted/30 rounded-lg lg:rounded-xl border border-border">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mx-auto mb-1 sm:mb-2 text-muted-foreground" />
            <div className="text-sm sm:text-lg lg:text-2xl font-light text-foreground">
              {study.postsSubmitted}
            </div>
            <div className="text-[8px] sm:text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">
              Posts
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 lg:p-4 bg-muted/30 rounded-lg lg:rounded-xl border border-border">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mx-auto mb-1 sm:mb-2 text-muted-foreground" />
            <div className="text-sm sm:text-lg lg:text-2xl font-light text-foreground">
              {study.timeline}
            </div>
            <div className="text-[8px] sm:text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">
              Time
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 lg:p-4 bg-muted/30 rounded-lg lg:rounded-xl border border-border">
            <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mx-auto mb-1 sm:mb-2 text-muted-foreground flex items-center justify-center text-[10px] sm:text-xs lg:text-sm">$</div>
            <div className="text-sm sm:text-lg lg:text-2xl font-light text-foreground">
              {study.budget >= 1000 ? `${(study.budget / 1000).toFixed(0)}K` : study.budget}
            </div>
            <div className="text-[8px] sm:text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">
              Budget
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:gap-3 mb-4 sm:mb-6">
          {study.highlights.map((highlight, idx) => (
            <span
              key={idx}
              className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs lg:text-sm bg-muted/50 border border-border text-muted-foreground"
            >
              {highlight}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Link
          href={study.exampleContent}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs sm:text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors"
        >
          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
          View Example Content
          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </Link>
      </div>
    </div>
  )
}

export function CaseStudyStories() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Transform vertical scroll into horizontal movement
  // We have 4 case studies, so we move from 0% to -300% (3 slides worth)
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${(caseStudies.length - 1) * 100}%`])

  return (
    <>
      {/* Header Section */}
      <section className="pt-32 sm:pt-40 lg:pt-48 pb-12 sm:pb-16 flex flex-col items-center justify-center px-4">
        <span className="inline-block text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium mb-4">
          Case Studies
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 text-foreground text-center">
          Real Results. <span className="font-normal">Real Brands.</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto text-center mb-8">
          Scroll to explore how we've helped brands generate millions of views.
        </p>
        
        {/* Stats */}
        <div className="flex justify-center gap-8 sm:gap-12">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-light text-foreground">100M+</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-light text-foreground">75M</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Network Reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-light text-foreground">3,000+</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Posts</div>
          </div>
        </div>
      </section>

      {/* Horizontal Scroll Section - Sticky Container */}
      <div 
        ref={containerRef} 
        className="relative"
        style={{ height: `${(caseStudies.length - 1) * 100 + 100}vh` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden flex items-center">
          <motion.div 
            className="flex h-full"
            style={{ x }}
          >
            {caseStudies.map((study) => (
              <CaseStudyCard key={study.id} study={study} />
            ))}
          </motion.div>
          
          {/* Progress indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {caseStudies.map((_, idx) => (
              <motion.div
                key={idx}
                className="w-8 h-1 rounded-full bg-muted-foreground/20 overflow-hidden"
              >
                <motion.div
                  className="h-full bg-foreground rounded-full"
                  style={{
                    scaleX: useTransform(
                      scrollYProgress,
                      [idx / caseStudies.length, (idx + 1) / caseStudies.length],
                      [0, 1]
                    ),
                    transformOrigin: "left"
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
