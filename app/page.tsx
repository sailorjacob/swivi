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

    // Add comprehensive CSS overrides for dark theme classes
    const styleId = 'light-theme-overrides'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        /* Light theme overrides for dark mode classes */
        .light .dark\\:bg-neutral-900,
        .light .dark\\:bg-neutral-800,
        .light .dark\\:bg-black {
          background-color: white !important;
        }

        .light .dark\\:text-white {
          color: black !important;
        }

        .light .dark\\:text-neutral-300,
        .light .dark\\:text-neutral-400 {
          color: rgb(113 113 122) !important;
        }

        .light .dark\\:border-neutral-800,
        .light .dark\\:border-neutral-700 {
          border-color: rgb(228 228 231) !important;
        }

        .light .dark\\:from-neutral-900,
        .light .dark\\:to-neutral-800 {
          --tw-gradient-from: white !important;
          --tw-gradient-to: rgb(244 244 245) !important;
        }

        .light .dark\\:bg-gradient-to-br {
          background: linear-gradient(to bottom right, white, rgb(244 244 245)) !important;
        }

        /* Specific component overrides */
        .light .bg-neutral-900\\/40 {
          background-color: rgba(255, 255, 255, 0.4) !important;
        }

        .light .bg-neutral-800\\/30 {
          background-color: rgba(244, 244, 245, 0.3) !important;
        }

        .light .border-neutral-800\\/50 {
          border-color: rgba(228, 228, 231, 0.5) !important;
        }

        .light .border-neutral-700\\/30 {
          border-color: rgba(228, 228, 231, 0.3) !important;
        }

        .light .text-neutral-300 {
          color: rgb(113 113 122) !important;
        }

        .light .text-neutral-400 {
          color: rgb(161 161 170) !important;
        }

        /* Button and interactive element overrides */
        .light .hover\\:bg-neutral-800\\/50:hover {
          background-color: rgba(244, 244, 245, 0.5) !important;
        }

        .light .hover\\:border-neutral-600\\/40:hover {
          border-color: rgba(228, 228, 231, 0.4) !important;
        }

        /* Glass morphism and backdrop effects */
        .light .backdrop-blur-sm {
          backdrop-filter: blur(8px) !important;
          background-color: rgba(255, 255, 255, 0.8) !important;
        }

        /* Hero section specific overrides */
        .light .bg-gradient-to-b {
          background: linear-gradient(to bottom, white, rgb(244 244 245)) !important;
        }

        /* Card and container overrides */
        .light .bg-neutral-900\\/20 {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }

        .light .bg-black\\/20 {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }

        /* Text color hierarchy */
        .light h1, .light h2, .light h3, .light h4, .light h5, .light h6 {
          color: black !important;
        }

        .light p {
          color: rgb(113 113 122) !important;
        }
      `
      document.head.appendChild(style)
    }

    // Cleanup function to restore dark theme
    return () => {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
      document.body.classList.add('dark')

      // Remove the light theme overrides
      const styleElement = document.getElementById(styleId)
      if (styleElement) {
        styleElement.remove()
      }
    }
  }, [])

  return <>{children}</>
}

export default function HomePage() {
  return (
    <LightThemeWrapper>
      <div className="light">
        <Header />
        <main className="flex min-h-screen flex-col pt-16">
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
      </div>
    </LightThemeWrapper>
  )
} 