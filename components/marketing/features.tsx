"use client"

import { motion } from "framer-motion"

const features = [
  {
    name: "Viral Content Strategy",
    description: "Transform your content into shareable moments that capture attention across platforms.",
  },
  {
    name: "Multi-Channel Amplification",
    description: "Maximize your reach by distributing content across news, social, and digital channels.",
  },
  {
    name: "Growth Analytics",
    description: "Track your viral growth with real-time metrics and actionable insights.",
  },
  {
    name: "Trend Optimization",
    description: "Stay ahead of the curve by identifying and capitalizing on emerging trends.",
  },
]

const useCases = [
  "Streamers", "Artists", "Brands", "Athletes", "Creators", "Musicians", "Podcasters",
  "Influencers", "Coaches", "Entrepreneurs", "Authors", "Speakers"
]

export function Features() {
  return (
    <section id="services" className="py-20 md:py-32">
      <div className="max-width-wrapper section-padding">
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
            Growth Solutions
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Every brand deserves to be seen. We provide the strategies and tools to 
            make your content go viral.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={feature.name}
              className="group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-[1px] bg-foreground mt-3" />
                <div>
                  <h3 className="font-normal text-lg mb-2">{feature.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Animated Use Cases Billboard */}
        <div className="mt-16 overflow-hidden">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{
              x: [0, -1000],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 20,
                ease: "linear",
              },
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-8 mr-8">
                {useCases.map((useCase, index) => (
                  <span
                    key={`${i}-${index}`}
                    className="text-lg font-light text-muted-foreground/60"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
} 