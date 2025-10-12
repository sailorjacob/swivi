"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { motion, easeOut } from "framer-motion"
import { TrendingUp, DollarSign, Users, BarChart3 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DarkThemeWrapper } from "../layout-wrapper"
import Image from "next/image"

const stats = [
  {
    icon: BarChart3,
    label: "Active Campaigns",
    value: "12+",
    description: "Growing network"
  },
  {
    icon: TrendingUp,
    label: "Total Views",
    value: "50M+",
    description: "Across platforms"
  },
  {
    icon: DollarSign,
    label: "Avg. ROI",
    value: "3.2x",
    description: "For brands"
  },
  {
    icon: Users,
    label: "Creator Network",
    value: "24+",
    description: "Top creators"
  },
]

const features = [
  {
    title: "Premium Content Access",
    description: "Work with verified creators who have millions of followers and proven track records of viral content."
  },
  {
    title: "Expert Clipper Network",
    description: "Our community of professional clippers knows exactly how to create engaging, viral-worthy content."
  },
  {
    title: "Performance Analytics",
    description: "Track your campaign's performance with detailed analytics and insights across all platforms."
  },
  {
    title: "Flexible Campaign Options",
    description: "Choose from various campaign types and pricing models to match your brand's goals and budget."
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
      ease: easeOut,
    },
  },
}

export default function BrandsPage() {
  return (
    <DarkThemeWrapper>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full bg-gray-800/20"
              initial={{ x: "-50%", y: "-50%" }}
              animate={{
                x: ["0%", "100%", "0%"],
                y: ["0%", "50%", "0%"],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          <div className="max-width-wrapper section-padding py-20 md:py-32 relative z-10">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-3xl"
            >
              <motion.h1
                variants={itemVariants}
                className="mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight"
              >
                Scale Your Brand with{" "}
                <span className="font-normal">Viral Content</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mb-10 text-base sm:text-lg text-muted-foreground max-w-xl"
              >
                Partner with top creators and our expert clipper network to create
                viral content that drives real engagement and growth for your brand.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                <Link
                  href="https://calendly.com/bykevingeorge/30min?month=2025-05"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-normal bg-foreground text-background px-8 py-4 rounded-full hover:bg-foreground/90 transition-all duration-300 group"
                >
                  Launch Your Campaign
                  <motion.span
                    className="ml-2"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative w-full md:w-auto"
                >
                  <Image
                    src="https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/Caleb%20Simpson%20x%20Ed%20Sheeran%20Pizza%20Review.jpg"
                    alt="Caleb Simpson x Ed Sheeran Pizza Review Campaign"
                    width={400}
                    height={300}
                    className="rounded-lg shadow-lg"
                    priority
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 md:py-32 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                  <div className="text-2xl md:text-3xl font-light mb-1">{stat.value}</div>
                  <div className="text-sm font-normal mb-1">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.description}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Featured Campaign - Temporarily Hidden */}
        {/* <section className="py-20 md:py-32 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
                Featured Campaign
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                See how we helped Caleb Simpson create viral pizza review content featuring Ed Sheeran collaboration.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl opacity-90">🍕</span>
                  <h3 className="text-2xl font-normal">Caleb Simpson x Ed Sheeran</h3>
                </div>
                <p className="text-muted-foreground">
                  Music and food collide in this viral collaboration featuring Ed Sheeran and pizza reviews.
                  Our clipper network transformed authentic content into millions of views across platforms.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <span className="mr-2">•</span>
                    Celebrity collaboration content
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="mr-2">•</span>
                    Multi-platform distribution
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="mr-2">•</span>
                    Authentic creator-brand partnerships
                  </li>
                </ul>
                <Link
                  href="/case-studies/owning-manhattan"
                  className="inline-flex items-center text-sm font-normal bg-foreground text-background px-6 py-3 rounded-full hover:bg-foreground/90 transition-all duration-300"
                >
                  View Case Study
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="bg-black/5 rounded-2xl p-8"
              >
                <div className="space-y-4">
                  <h4 className="font-normal">Campaign Results</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background p-4 rounded-xl">
                      <div className="text-2xl font-light mb-1">2.1M</div>
                      <div className="text-xs text-muted-foreground">Views Generated</div>
                    </div>
                    <div className="bg-background p-4 rounded-xl">
                      <div className="text-2xl font-light mb-1">84%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="bg-background p-4 rounded-xl">
                      <div className="text-2xl font-light mb-1">$800</div>
                      <div className="text-xs text-muted-foreground">Budget</div>
                    </div>
                    <div className="bg-background p-4 rounded-xl">
                      <div className="text-2xl font-light mb-1">3 days</div>
                      <div className="text-xs text-muted-foreground">Timeline</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section> */}

        {/* Features */}
        <section className="py-20 md:py-32 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
                Why Choose Swivi
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="space-y-2"
                >
                  <h3 className="font-normal text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6">
                Ready to Scale Your Brand?
              </h2>
              <p className="text-muted-foreground mb-8">
                Book a call with our team to discuss how we can help you create
                viral content that drives real results.
              </p>

              <Link
                href="https://calendly.com/bykevingeorge/30min?month=2025-05"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-normal bg-foreground text-background px-8 py-4 rounded-full hover:bg-foreground/90 transition-all duration-300 group"
              >
                Schedule a Call
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="mt-8 text-xs text-muted-foreground">
                Free consultation • No commitment required • Start scaling today
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </DarkThemeWrapper>
  )
}