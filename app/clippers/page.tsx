"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, TrendingUp, DollarSign, Users, BarChart3 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const stats = [
  {
    icon: BarChart3,
    label: "Active Clippers",
    value: "87+",
    description: "Growing community"
  },
  {
    icon: TrendingUp,
    label: "Viral Clips",
    value: "2.3K",
    description: "This month"
  },
  {
    icon: DollarSign,
    label: "Avg. Earnings",
    value: "XXX",
    description: "Per clipper/month"
  },
  {
    icon: Users,
    label: "Creator Partners",
    value: "24",
    description: "Top creators"
  },
]

const steps = [
  {
    number: "01",
    title: "Join the Community",
    description: "Apply through our exclusive Whop community. Get instant access to creator content and our clipper dashboard.",
  },
  {
    number: "02",
    title: "Create Viral Clips",
    description: "Access high-quality content from top creators. Use our guidelines to create clips that capture attention and drive engagement.",
  },
  {
    number: "03",
    title: "Earn & Scale",
    description: "Submit your clips for review. Approved clips earn immediate payouts. Track your performance and grow your earnings.",
  },
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

export default function ClippersPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full bg-black/3"
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
                Join Swivi{" "}
                <span className="font-normal">Clippers</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mb-10 text-base sm:text-lg text-muted-foreground max-w-xl"
              >
                Turn your editing skills into income. Create viral clips for top creators 
                and earn competitive payouts for every approved submission.
              </motion.p>

              <motion.div variants={itemVariants}>
                <Link
                  href="http://whop.com/swiviclippers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-normal bg-foreground text-background px-8 py-4 rounded-sm hover:bg-foreground/90 transition-all group"
                >
                  Join
                  <motion.span
                    className="ml-2"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
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

        {/* How It Works */}
        <section className="py-20 md:py-32 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                Simple process, real earnings. Start creating viral content today.
              </p>
            </div>

            <div className="space-y-16">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-8 items-start"
                >
                  <div className="flex-shrink-0">
                    <span className="text-3xl font-light text-muted-foreground">
                      {step.number}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-normal text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 md:py-32 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
                Why Join Swivi Clippers
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div>
                  <h3 className="font-normal text-lg mb-2">Competitive Payouts</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Earn $20-100+ per approved clip. Top performers earn $2,000+ monthly.
                  </p>
                </div>
                <div>
                  <h3 className="font-normal text-lg mb-2">Premium Content Access</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Work with content from verified creators with millions of followers.
                  </p>
                </div>
                <div>
                  <h3 className="font-normal text-lg mb-2">Growth Support</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get coaching, feedback, and resources to improve your clipping skills.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div>
                  <h3 className="font-normal text-lg mb-2">Performance Analytics</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Track your clips' performance, earnings, and growth over time.
                  </p>
                </div>
                <div>
                  <h3 className="font-normal text-lg mb-2">Flexible Schedule</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Work on your own time. Create as many or as few clips as you want.
                  </p>
                </div>
                <div>
                  <h3 className="font-normal text-lg mb-2">Community Network</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Connect with other clippers, share strategies, and grow together.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6">
                Ready to Start Earning?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join our exclusive community of content creators and start 
                turning your skills into income today.
              </p>
              
              <Link
                href="http://whop.com/swiviclippers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-normal bg-foreground text-background px-8 py-4 rounded-sm hover:bg-foreground/90 transition-all group"
              >
                Join
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="mt-8 text-xs text-muted-foreground">
                Free to join • No experience required • Start earning immediately
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
} 