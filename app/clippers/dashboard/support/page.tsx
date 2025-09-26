"use client"

import { ClippersFAQ } from "../../../../components/clippers/faq"


export default function SupportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">FAQ</h1>
        <p className="text-muted-foreground">Find answers to common questions.</p>
      </div>

      {/* Quick Stats - Hidden */}
      {/* <QuickStats /> */}

      {/* FAQ Content */}
      <ClippersFAQ />
    </div>
  )
}
