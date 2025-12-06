"use client"

import { motion } from "framer-motion"
import { TrendingUp, ArrowRight, Award, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

const campaignHighlights = [
  {
    client: "Owning Manhattan",
    type: "Netflix Series",
    roi: "610% ROI",
    views: "6.1M views",
    budget: "$1,000",
    highlight: "610% ROI in 2 days",
    color: "text-red-600"
  },
  {
    client: "Shvfty",
    type: "Twitch Streamer", 
    roi: "211% ROI",
    views: "1.9M views",
    budget: "$900",
    highlight: "258 posts in 5 days",
    color: "text-purple-600"
  },
  {
    client: "Sportz Playz",
    type: "Gambling Company",
    roi: "3,240% ROI",
    views: "8.1M views", 
    budget: "$250",
    highlight: "324x return on investment",
    color: "text-green-600"
  }
]

const stats = [
  {
    value: "1,020%",
    label: "Average ROI",
    description: "Across all campaigns"
  },
  {
    value: "16M+",
    label: "Total Views",
    description: "Generated for clients"
  },
  {
    value: "6 days",
    label: "Avg. Timeline",
    description: "Campaign completion"
  }
]

export function CampaignsPreview() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  }

  return (
    <section className="py-20 md:py-32 border-t border-black/5">
      <div className="max-width-wrapper section-padding">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
              Proven <span className="font-normal">Campaign Results</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From Netflix series to gaming streamers, see how we've helped clients 
              achieve exceptional ROI through our creator network.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-8 md:gap-12 mb-16">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-light mb-1">{stat.value}</div>
                <div className="text-sm font-normal mb-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </div>
            ))}
          </motion.div>

          {/* Campaign Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {campaignHighlights.map((campaign, index) => (
              <motion.div
                key={campaign.client}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 bg-neutral-800/60 border-neutral-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-lg mb-1">{campaign.client}</h3>
                        <p className="text-sm text-muted-foreground">{campaign.type}</p>
                      </div>
                      <Award className="h-5 w-5 text-yellow-500" />
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Investment:</span>
                        <span className="text-sm font-medium">{campaign.budget}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Views Generated:</span>
                        <span className="text-sm font-medium">{campaign.views}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Return:</span>
                        <span className={`text-sm font-medium ${campaign.color}`}>
                          {campaign.roi}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-black/5">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-muted-foreground font-medium">
                          {campaign.highlight}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Ready to achieve similar results for your brand? See our complete campaign portfolio 
              and learn how we can help you reach millions of engaged viewers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/case-studies"
                  className="inline-flex items-center text-sm font-normal bg-foreground text-background px-8 py-4 rounded-full hover:bg-foreground/90 transition-all duration-300 group"
                >
                  View All Case Studies
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              <Link
                href="/brands"
                className="inline-flex items-center text-sm font-normal border border-black/20 px-8 py-4 rounded-full hover:bg-black/5 transition-all duration-300 group"
              >
                <Target className="mr-2 h-4 w-4" />
                Start Your Campaign
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
