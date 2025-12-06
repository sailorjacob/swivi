"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { CreatorsFAQ } from "../../../../components/creators/faq"

export default function CreatorsFAQPage() {
  return (
    <div className="space-y-8">
      <CreatorsFAQ />
    </div>
  )
}