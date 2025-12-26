"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { LightningHover } from "@/components/effects/lightning-hover"

export function FinalCTA() {
  return (
    <section className="py-20 md:py-32 border-t border-black/5 bg-background relative">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-6 leading-tight">
            Ready to Launch Your Campaign?
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Connect with creators and amplify your reach organically.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <LightningHover>
              <Button size="lg" className="group font-normal bg-foreground text-background hover:bg-foreground/90 border border-foreground">
                <Link href="https://calendly.com/bykevingeorge/30min?month=2025-05" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  Launch a Campaign
                  <motion.span
                    className="ml-2"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
              </Button>
            </LightningHover>
            <Button size="lg" variant="outline" className="font-normal bg-transparent text-foreground hover:bg-foreground hover:text-background border-foreground">
              <Link href="/case-studies">
                View Case Studies
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

