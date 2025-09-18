"use client"

import { ClippersFAQ } from "@/components/clippers/faq"

export default function ClippersFAQPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-400">
          Find answers to common questions about joining and participating in Swivi Clippers.
        </p>
      </div>

      <ClippersFAQ />
    </div>
  )
}