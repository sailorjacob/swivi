"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "react-hot-toast"
import { FloatingBranding } from "@/components/ui/floating-branding"

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
      <AuthProvider>
        <QueryProvider>
          <div className="min-h-screen bg-background text-foreground relative">
            <ClippersThemeEnforcer>
              {children}
            </ClippersThemeEnforcer>

            {/* Clipper-specific branding */}
            <FloatingBranding
              src="https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/233.png"
              alt="Swivi Clipper Branding"
              position="top-right"
              size="sm"
            />
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
      </AuthProvider>
    </ThemeProvider>
  )
}
