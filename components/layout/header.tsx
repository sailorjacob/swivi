"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"

const navigation = [
  { 
    name: "For Brands", 
    href: "/brands",
    dropdown: [
      { name: "Case Studies", href: "/case-studies", description: "Previous campaign results" }
    ]
  },
  { 
    name: "Clippers", 
    href: "/clippers",
    dropdown: [
      { name: "Live Activations", href: "/activations", description: "Current earning opportunities" },
      { name: "Platform Demo", href: "/clippers-demo", description: "Try the complete clipper experience" }
    ]
  },
  { name: "About", href: "/about" },
  // { name: "Music Hub", href: "/music-hub" },
  // { name: "Community", href: "/community" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-black/5">
      <nav className="max-width-wrapper section-padding flex h-24 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/SwiviLogo.png"
            alt="Swivi"
            width={300}
            height={100}
            className="h-16 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-8">
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
                <div className="absolute top-full left-0 mt-2 w-72 bg-neutral-900 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    {item.dropdown.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.name}
                        href={dropdownItem.href}
                        className="block px-4 py-3 hover:bg-neutral-800 transition-colors"
                      >
                        <div className="font-medium text-sm text-white">
                          {dropdownItem.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
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
            className="text-sm font-normal bg-foreground text-background px-6 py-3 rounded-full hover:bg-foreground/90 transition-all duration-300"
          >
            Launch a Campaign
          </Link>
          <Link
            href="https://discord.gg/CtZ4tecJ7Y"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-normal border border-foreground px-6 py-3 rounded-full bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Become a Clipper
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-full p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Open main menu</span>
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
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
            <Link
              href="https://discord.gg/CtZ4tecJ7Y"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-sm font-normal border border-foreground px-6 py-3 rounded-full bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Become a Clipper
            </Link>
          </div>
        </div>
      )}
    </header>
  )
} 