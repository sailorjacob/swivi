"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CampaignsShowcase } from "@/components/marketing/campaigns-showcase"

export default function CaseStudiesPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <section className="py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="max-width-wrapper section-padding">
            <CampaignsShowcase showHeader={true} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
