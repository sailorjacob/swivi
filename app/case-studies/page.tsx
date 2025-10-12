"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DarkThemeWrapper } from "../layout-wrapper"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function CaseStudiesPage() {
  return (
    <DarkThemeWrapper>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <section className="py-20 md:py-32">
          <div className="max-width-wrapper section-padding">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-8 text-white">
                Case Studies
              </h1>
              <p className="text-xl text-neutral-300 max-w-3xl mx-auto mb-12 leading-relaxed">
                Real results from real campaigns. Explore our most successful partnerships and see how we've helped brands achieve exceptional growth.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-neutral-900/40 backdrop-blur-sm rounded-2xl border border-neutral-800/50 p-8 md:p-12 text-center">
                <h2 className="text-2xl md:text-3xl font-light mb-6 text-white">
                  Featured Case Study
                </h2>
                <p className="text-neutral-300 mb-8 text-lg leading-relaxed">
                  Discover how we helped Owning Manhattan achieve massive reach and engagement through our expert clipper network.
                </p>

                <Link
                  href="/case-studies/owning-manhattan"
                  className="inline-flex items-center text-lg font-medium bg-white text-black px-8 py-4 rounded-full hover:bg-neutral-200 transition-all duration-300 group"
                >
                  View Owning Manhattan Case Study
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <p className="mt-6 text-sm text-neutral-400">
                  More case studies coming soon as we continue to build our portfolio of successful campaigns.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </DarkThemeWrapper>
  )
}
