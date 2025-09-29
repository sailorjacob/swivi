"use client"

import Link from "next/link"
import { ArrowRight, TrendingUp, DollarSign, Users, BarChart3, ChevronLeft, ChevronRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DarkThemeWrapper } from "../layout-wrapper"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

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

const campaigns = [
  {
    id: 1,
    title: "Zeussy Clips",
    description: "Join our exclusive community of content creators and earn $1,000 for every 1M views generated.",
    highlights: [
      { value: "$1K", label: "Per 1M Views" },
      { value: "15+", label: "Active Clippers" },
      { value: "24/7", label: "Support" },
      { value: "100%", label: "Satisfaction" }
    ],
    image: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png",
    link: "https://whop.com/zeussy/",
    linkText: "Learn More"
  },
]

const images = [
  {
    src: "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/sportzplayz.png",
    alt: "Zeussy Campaign"
  }
]

const ImageSwitcher = () => {
  return (
    <div className="relative w-full max-w-md aspect-[4/3]">
      <motion.div
        className="absolute rounded-2xl overflow-hidden shadow-lg"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <Image
          src={images[0].src}
          alt={images[0].alt}
          fill
          className="object-cover"
          priority
        />
      </motion.div>
    </div>
  )
}

const CampaignCardStack = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % campaigns.length)
  }

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length)
  }

  const goToCard = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="relative">
      {/* Navigation Dots */}
      <div className="flex justify-center mb-8 space-x-2">
        {campaigns.map((_, index) => (
          <button
            key={index}
            onClick={() => goToCard(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>

      {/* Card Stack */}
      <div className="relative h-[500px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {campaigns.map((campaign, index) => {
            const isActive = index === currentIndex

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{
                  opacity: isActive ? 1 : 0,
                  scale: isActive ? 1 : 0.9,
                  y: isActive ? 0 : 20,
                  zIndex: isActive ? 30 : 10
                }}
                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={`absolute inset-0 w-full max-w-4xl mx-auto ${
                  isActive ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <div className="grid md:grid-cols-2 gap-12 items-center h-full">
                  {/* Content Side - Only show when active */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="space-y-6"
                    >
                      <h3 className="text-2xl md:text-3xl font-normal">{campaign.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {campaign.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {campaign.highlights.map((highlight, idx) => (
                          <div key={idx} className="bg-black/5 rounded-xl p-4">
                            <div className="text-2xl font-light mb-1">{highlight.value}</div>
                            <div className="text-xs text-muted-foreground">{highlight.label}</div>
                          </div>
                        ))}
                      </div>

                      <Link
                        href={campaign.link}
                        target={campaign.link.startsWith('http') ? "_blank" : "_self"}
                        rel={campaign.link.startsWith('http') ? "noopener noreferrer" : ""}
                        className="inline-flex items-center text-sm font-normal border border-foreground px-6 py-3 rounded-full bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
                      >
                        {campaign.linkText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </motion.div>
                  )}

                  {/* Image Side */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex justify-center lg:justify-end"
                  >
                    <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                      <Image
                        src={campaign.image}
                        alt={campaign.title}
                        fill
                        className="object-cover"
                        priority={isActive}
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevCard}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-black/10 flex items-center justify-center hover:bg-background/90 transition-all duration-300"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={nextCard}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-black/10 flex items-center justify-center hover:bg-background/90 transition-all duration-300"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

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

const BrandsPage = () => {
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
              }}
            />
          </div>

          <div className="max-width-wrapper section-padding py-20 md:py-32 relative z-10">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-6xl"
            >
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <motion.h1
                    variants={itemVariants}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight"
                  >
                    Scale Your Brand with{" "}
                    <span className="font-normal">Viral Content</span>
                  </motion.h1>

                  <motion.p
                    variants={itemVariants}
                    className="text-base sm:text-lg text-muted-foreground max-w-xl"
                  >
                    Partner with top creators and our expert clipper network to create
                    viral content that drives real engagement and growth for your brand.
                  </motion.p>

                  <motion.div variants={itemVariants}>
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
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex justify-center lg:justify-end"
                >
                  <ImageSwitcher />
                </motion.div>
              </div>
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

        {/* Featured Campaigns - Stackable Cards */}
        <section className="py-20 md:py-32 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
                Featured Campaigns
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                See how we've helped brands create viral content that drives real engagement and growth.
              </p>
            </div>

            <div className="relative">
              <CampaignCardStack />
            </div>
          </div>
        </section>

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

export default BrandsPage