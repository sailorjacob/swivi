"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

const goodFit = [
  "Have a launch date and need massive reach",
  "Want real organic views, not bots or fake engagement",
  "Have a budget of $15K+ for a real campaign",
  "Value results over vanity metrics",
]

const notFit = [
  "Just want a couple social media posts",
  "Need us to create content from scratch",
]

export function WhoIsFor() {
  return (
    <section className="py-20 md:py-32 border-t border-black/5 bg-background relative">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-12 text-center">
            Are We a Good Fit?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            {/* Good Fit */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-normal mb-6">We're a great fit if you:</h3>
              <div className="space-y-4">
                {goodFit.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Not a Fit */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-normal mb-6">We're probably not a fit if you:</h3>
              <div className="space-y-4">
                {notFit.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

