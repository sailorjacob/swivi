"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CaseStudyStories } from "@/components/case-studies/case-study-stories"

export default function CaseStudiesPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <CaseStudyStories />
      </main>
      <Footer />
    </>
  )
}
