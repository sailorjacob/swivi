"use client"

import { motion } from "framer-motion"

const items = [
  {
    label: "Media Budget",
    value: "$15,000–$25,000",
    description: "performance-based delivery",
  },
  {
    label: "Duration",
    value: "7–14 days",
    description: "",
  },
  {
    label: "Platforms",
    value: "TikTok, Instagram Reels, YouTube Shorts",
    description: "",
  },
  {
    label: "Management Fee",
    value: "Flat campaign fee",
    description: "",
  },
]

const features = [
  "No long-term contracts.",
  "No inflated influencer rates.",
  "Full transparency.",
]

export function CampaignStructure() {
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-12">
            Campaign Structure
          </h2>
          
          <div className="space-y-8 mb-12">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 pb-6 border-b border-black/5"
              >
                <div className="text-sm text-muted-foreground sm:w-48 flex-shrink-0">
                  {item.label}:
                </div>
                <div className="flex-1">
                  <span className="text-base font-normal">{item.value}</span>
                  {item.description && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.description})
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-wrap gap-x-8 gap-y-2"
          >
            {features.map((feature, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {feature}
              </p>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

