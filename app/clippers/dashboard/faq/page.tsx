"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { ClippersFAQ } from "../../../../components/clippers/faq"

export default function ClippersFAQPage() {
  return (
    <div className="space-y-8">
      <ClippersFAQ />
    </div>
  )
}