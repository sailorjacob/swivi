"use client"

import { motion } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, BarChart3, Target } from "lucide-react"

const cpmData = [
  {
    medium: "Television",
    cpm: "$25",
    icon: TrendingUp,
    description: "Per thousand impressions, can spike during high-demand events like the Super Bowl"
  },
  {
    medium: "Radio",
    cpm: "$4+",
    icon: BarChart3,
    description: "As low as $4 per thousand impressions, depending on market and audience"
  },
  {
    medium: "Newspapers",
    cpm: "$20-30",
    icon: DollarSign,
    description: "Ranges from $20 to $30 per thousand impressions, influenced by circulation"
  },
  {
    medium: "Magazines",
    cpm: "$20-30",
    icon: Target,
    description: "Similar to newspapers, varying by publication and audience specificity"
  },
  {
    medium: "Outdoor/Billboards",
    cpm: "$10-30+",
    icon: TrendingUp,
    description: "Costs depend on location and traffic data, higher for high-traffic areas"
  }
]

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
      ease: "easeOut",
    },
  },
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="max-width-wrapper section-padding">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-4xl"
            >
              <motion.h1
                variants={itemVariants}
                className="mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-center"
              >
                About{" "}
                <span className="font-normal">Swivimedia</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mb-16 text-lg text-muted-foreground text-center max-w-2xl mx-auto"
              >
                Understanding the landscape of traditional advertising costs and how clipper marketing revolutionizes brand reach.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* CPM Article Section */}
        <section className="py-20 md:py-32 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-8 text-center">
                What's the Traditional Paid Ads CPM Cost?
              </h2>

              <div className="prose prose-lg max-w-none mb-12">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  The cost per thousand impressions (CPM) for traditional paid ads varies widely depending on the medium, audience, and other factors like seasonality or competition. Based on available data, here are some benchmarks for traditional advertising CPMs:
                </p>
              </div>

              {/* CPM Data Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {cpmData.map((item, index) => (
                  <motion.div
                    key={item.medium}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <item.icon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg font-normal">{item.medium}</CardTitle>
                        </div>
                        <div className="text-2xl font-light text-primary">{item.cpm}</div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Additional Context */}
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  These figures reflect traditional media's reliance on estimated viewership or distribution metrics, unlike digital ads where impressions are more precisely tracked. Factors like geographic targeting, ad size, or broadcast timing can significantly affect costs.
                </p>

                <p>
                  For instance, holiday seasons often see higher CPMs due to increased competition for ad space. Television CPMs can spike during high-demand events like the Super Bowl, where CPMs may still be comparable to regular programming due to massive viewership.
                </p>

                <p>
                  For a more precise estimate, you'd need to specify the medium, target audience, or market, as these drive significant variation. If you're comparing to digital, online CPMs often range from $3–$10 for display ads, though platforms like Google or Facebook can see higher or lower rates depending on targeting.
                </p>
              </div>

              {/* Comparison Section */}
              <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-xl font-medium mb-4">How Swivimedia Changes the Game</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div>
                        <h4 className="font-medium mb-2 text-muted-foreground">Traditional Advertising</h4>
                        <p className="text-2xl font-light mb-2">$4 - $30 CPM</p>
                        <p className="text-sm text-muted-foreground">Estimated viewership, limited targeting</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-primary">Clipper Marketing</h4>
                        <p className="text-2xl font-light text-primary mb-2">$0.50 - $3 CPM</p>
                        <p className="text-sm text-muted-foreground">Authentic content, precise tracking</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      Save up to <span className="font-semibold text-primary">80-95%</span> on your advertising costs while achieving higher engagement rates through authentic, user-generated content.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
} 