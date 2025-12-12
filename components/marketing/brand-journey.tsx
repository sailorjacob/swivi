"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

const journeySteps = [
  {
    title: null,
    content: (
      <>
        "Hi [Name], Our creator network delivered{" "}
        <span className="text-foreground font-medium">20M+ views</span> for Netflix's Owning Manhattan at{" "}
        <span className="text-foreground font-medium">half market CPM</span>. 
        Imagine similar for [Your Brand]—let's discuss a pilot."
      </>
    ),
    showTitle: false
  },
  {
    title: null,
    content: "We listen. Your goals become ours. Your vision shapes everything we build. This is about understanding what success actually means for your brand.",
    showTitle: false
  },
  {
    title: "Proposal",
    content: "Custom strategies built around real data. Benchmarks from campaigns that actually delivered. Flexible options that grow with you.",
    showTitle: true
  },
  {
    title: null,
    content: "Honest conversations. Real numbers. No surprises. We work with partners who value transparency and results backed by millions of impressions.",
    showTitle: false
  },
  {
    title: "Delivery",
    content: "We work with a select group of partners to ensure every campaign gets the attention it deserves. Quality over quantity, always.",
    showTitle: true
  }
]

function LiquidBlob({ side, index }: { side: 'left' | 'right', index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [200, -200])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360])

  return (
    <motion.div
      ref={ref}
      style={{ y, rotate }}
      className={`absolute ${side === 'left' ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 pointer-events-none`}
    >
      <svg width="400" height="400" viewBox="0 0 400 400" className="opacity-20">
        <defs>
          <filter id={`goo-${side}-${index}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
        <g filter={`url(#goo-${side}-${index})`}>
          <motion.circle
            cx="200"
            cy="200"
            r="80"
            fill="currentColor"
            className="text-foreground"
            animate={{
              r: [80, 100, 80],
              cx: [200, 220, 200],
              cy: [200, 180, 200],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.3
            }}
          />
          <motion.circle
            cx="250"
            cy="200"
            r="60"
            fill="currentColor"
            className="text-foreground"
            animate={{
              r: [60, 80, 60],
              cx: [250, 230, 250],
              cy: [200, 220, 200],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.3 + 0.5
            }}
          />
          <motion.circle
            cx="200"
            cy="250"
            r="70"
            fill="currentColor"
            className="text-foreground"
            animate={{
              r: [70, 90, 70],
              cx: [200, 180, 200],
              cy: [250, 230, 250],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.3 + 1
            }}
          />
        </g>
      </svg>
    </motion.div>
  )
}

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
      className="relative min-h-screen flex items-center justify-center py-20"
    >
      {/* Liquid Metal Blobs */}
      <LiquidBlob side="left" index={index} />
      <LiquidBlob side="right" index={index} />

      <div className="max-width-wrapper section-padding text-center relative z-10">
        <motion.div className="space-y-6">
          {step.showTitle && step.title && (
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.9]">
              {step.title}
            </h2>
          )}
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
              Let's talk
            </h3>
            <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
              We'd love to learn about your brand and explore what's possible together.
            </p>
            <motion.a
              href="/brands"
              className="inline-block px-8 py-4 bg-foreground text-background text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get in Touch
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
