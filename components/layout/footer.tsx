"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function Footer() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine logo based on theme
  const logoSrc = mounted && resolvedTheme === 'light'
    ? "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/invertedlogo.png"
    : "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/SwiviLogo.png"

  return (
    <footer className="border-t border-black/10 mt-auto relative bg-background">
      <div className="max-width-wrapper section-padding py-12 md:py-16">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Logo and tagline */}
          <div>
            <Link href="/" className="inline-flex items-center mb-4">
              <Image
                src={logoSrc}
                alt="Swivi"
                width={250}
                height={84}
                className="h-20 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Creator-powered organic distribution for brands, media, and founders who care about scale.
            </p>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t border-black/5 w-full">
            <div className="flex flex-col items-center space-y-2">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Swivi. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </Link>
                <span className="text-muted-foreground">•</span>
                <ThemeToggle size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 