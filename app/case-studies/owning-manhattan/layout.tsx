"use client"

// Force this layout to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

export default function OwningManhattanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
