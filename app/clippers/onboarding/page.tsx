"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ClippersOnboarding } from "@/components/clippers/onboarding"

export default function ClippersOnboardingPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <section className="py-20 md:py-32">
          <div className="max-width-wrapper section-padding">
            <ClippersOnboarding />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
