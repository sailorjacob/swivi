"use client"

import { motion } from "framer-motion"

const features = [
  {
    name: "Organic Distribution Strategy",
    description: "We plan and execute large-scale posting campaigns across hundreds of creator accounts — timed perfectly for your launch.",
  },
  {
    name: "Multi-Platform Reach",
    description: "Your campaign goes live simultaneously on TikTok, Instagram Reels, and YouTube Shorts — maximizing visibility across platforms.",
  },
  {
    name: "Real-Time Performance Tracking",
    description: "Watch your views and engagement grow in real time. We optimize throughout the campaign to maximize results.",
  },
  {
    name: "Trend-Aligned Content",
    description: "Campaigns are built around what's working on each platform right now — not outdated playbooks or guesswork.",
  },
]

const clientTypes = [
  "Streamers", "Artists", "Brands", "Athletes", "Creators", "Musicians", 
  "Podcasters", "Influencers", "Coaches", "Entrepreneurs", "Authors", "Speakers"
]

export function Features() {
  return (
    <section id="services" className="py-20 md:py-32 bg-background relative">
      <div className="max-width-wrapper section-padding">
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
            How We Drive Reach
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Every launch deserves momentum. Hundreds of creators post your campaign across their pages to drive real views and engagement.
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
        <div className="mt-8 overflow-hidden">
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
              },
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-8 mr-8">
                {clientTypes.map((clientType, index) => (
                  <span
                    key={`${i}-${index}`}
                    className="text-lg font-light text-muted-foreground/60"
                  >
                    {clientType}
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