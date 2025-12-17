"use client"

import { motion } from "framer-motion"

const proofPoints = [
  "Tens of millions of impressions delivered per campaign",
  "Sub-market cost performance",
  "Hundreds of creators activated per launch",
  "Repeatable across industries and verticals",
]

export function SocialProof() {
  return (
    <section className="py-20 md:py-32 bg-foreground/[0.02] border-y border-black/5">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-12">
            Proven at Scale
          </h2>
          
          <div className="space-y-6 mb-12">
            {proofPoints.map((point, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-base sm:text-lg text-muted-foreground"
              >
                {point}
              </motion.p>
            ))}
          </div>

          <p className="text-base font-normal">
            Swivi is built for volume, speed, and predictability.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

