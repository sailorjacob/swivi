"use client"

import { Hero } from "@/components/marketing/hero"
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
      <main className="flex min-h-screen flex-col pt-16">
        <Hero />
        <Founder />
        <div className="space-y-8 md:space-y-16">
          <Features />
          <HowItWorks />
          <FAQ />
        </div>
      </main>
      <Footer />
    </>
  )
} 