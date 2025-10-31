"use client"

// Force this layout to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

// No need for duplicate ThemeProvider - it's inherited from root layout
// This ensures theme consistency across the entire app
export default function ClippersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
