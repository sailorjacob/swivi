"use client"

import { motion } from "framer-motion"

const features = [
  {
    name: "Organic Distribution Strategy",
    description: "We design distribution frameworks that prioritize volume, timing, and platform-native formats — optimized for organic discovery.",
  },
  {
    name: "Multi-Platform Amplification",
    description: "Content is deployed simultaneously across TikTok, Instagram Reels, and YouTube Shorts to maximize algorithm lift.",
  },
  {
    name: "Performance Analytics",
    description: "We track impressions, velocity, and creator performance in real time — allowing for fast optimization and budget efficiency.",
  },
  {
    name: "Trend Alignment",
    description: "Campaigns are structured around platform behavior, cultural moments, and short-form consumption patterns — not guesswork.",
  },
]

export function Features() {
  return (
    <section id="services" className="py-20 md:py-32 bg-background relative">
      <div className="max-width-wrapper section-padding">
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
            Distribution Solutions
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Every launch deserves momentum. Swivi provides the infrastructure to turn short-form content into measurable reach at scale.
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

      </div>
    </section>
  )
} 