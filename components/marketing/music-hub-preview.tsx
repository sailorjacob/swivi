"use client"

import { motion } from "framer-motion"
import { Music, DollarSign, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export function MusicHubPreview() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Music className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-light">
                NEW: Music Creator Hub
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Double your income by using sponsored music in videos you're already creating
            </p>
          </div>

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <DollarSign className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-medium text-lg mb-2">Extra Income</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Earn $0.50-$5.00 per 1,000 views on top of your regular brand deals
                </p>
                <p className="text-2xl font-light text-primary">+$500-2K/month</p>
                <p className="text-xs text-muted-foreground">Average creator earnings</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-medium text-lg mb-2">Viral Potential</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Trending music helps your content reach more viewers
                </p>
                <p className="text-2xl font-light text-primary">2.5x</p>
                <p className="text-xs text-muted-foreground">Average view increase</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <Zap className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-medium text-lg mb-2">Easy Integration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Just add music to videos you're already making for brands
                </p>
                <p className="text-2xl font-light text-primary">30 sec</p>
                <p className="text-xs text-muted-foreground">To add & submit</p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="border-primary mb-12">
            <CardContent className="p-8">
              <h3 className="text-xl font-medium mb-6 text-center">How Creators Earn Extra</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-medium">1</span>
                  </div>
                  <p className="text-sm">Browse available music campaigns</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-medium">2</span>
                  </div>
                  <p className="text-sm">Use the music in your brand videos</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-medium">3</span>
                  </div>
                  <p className="text-sm">Submit your video link</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-medium">4</span>
                  </div>
                  <p className="text-sm">Get paid per 1,000 views!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Calculation */}
          <Card className="bg-muted/50 mb-12">
            <CardContent className="p-8">
              <h4 className="font-medium mb-4">Example Earnings Calculation:</h4>
              <div className="space-y-2 text-sm">
                <p>You create <strong>10 videos/week</strong> for brands</p>
                <p>Each video gets <strong>50,000 views</strong> average</p>
                <p>You use music paying <strong>$2.00 per 1K views</strong></p>
                <p className="pt-2 text-lg">
                  Extra earnings: <strong className="text-primary">$1,000/week</strong> or <strong className="text-primary">$4,000/month</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/music-hub">
                <Music className="h-4 w-4 mr-2" />
                Explore Music Hub
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/music-hub">
                Artists: Submit Your Music
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 