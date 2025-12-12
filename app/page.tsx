"use client"

import { HeroOriginal } from "@/components/marketing/hero-original"
import { HeroVideo } from "@/components/marketing/hero-video"
// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { Features } from "@/components/marketing/features"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { FAQ } from "@/components/marketing/faq"
import { Founder } from "@/components/marketing/founder"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="relative">
        {/* Original Hero - Shows first */}
        <HeroOriginal />
        
        {/* Video Hero - Sticky, stays in background as you scroll */}
        <HeroVideo />
        
        {/* Rest of content scrolls over video */}
        <div className="relative z-10 bg-background">
          <Founder />
          <div className="space-y-8 md:space-y-16">
            <Features />
            <HowItWorks />
            <FAQ />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 