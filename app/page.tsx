"use client"

import { HeroOriginal } from "@/components/marketing/hero-original"
import { HeroVideo } from "@/components/marketing/hero-video"
// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { Positioning } from "@/components/marketing/positioning"
import { MetricsStrip } from "@/components/marketing/metrics-strip"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { CampaignStructure } from "@/components/marketing/campaign-structure"
import { UseCases } from "@/components/marketing/use-cases"
import { Features } from "@/components/marketing/features"
import { WhoIsFor } from "@/components/marketing/who-is-for"
import { SocialProof } from "@/components/marketing/social-proof"
import { FinalCTA } from "@/components/marketing/final-cta"
import { Founder } from "@/components/marketing/founder"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MoneyTrail } from "@/components/effects/money-trail"

export default function HomePage() {
  return (
    <>
      <MoneyTrail />
      <Header />
      <main className="relative">
        {/* Original Hero - Shows first */}
        <HeroOriginal />
        
        {/* Video Hero - Sticky, stays in background as you scroll */}
        <HeroVideo />
        
        {/* Rest of content scrolls over video with solid background */}
        <div className="relative z-20">
          {/* Solid background overlay to prevent video bleed-through */}
          <div className="absolute inset-0 bg-background -z-10" />
          
          <div className="relative bg-background">
            <Founder />
            <Positioning />
            <MetricsStrip />
            <HowItWorks />
            <CampaignStructure />
            <UseCases />
            <Features />
            <WhoIsFor />
            <SocialProof />
            <FinalCTA />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 