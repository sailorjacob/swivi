"use client"

import { motion } from "framer-motion"

const metrics = [
  {
    value: "100M+",
    label: "verified organic impressions delivered",
  },
  {
    value: "75M+",
    label: "active creator network reach",
  },
  {
    value: "Up to 50%",
    label: "below paid social costs",
  },
]

export function MetricsStrip() {
  return (
    <section className="py-16 md:py-20 bg-foreground/[0.02] border-y border-black/5">
      <div className="max-width-wrapper section-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl md:text-5xl font-light mb-3">
                {metric.value}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

