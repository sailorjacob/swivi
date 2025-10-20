"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { Menu, X, ChevronDown } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const navigation = [
  {
    name: "For Brands",
    href: "/brands",
    dropdown: [
      { name: "Case Studies", href: "/case-studies", description: "Previous campaign results" }
    ]
  },
  { name: "About", href: "/about" },
  // { name: "Music Hub", href: "/music-hub" },
  // { name: "Community", href: "/community" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLightTheme, setIsLightTheme] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    // Check current theme
    const checkTheme = () => {
      const isLight = !document.documentElement.classList.contains('dark') ||
                     document.documentElement.getAttribute('data-theme') === 'light'
      setIsLightTheme(isLight)
    }

    checkTheme()

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    })

    return () => observer.disconnect()
  }, [])

  return (
    <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-black/5">
      <nav className="max-width-wrapper section-padding flex h-24 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/inverted2.png"
            alt="Swivi"
            width={300}
            height={100}
            className="h-16 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-8">
          <ThemeToggle />
          {navigation.map((item) => (
            <div key={item.name} className="relative group">
              <Link
                href={item.href}
                className="text-sm font-light text-foreground/80 transition-colors hover:text-foreground flex items-center gap-1"
              >
                {item.name}
                {item.dropdown && (
                  <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
                )}
              </Link>
              
              {/* Dropdown Menu */}
              {item.dropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="py-3">
                    {item.dropdown.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.name}
                        href={dropdownItem.href}
                        className="block px-5 py-4 hover:bg-muted/50 transition-all duration-200 rounded-md mx-2 my-1"
                      >
                        <div className="font-light text-sm text-foreground">
                          {dropdownItem.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {dropdownItem.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Link
            href="https://calendly.com/bykevingeorge/30min?month=2025-05"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-normal border border-foreground bg-transparent text-foreground px-6 py-3 rounded-full hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Launch a Campaign
          </Link>
          
          {/* Platform Access Button */}
          {session ? (
            <Link
              href={session.user?.role === "ADMIN" ? "/admin" : "/clippers/dashboard"}
              className="text-sm font-normal border border-foreground px-6 py-3 rounded-full bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/clippers/become-a-clipper"
                className="text-sm font-normal border border-foreground px-6 py-3 rounded-full bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
              >
                Become a Clipper
              </Link>
              <Link
                href="/clippers/login"
                className="text-sm font-normal px-6 py-3 rounded-full bg-transparent text-foreground hover:text-foreground/80 transition-all duration-300"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center space-x-3">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-black/5">
          <div className="space-y-1 px-6 py-4">
            {navigation.map((item) => (
              <div key={item.name} className="space-y-1">
                <Link
                  href={item.href}
                  className="block py-2 text-sm font-light text-foreground/80 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
                {item.dropdown && (
                  <div className="pl-4 space-y-1">
                    {item.dropdown.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.name}
                        href={dropdownItem.href}
                        className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {dropdownItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="https://calendly.com/bykevingeorge/30min?month=2025-05"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-4 text-sm font-normal bg-foreground text-background px-6 py-3 rounded-full hover:bg-foreground/90 transition-all duration-300 text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Launch a Campaign
            </Link>
            
            {/* Mobile Platform Access Buttons */}
            {session ? (
              <Link
                href={session.user?.role === "ADMIN" ? "/admin" : "/clippers/dashboard"}
                className="block mt-2 text-sm font-normal border border-foreground px-6 py-3 rounded-full bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/clippers/become-a-clipper"
                  className="block mt-2 text-sm font-normal border border-foreground px-6 py-3 rounded-full bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Become a Clipper
                </Link>
                <Link
                  href="/clippers/login"
                  className="block mt-2 text-sm font-normal px-6 py-3 rounded-full bg-transparent text-foreground hover:text-foreground/80 transition-all duration-300 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
} 