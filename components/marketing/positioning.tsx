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
            How It Works
          </h2>
          
          <div className="space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            <p>
              We manage a network of hundreds of creators across TikTok, Instagram Reels, and YouTube Shorts. When you launch a campaign, they all post your content on their pages at the same time.
            </p>
            
            <p>
              Instead of paying for one expensive influencer or running ads, you get real organic views from real creator accounts — at a fraction of the cost.
            </p>
            
            <p className="text-foreground font-normal text-xl pt-4">
              Think of it as organic advertising.
              <br />
              Real posts. Real views. Real results.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

