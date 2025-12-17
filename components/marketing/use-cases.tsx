"use client"

import { motion } from "framer-motion"

const useCases = [
  "TV & streaming releases",
  "Product or brand launches",
  "Podcast and episode drops",
  "Founder visibility pushes",
  "Music and entertainment releases",
]

export function UseCases() {
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-8">
            Built for High-Impact Moments
          </h2>
          
          <p className="text-base sm:text-lg text-muted-foreground mb-8">
            Swivi campaigns perform best for:
          </p>

          <div className="space-y-3 mb-12">
            {useCases.map((useCase, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-base font-normal"
              >
                {useCase}
              </motion.p>
            ))}
          </div>

          <p className="text-base text-muted-foreground">
            If reach and timing matter, Swivi works.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

