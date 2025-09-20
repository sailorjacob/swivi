"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const showcaseItems = [
  {
    title: "Viral Growth",
    metric: "10x",
    description: "Average reach increase",
  },
  {
    title: "Media Coverage",
    metric: "500+",
    description: "Publications reached",
  },
  {
    title: "Engagement",
    metric: "2.5M+",
    description: "Monthly interactions",
  },
  {
    title: "Brand Mentions",
    metric: "15K+",
    description: "Monthly mentions",
  },
]

export function Showcase() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcaseItems.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-20 md:py-32 overflow-hidden bg-black/5">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
            Real Results
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how we've helped brands achieve exponential growth
          </p>
        </motion.div>

        <div className="relative h-[400px] md:h-[500px]">
          {showcaseItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: 100 }}
              animate={{
                opacity: currentIndex === index ? 1 : 0,
                x: currentIndex === index ? 0 : 100,
                scale: currentIndex === index ? 1 : 0.8,
              }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 flex items-center justify-center ${
                currentIndex === index ? "z-10" : "z-0"
              }`}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-6xl md:text-8xl font-light mb-4"
                >
                  {item.metric}
                </motion.div>
                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-xl md:text-2xl font-normal mb-2"
                >
                  {item.title}
                </motion.h3>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-muted-foreground"
                >
                  {item.description}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {showcaseItems.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentIndex === index ? "bg-foreground" : "bg-foreground/20"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </div>
    </section>
  )
} 