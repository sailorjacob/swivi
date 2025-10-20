"use client"

// Force this layout to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "react-hot-toast"

function ClippersThemeEnforcer({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme("dark")
  }, [setTheme])

  return <>{children}</>
}

export default function ClippersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryProvider>
        <div className="min-h-screen bg-background text-foreground">
          <ClippersThemeEnforcer>
            {children}
          </ClippersThemeEnforcer>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            },
          }}
        />
      </QueryProvider>
    </ThemeProvider>
  )
}
