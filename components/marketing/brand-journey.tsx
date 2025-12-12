"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

const journeySteps = [
  {
    title: "Discovery",
    content: "Our creator network delivered 20M+ views for Netflix's Owning Manhattan at half market CPM. We analyze your brand objectives, target demographics, and performance benchmarks to architect a custom distribution strategy.",
    showTitle: true
  },
  {
    title: "Strategy",
    content: "Data-driven campaign architecture. We map creator networks to your target audience, optimize content distribution channels, and establish clear KPIs. Every decision backed by historical performance data.",
    showTitle: true
  },
  {
    title: "Proposal",
    content: "Transparent pricing models. Detailed ROI projections. Platform-specific targeting strategies. Full campaign timeline with milestone tracking and performance guarantees.",
    showTitle: true
  },
  {
    title: "Execution",
    content: "Real-time campaign deployment across verified creator networks. Continuous performance monitoring, algorithmic optimization, and live reporting dashboards. Full visibility into every impression.",
    showTitle: true
  },
  {
    title: "Analytics",
    content: "Comprehensive performance reporting. Engagement metrics, reach analytics, demographic breakdowns, and CPM benchmarks. Post-campaign insights to inform future strategies.",
    showTitle: true
  }
]

function StorySection({ step, index }: { step: typeof journeySteps[0], index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.3, 1, 0.3])
  const scale = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.98, 1, 0.98])
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, -50])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale, y }}
      className="relative min-h-screen flex items-center justify-center py-20"
    >
      <div className="max-width-wrapper section-padding text-center relative z-10">
        <motion.div className="space-y-6 max-w-4xl mx-auto">
          {step.showTitle && step.title && (
            <div className="mb-8">
              <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[0.9]">
                {step.title}
              </h2>
            </div>
          )}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
            {step.content}
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

function IntroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale }}
      className="sticky top-0 min-h-screen flex items-center justify-center"
    >
      <div className="max-width-wrapper section-padding text-center relative z-10">
        <h2 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight leading-[0.85] mb-8">
          Our Process
        </h2>
        <p className="text-xl sm:text-2xl text-muted-foreground font-light">
          From initial consultation to campaign delivery
        </p>
      </div>
    </motion.div>
  )
}

export function BrandJourney() {
  return (
    <section className="relative bg-background">
      {/* Intro Section */}
      <IntroSection />
      
      {/* Story Flow */}
      <div className="relative z-10">
        {journeySteps.map((step, index) => (
          <StorySection key={index} step={step} index={index} />
        ))}
      </div>

      {/* Closing CTA */}
      <div className="min-h-[60vh] flex items-center justify-center py-20">
        <div className="max-width-wrapper section-padding text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h3 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight">
              Ready to Scale?
            </h3>
            <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
              Schedule a consultation to discuss your distribution strategy and performance targets.
            </p>
            <motion.a
              href="/brands"
              className="inline-block px-8 py-4 bg-foreground text-background text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Schedule Consultation
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
