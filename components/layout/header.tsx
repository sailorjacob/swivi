"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const navigation = [
  { name: "For Brands", href: "/" },
  { name: "Clippers", href: "/clippers" },
  { name: "Music Hub", href: "/music-hub" },
  { name: "Community", href: "/community" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-black/5">
      <nav className="max-width-wrapper section-padding flex h-24 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs//swivi%20logo.png"
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
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-light text-foreground/80 transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="https://calendly.com/bykevingeorge/30min?month=2025-05"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-normal bg-foreground text-background px-6 py-3 rounded-sm hover:bg-foreground/90 transition-colors"
          >
            Launch a Campaign
          </Link>
          <Link
            href="/clippers"
            className="text-sm font-normal border border-foreground px-6 py-3 rounded-sm hover:bg-foreground hover:text-background transition-colors"
          >
            Become a Clipper
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-sm p-2"
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
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-sm font-light text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="https://calendly.com/bykevingeorge/30min?month=2025-05"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-4 text-sm font-normal bg-foreground text-background px-6 py-3 rounded-sm hover:bg-foreground/90 transition-colors text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Launch a Campaign
            </Link>
            <Link
              href="/clippers"
              className="block mt-2 text-sm font-normal border border-foreground px-6 py-3 rounded-sm hover:bg-foreground hover:text-background transition-colors text-center"
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