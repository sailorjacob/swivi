"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

const beliefs = [
  "Reach compounds when distribution is coordinated",
  "Organic visibility is most powerful during launch windows",
  "Cost efficiency matters more than vanity metrics",
  "Scale requires systems, not one-off creators",
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
  },
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        
        {/* Video Section */}
        <section className="py-12 md:py-16">
          <div className="max-width-wrapper section-padding">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-4xl"
            >
              <motion.div
                variants={itemVariants}
                className="w-full max-w-3xl mx-auto mb-0 rounded-lg overflow-hidden relative"
              >
                <video 
                  className="w-full h-auto object-cover"
                  src="https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/SwiviBilker.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onError={(e) => {
                    console.error('Video failed to load:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                >
                  <p className="text-center text-muted-foreground p-8">
                    Your browser doesn't support the video tag or the video failed to load.
                  </p>
                </video>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* About Swivi */}
        <section className="py-16 md:py-20 border-t border-black/5">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-light mb-8">
                About Swivi
              </h1>
              
              <div className="space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
                <p>
                  <span className="text-foreground font-normal">Swivi Media is a creator-powered distribution company built for scale.</span>
                </p>
                
                <p>
                  We help brands, media companies, and founders generate massive organic reach by deploying large networks of independent creators across short-form platforms — coordinated, performance-based, and measurable.
                </p>
                
                <p>
                  Our model replaces fragmented influencer campaigns and expensive paid ads with high-velocity organic distribution, designed around launch moments where timing and saturation matter most.
                </p>
              </div>
              
              <div className="mt-10 pt-8 border-t border-black/5">
                <div className="space-y-2 text-lg font-normal">
                  <p>We don't sell content.</p>
                  <p>We don't sell influencers.</p>
                  <p className="text-foreground">We sell distribution efficiency.</p>
                </div>
                <p className="mt-6 text-muted-foreground">
                  Swivi exists to give brands access to the same reach mechanics that power viral moments — without relying on chance.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What We Believe - Video Background */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.3)' }}
            >
              <source src="https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/bg3.mp4" type="video/mp4" />
            </video>
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
          </div>

          <div className="max-width-wrapper section-padding relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-10 text-white">
                What We Believe
              </h2>
              
              <div className="space-y-4">
                {beliefs.map((belief, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-base sm:text-lg text-white">{belief}</p>
                  </motion.div>
                ))}
              </div>
              
              <p className="mt-10 text-white/80 text-base sm:text-lg">
                Our job is to turn short-form content into a repeatable distribution engine.
              </p>
            </motion.div>
          </div>
        </section>

        {/* How Swivi Is Different */}
        <section className="py-16 md:py-20">
          <div className="max-width-wrapper section-padding">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mx-auto max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-8">
                How Swivi Is Different
              </h2>
              
              <div className="space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
                <p>
                  Most agencies optimize for creativity.
                  <br />
                  <span className="text-foreground font-normal">Swivi optimizes for velocity, volume, and cost efficiency.</span>
                </p>
                
                <p>
                  By aligning incentives across hundreds of creators and enforcing quality controls at scale, we're able to deliver tens of millions of views in days — at costs traditional media and paid social can't compete with.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
