"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

const journeySteps = [
  {
    title: "Imagine This",
    content: (
      <>
        "Hi [Name], Our creator network delivered{" "}
        <span className="text-foreground font-medium">20M+ views</span> for Netflix's Owning Manhattan at{" "}
        <span className="text-foreground font-medium">half market CPM</span>. 
        Imagine similar for [Your Brand]—let's discuss a pilot."
      </>
    ),
    subtitle: "Initial Outreach"
  },
  {
    title: "We Learn About You",
    content: "Tell us your goals. Your budget. Your vision. We position ourselves as your partner, not just another vendor. This is about building something together.",
    subtitle: "Discovery Call"
  },
  {
    title: "Custom Strategy",
    content: "We build a proposal tailored to your brand. Real benchmarks. Real results. Options that scale with your ambitions—from focused pilots to enterprise campaigns.",
    subtitle: "Proposal Phase"
  },
  {
    title: "Transparent Partnership",
    content: "No hidden costs. No surprises. Just honest conversations about what works, backed by data from campaigns that delivered millions of impressions.",
    subtitle: "Negotiation"
  },
  {
    title: "Launch & Scale",
    content: "Limited creator slots. High-intent campaigns. We close 30% of partnerships because we only take on brands we know we can win for.",
    subtitle: "Closing"
  }
]

function StorySection({ step, index }: { step: typeof journeySteps[0], index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.3, 1, 0.3])
  const scale = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.95, 1, 0.95])
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale, y }}
      className="min-h-screen flex items-center justify-center py-20"
    >
      <div className="max-width-wrapper section-padding text-center">
        <motion.div className="space-y-6">
          <p className="text-xs tracking-widest uppercase text-muted-foreground font-light">
            {step.subtitle}
          </p>
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.9]">
            {step.title}
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light">
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
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale }}
      className="sticky top-0 min-h-screen flex items-center justify-center"
    >
      <div className="max-width-wrapper section-padding text-center">
        <h2 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight leading-[0.85] mb-8">
          How It
          <br />
          <span className="italic">Actually</span> Works
        </h2>
        <p className="text-xl sm:text-2xl text-muted-foreground font-light">
          From first conversation to campaign launch
        </p>
      </div>
    </motion.div>
  )
}

export function BrandJourney() {
  return (
    <section className="relative bg-background overflow-hidden">
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
              Ready to talk?
            </h3>
            <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
              Let's build something that gets millions of eyes on your brand.
            </p>
            <motion.a
              href="/brands"
              className="inline-block px-8 py-4 bg-foreground text-background text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start a Pilot
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
