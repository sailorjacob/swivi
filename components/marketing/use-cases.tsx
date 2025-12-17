"use client"

import { motion } from "framer-motion"

const useCases = [
  "Netflix shows & streaming releases",
  "Product launches & brand announcements",
  "Podcast & YouTube channel premieres",
  "Founder personal brand building",
  "Music drops & entertainment releases",
  "Real estate & luxury brand promotion",
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
            Perfect For Big Launch Moments
          </h2>
          
          <p className="text-base sm:text-lg text-muted-foreground mb-8">
            We work best when timing matters:
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
            If you need millions of eyes on something important, we can help.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

