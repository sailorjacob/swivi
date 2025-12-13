"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export function Hero() {
  return (
    <section className="sticky top-0 h-screen flex items-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.4)' }}
        >
          <source src="https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/bg.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      <div className="max-width-wrapper section-padding py-20 md:py-32 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl"
        >
          {/* Main Heading */}
          <motion.h1
            variants={itemVariants}
            className="mb-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight text-white"
          >
            Performance-Driven{" "}
            <span className="font-normal">Creator Distribution</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="mb-10 text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl font-light leading-relaxed"
          >
            Data-backed creator networks delivering measurable reach at scale. 
            100M+ verified impressions. Sub-market CPM. Enterprise-grade analytics.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" className="group font-normal bg-white text-black hover:bg-white/90 border-0">
              <Link href="https://calendly.com/bykevingeorge/30min?month=2025-05" target="_blank" rel="noopener noreferrer" className="flex items-center">
                Schedule Consultation
                <motion.span
                  className="ml-2"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="font-normal bg-transparent text-white hover:bg-white/10 border-white/30 hover:border-white">
              <Link href="/case-studies">
                View Case Studies
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicator */}
          <motion.div
            variants={itemVariants}
            className="mt-16 pt-16 border-t border-white/20"
          >
            <div className="flex flex-col sm:flex-row gap-8 text-white/80">
              <div>
                <div className="text-3xl font-light text-white">100M+</div>
                <div className="text-sm uppercase tracking-wider">Views Delivered</div>
              </div>
              <div>
                <div className="text-3xl font-light text-white">75M</div>
                <div className="text-sm uppercase tracking-wider">Active Network</div>
              </div>
              <div>
                <div className="text-3xl font-light text-white">50%</div>
                <div className="text-sm uppercase tracking-wider">Below Market Rates</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 