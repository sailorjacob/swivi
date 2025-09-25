"use client"

import { Header } from "@/components/layout"
import { Footer } from "@/components/layout"
import { LiveCampaigns } from "@/components/campaigns/live-campaigns"

export default function CampaignsPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <section className="py-20 md:py-32">
          <div className="max-width-wrapper section-padding">
            <LiveCampaigns />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
