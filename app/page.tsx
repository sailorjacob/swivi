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
    root.style.setProperty('--background', '250 250 250')  // Softer off-white
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

        /* Fix animated background elements for light theme */
        .light .bg-foreground\\/10 {
          background-color: rgba(0, 0, 0, 0.1) !important;
        }

        .light [class*="bg-foreground\\/"] {
          background-color: rgba(0, 0, 0, 0.1) !important;
        }

        /* Override any yellow backgrounds that might appear in overflow */
        .light [style*="yellow"],
        .light [class*="yellow"],
        .light [style*="background-color: rgb(255, 255, 0)"],
        .light [style*="background-color: #ffff00"],
        .light [style*="background-color: yellow"] {
          background-color: transparent !important;
          color: inherit !important;
        }

        /* Fix any elements with yellow backgrounds in light theme */
        .light div[style*="yellow"],
        .light section[style*="yellow"],
        .light main[style*="yellow"] {
          background-color: transparent !important;
        }

        /* Fix any scrollbar or overflow backgrounds */
        .light ::-webkit-scrollbar-track {
          background-color: transparent !important;
        }

        .light ::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3) !important;
        }

        .light ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(107, 114, 128, 0.4) !important;
        }

        /* Ensure page backgrounds are white */
        .light body,
        .light html {
          background-color: white !important;
        }

        /* Fix root element background */
        .light :root {
          background-color: white !important;
        }

        /* Fix main layout containers that might have yellow overflow */
        .light main {
          background-color: white !important;
        }

        .light .max-width-wrapper {
          background-color: transparent !important;
        }

        .light section {
          background-color: transparent !important;
        }

        /* Fix any overflow containers that might show yellow */
        .light [class*="overflow-hidden"],
        .light [class*="overflow-auto"],
        .light [class*="overflow-scroll"] {
          background-color: transparent !important;
        }

        /* Ensure page backgrounds are white but don't break transparency */
        .light body,
        .light html {
          background-color: white !important;
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

        /* Footer specific overrides */
        .light .text-neutral-400 {
          color: rgb(161 161 170) !important;
        }

        .light .text-neutral-500 {
          color: rgb(113 113 122) !important;
        }

        /* Logo and branding overrides */
        .light img {
          filter: invert(0) !important;
        }

        /* Specific text elements that need dark color on light theme */
        .light .text-white {
          color: black !important;
        }

        .light .text-gray-300,
        .light .text-gray-400 {
          color: rgb(113 113 122) !important;
        }

        /* Marketing section text overrides */
        .light [class*="text-neutral"] {
          color: rgb(113 113 122) !important;
        }

        /* Statistics and metrics text */
        .light .text-4xl, .light .text-5xl, .light .text-6xl {
          color: black !important;
        }

        /* Link text in light theme */
        .light a {
          color: black !important;
        }

        .light a:hover {
          color: rgb(64 64 64) !important;
        }

        /* Button text in light theme */
        .light button {
          color: black !important;
        }

        /* Icon colors in light theme */
        .light svg {
          color: black !important;
        }

        /* Specific footer links */
        .light .hover\\:text-white:hover {
          color: black !important;
        }

        /* Footer logo inversion for light theme */
        .light img[alt="Swivi"] {
          filter: invert(1) !important;
        }

        /* Footer specific text colors */
        .light footer .text-muted-foreground {
          color: rgb(113 113 122) !important;
        }

        .light footer .text-foreground {
          color: black !important;
        }

        /* Footer link hover states */
        .light footer a:hover {
          color: rgb(64 64 64) !important;
        }

        /* Footer background gradient for light theme */
        .light footer .bg-gradient-to-t {
          background: linear-gradient(to top, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1), transparent) !important;
        }

        /* Features section use cases text */
        .light .text-muted-foreground\\/60 {
          color: rgb(113 113 122) !important;
        }

        /* Creator calculator comparison text */
        .light ul li {
          color: rgb(113 113 122) !important;
        }

        .light h4 {
          color: black !important;
        }

        /* Statistics cards text */
        .light .text-primary {
          color: black !important;
        }

        /* Calculator popup text */
        .light .bg-background\\/95 {
          background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .light .border-border\\/50 {
          border-color: rgb(228 228 231) !important;
        }

        /* Button text styling for light theme - only for non-hover states */
        .light .bg-foreground:not(:hover) {
          color: rgb(255, 255, 255) !important;
        }

        .light button[class*="bg-foreground"]:not(:hover) {
          color: rgb(255, 255, 255) !important;
        }

        /* Ensure button text is white when background is filled on hover */
        .light button[class*="bg-foreground"]:hover,
        .light .hover\\:bg-foreground:hover,
        .light [class*="hover:bg-foreground"]:hover {
          color: rgb(255, 255, 255) !important;
          background-color: rgb(0, 0, 0) !important;
        }

        /* Ensure button hover states work correctly */
        .light a[class*="hover:bg-foreground"]:hover,
        .light button[class*="hover:bg-foreground"]:hover {
          color: rgb(255, 255, 255) !important;
          background-color: rgb(0, 0, 0) !important;
        }

        /* Header logo - ensure proper inversion for light theme */
        .light header img {
          filter: invert(1) !important;
        }

        /* Statistics cards text consistency */
        .light .text-muted-foreground {
          color: rgb(113 113 122) !important;
        }

        .light .font-light {
          color: black !important;
        }

        /* Modal/popup specific text */
        .light [class*="backdrop-blur"] .text-foreground {
          color: black !important;
        }

        .light [class*="backdrop-blur"] .text-muted-foreground {
          color: rgb(113 113 122) !important;
        }

        /* Calculator results consistency */
        .light .text-2xl,
        .light .text-3xl {
          color: black !important;
        }

        .light .text-xs {
          color: rgb(113 113 122) !important;
        }

        /* Ensure all headings in light theme are black */
        .light h1, .light h2, .light h3, .light h4, .light h5, .light h6 {
          color: black !important;
        }

        /* Button text in calculator */
        .light button[class*="bg-foreground"],
        .light .bg-foreground {
          color: white !important;
        }

        /* Specific calculator button */
        .light .hover\\:bg-foreground\\/90 {
          color: white !important;
        }

        /* Statistics cards - ensure consistent text colors */
        .light .text-muted-foreground {
          color: rgb(113 113 122) !important;
        }

        /* Large statistics numbers */
        .light .text-2xl,
        .light .text-3xl,
        .light .text-4xl {
          color: black !important;
        }

        /* Small statistics labels */
        .light .text-sm {
          color: rgb(113 113 122) !important;
        }

        /* Modal text consistency */
        .light [class*="fixed"] .text-foreground {
          color: black !important;
        }

        .light [class*="fixed"] .text-muted-foreground {
          color: rgb(113 113 122) !important;
        }

        /* Calculator card text */
        .light .border-primary {
          border-color: black !important;
        }

        .light .text-primary {
          color: black !important;
        }

        /* Slider component overrides for light theme */
        .light [class*="slider"] [class*="bg-secondary"] {
          background-color: rgb(228 228 231) !important;
        }

        .light [class*="slider"] [class*="bg-primary"] {
          background-color: black !important;
        }

        .light [class*="slider"] [class*="border-primary"] {
          border-color: black !important;
        }

        .light [class*="slider"] [class*="bg-background"] {
          background-color: white !important;
          border-color: black !important;
        }

        /* Card borders and outlines */
        .light .border {
          border-color: rgb(228 228 231) !important;
        }

        .light .border-t {
          border-color: rgb(228 228 231) !important;
        }

        .light .border-b {
          border-color: rgb(228 228 231) !important;
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