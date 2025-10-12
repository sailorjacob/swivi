"use client"

import { Hero } from "@/components/marketing/hero"
// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { CreatorViewsCalculator } from "@/components/marketing/creator-views-calculator"
import { MusicHubPreview } from "@/components/marketing/music-hub-preview"
import { Testimonials } from "@/components/marketing/testimonials"
import { Features } from "@/components/marketing/features"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { FAQ } from "@/components/marketing/faq"
import { Showcase } from "@/components/marketing/showcase"
import { Founder } from "@/components/marketing/founder"
import { CampaignsPreview } from "@/components/marketing/campaigns-preview"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useEffect } from "react"

function LightThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force light theme on mount
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
    document.body.classList.remove('dark')

    // Override CSS custom properties for light theme
    const root = document.documentElement
    root.style.setProperty('--background', '255 255 255')
    root.style.setProperty('--foreground', '0 0 0')
    root.style.setProperty('--muted', '244 244 245')
    root.style.setProperty('--muted-foreground', '113 113 122')
    root.style.setProperty('--popover', '255 255 255')
    root.style.setProperty('--popover-foreground', '0 0 0')
    root.style.setProperty('--card', '255 255 255')
    root.style.setProperty('--card-foreground', '0 0 0')
    root.style.setProperty('--border', '228 228 231')
    root.style.setProperty('--input', '228 228 231')
    root.style.setProperty('--primary', '0 0 0')
    root.style.setProperty('--primary-foreground', '255 255 255')
    root.style.setProperty('--secondary', '244 244 245')
    root.style.setProperty('--secondary-foreground', '0 0 0')
    root.style.setProperty('--accent', '244 244 245')
    root.style.setProperty('--accent-foreground', '0 0 0')
    root.style.setProperty('--destructive', '239 68 68')
    root.style.setProperty('--destructive-foreground', '255 255 255')
    root.style.setProperty('--ring', '0 0 0')

    // Cleanup function to restore dark theme
    return () => {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
      document.body.classList.add('dark')
    }
  }, [])

  return <>{children}</>
}

export default function HomePage() {
  return (
    <LightThemeWrapper>
      <Header />
      <main className="flex min-h-screen flex-col pt-16 bg-white text-black">
        <Hero />
        <Founder />
        <CreatorViewsCalculator />
        {/* <CampaignsPreview /> */}
        {/* <MusicHubPreview /> */}
        {/* <Testimonials /> */}
        <div className="space-y-8 md:space-y-16">
          {/* <Showcase /> */}
          <Features />
          <HowItWorks />
          <FAQ />
        </div>
      </main>
      <Footer />
    </LightThemeWrapper>
  )
} 