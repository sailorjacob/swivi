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

export function HeroOriginal() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[500px] h-[500px] rounded-full bg-foreground/10"
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              scale: 0.5 + Math.random() * 0.5,
            }}
            animate={{
              x: [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
              ],
              y: [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
              ],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      <div className="max-width-wrapper section-padding py-20 md:py-32 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl"
        >
          {/* Main Heading */}
          <motion.h1
            variants={itemVariants}
            className="mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight"
          >
            Supercharge Your Brand's{" "}
            <motion.span
              className="font-normal inline-block"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Media Presence
            </motion.span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="mb-10 text-base sm:text-lg text-muted-foreground max-w-xl"
          >
            Turn your content into viral moments and more sales. We amplify your reach across 
            all media. Book a call now!
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" className="group font-normal bg-transparent text-foreground hover:bg-foreground hover:text-background border border-foreground">
              <Link href="https://calendly.com/bykevingeorge/30min?month=2025-05" target="_blank" rel="noopener noreferrer" className="flex items-center">
                Book a Call
                <motion.span
                  className="ml-2"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="font-normal bg-transparent text-foreground hover:bg-foreground hover:text-background border-foreground">
              <Link href="/case-studies">
                See Case Studies
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicator */}
          <motion.div
            variants={itemVariants}
            className="mt-16 pt-16 border-t border-white/10"
          >
            <motion.p
              className="text-sm text-muted-foreground"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Helping brands go viral.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
