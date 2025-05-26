import { Hero } from "@/components/marketing/hero"
import { CreatorViewsCalculator } from "@/components/marketing/creator-views-calculator"
import { MusicHubPreview } from "@/components/marketing/music-hub-preview"
import { Testimonials } from "@/components/marketing/testimonials"
import { Features } from "@/components/marketing/features"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { FAQ } from "@/components/marketing/faq"
import { CTA } from "@/components/marketing/cta"
import { Showcase } from "@/components/marketing/showcase"
import { Founder } from "@/components/marketing/founder"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <Hero />
        <CreatorViewsCalculator />
        <MusicHubPreview />
        <Testimonials />
        <Founder />
        <div className="space-y-32 md:space-y-48">
          <Showcase />
          <Features />
          <HowItWorks />
          <FAQ />
          <CTA />
        </div>
      </main>
      <Footer />
    </>
  )
} 