"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CampaignsShowcase } from "@/components/marketing/campaigns-showcase"
import { DarkThemeWrapper } from "../layout-wrapper"

export default function CampaignsPage() {
  return (
    <DarkThemeWrapper>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <section className="py-20 md:py-32">
          <div className="max-width-wrapper section-padding">
            <CampaignsShowcase />
          </div>
        </section>
      </main>
      <Footer />
    </DarkThemeWrapper>
  )
}
