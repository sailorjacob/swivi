"use client"

import { motion } from "framer-motion"

export function Positioning() {
  return (
    <section className="py-20 md:py-32 border-t border-black/5 bg-background relative">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-8">
            Performance-Driven Creator Distribution
          </h2>
          
          <div className="space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            <p>
              Swivi Media operates large-scale creator networks across TikTok, Instagram Reels, and YouTube Shorts to deliver measurable reach at speed.
            </p>
            
            <p>
              Instead of relying on ads or one-off influencer posts, we coordinate hundreds of independent creators to distribute short-form content simultaneously — creating algorithm momentum, impression velocity, and cultural saturation.
            </p>
            
            <p className="text-foreground font-normal text-xl pt-4">
              This is not content creation.
              <br />
              It is organic media buying.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

